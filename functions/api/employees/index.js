function createEmployeeId(firstName, lastName) {
  return `${firstName} ${lastName}`
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

async function hashPin(pin) {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function ensureSchema(DB) {
  await DB.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      work_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      break_minutes INTEGER NOT NULL DEFAULT 0,
      total_hours REAL NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `)
}

export async function onRequestGet(context) {
  const { DB } = context.env
  await ensureSchema(DB)

  const result = await DB.prepare(
    `SELECT id, first_name, last_name, display_name FROM employees ORDER BY display_name ASC`
  ).all()

  const employees = (result.results || []).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    name: row.display_name,
  }))

  return Response.json({ employees })
}

export async function onRequestPost(context) {
  const { DB } = context.env
  await ensureSchema(DB)

  const body = await context.request.json()
  const firstName = (body.firstName || '').trim()
  const lastName = (body.lastName || '').trim()
  const pin = String(body.pin || '').trim()

  if (!firstName || !lastName) {
    return Response.json({ error: 'Voornaam en achternaam zijn verplicht.' }, { status: 400 })
  }

  if (!/^\d{4}$/.test(pin)) {
    return Response.json({ error: 'Pincode moet uit 4 cijfers bestaan.' }, { status: 400 })
  }

  const id = createEmployeeId(firstName, lastName)
  const displayName = `${firstName} ${lastName}`

  const existing = await DB.prepare(`SELECT id FROM employees WHERE id = ?1`).bind(id).first()
  if (existing) {
    return Response.json({ error: 'Deze medewerker bestaat al.' }, { status: 409 })
  }

  const pinHash = await hashPin(pin)
  await DB.prepare(
    `INSERT INTO employees (id, first_name, last_name, display_name, pin_hash) VALUES (?1, ?2, ?3, ?4, ?5)`
  )
    .bind(id, firstName, lastName, displayName, pinHash)
    .run()

  return Response.json({
    employee: {
      id,
      firstName,
      lastName,
      name: displayName,
    },
  })
}
