export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    const json = (data, init = {}) =>
      new Response(JSON.stringify(data), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
        ...init,
      })

    const createEmployeeId = (firstName, lastName) =>
      `${firstName} ${lastName}`
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

    const hashPin = async (pin) => {
      const data = new TextEncoder().encode(pin)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      return Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
    }

    const ensureSchema = async () => {
      await env.DB.exec(`
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

    if (url.pathname === '/api/employees' && request.method === 'GET') {
      await ensureSchema()
      const result = await env.DB.prepare(
        `SELECT id, first_name, last_name, display_name FROM employees ORDER BY display_name ASC`
      ).all()
      const employees = (result.results || []).map((row) => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        name: row.display_name,
      }))
      return json({ employees })
    }

    if (url.pathname === '/api/employees' && request.method === 'POST') {
      await ensureSchema()
      const body = await request.json()
      const firstName = (body.firstName || '').trim()
      const lastName = (body.lastName || '').trim()
      const pin = String(body.pin || '').trim()

      if (!firstName || !lastName) return json({ error: 'Voornaam en achternaam zijn verplicht.' }, { status: 400 })
      if (!/^\d{4}$/.test(pin)) return json({ error: 'Pincode moet uit 4 cijfers bestaan.' }, { status: 400 })

      const id = createEmployeeId(firstName, lastName)
      const displayName = `${firstName} ${lastName}`
      const existing = await env.DB.prepare(`SELECT id FROM employees WHERE id = ?1`).bind(id).first()
      if (existing) return json({ error: 'Deze medewerker bestaat al.' }, { status: 409 })

      const pinHash = await hashPin(pin)
      await env.DB.prepare(
        `INSERT INTO employees (id, first_name, last_name, display_name, pin_hash) VALUES (?1, ?2, ?3, ?4, ?5)`
      ).bind(id, firstName, lastName, displayName, pinHash).run()

      return json({ employee: { id, firstName, lastName, name: displayName } })
    }

    if (url.pathname === '/api/employees/pin' && request.method === 'POST') {
      await ensureSchema()
      const body = await request.json()
      const employeeId = String(body.employeeId || '').trim()
      const pin = String(body.pin || '').trim()

      if (!employeeId) return json({ error: 'Medewerker ontbreekt.' }, { status: 400 })
      if (!/^\d{4}$/.test(pin)) return json({ error: 'Pincode moet uit 4 cijfers bestaan.' }, { status: 400 })

      const employee = await env.DB.prepare(`SELECT id, display_name FROM employees WHERE id = ?1`).bind(employeeId).first()
      if (!employee) return json({ error: 'Medewerker niet gevonden.' }, { status: 404 })

      const pinHash = await hashPin(pin)
      await env.DB.prepare(`UPDATE employees SET pin_hash = ?1 WHERE id = ?2`).bind(pinHash, employeeId).run()

      return json({ employee: { id: employee.id, name: employee.display_name }, success: true })
    }

    if (url.pathname === '/api/login' && request.method === 'POST') {
      const body = await request.json()
      const employeeId = String(body.employeeId || '').trim()
      const pin = String(body.pin || '').trim()

      if (!employeeId || !/^\d{4}$/.test(pin)) return json({ error: 'Ongeldige logingegevens.' }, { status: 400 })

      const employee = await env.DB.prepare(`SELECT pin_hash FROM employees WHERE id = ?1`).bind(employeeId).first()
      if (!employee) return json({ error: 'Medewerker niet gevonden.' }, { status: 404 })

      const pinHash = await hashPin(pin)
      if (employee.pin_hash !== pinHash) return json({ error: 'Onjuiste pincode.' }, { status: 401 })

      return json({ success: true })
    }

    if (url.pathname === '/api/time-entries' && request.method === 'GET') {
      await ensureSchema()
      const employeeId = url.searchParams.get('employeeId')?.trim()
      const month = url.searchParams.get('month')?.trim()

      let query = `SELECT t.id, e.display_name AS employee_name, t.work_date, t.start_time, t.end_time, t.break_minutes, t.total_hours, t.note
         FROM time_entries t
         JOIN employees e ON e.id = t.employee_id`
      const binds = []
      const where = []

      if (employeeId) {
        where.push(`t.employee_id = ?${binds.length + 1}`)
        binds.push(employeeId)
      }

      if (month) {
        where.push(`t.work_date >= ?${binds.length + 1}`)
        binds.push(`${month}-01`)
        where.push(`t.work_date <= ?${binds.length + 1}`)
        binds.push(`${month}-31`)
      }

      if (where.length) {
        query += ` WHERE ${where.join(' AND ')}`
      }

      query += ` ORDER BY t.work_date DESC, t.id DESC`

      const statement = env.DB.prepare(query)
      const result = (binds.length ? statement.bind(...binds) : statement).all()
      const resolved = await result

      const entries = (resolved.results || []).map((row) => ({
        id: row.id,
        employeeName: row.employee_name,
        workDate: row.work_date,
        startTime: row.start_time,
        endTime: row.end_time,
        breakMinutes: row.break_minutes,
        totalHours: row.total_hours,
        note: row.note,
      }))

      return json({ entries })
    }

    if (url.pathname === '/api/time-entries' && request.method === 'POST') {
      const body = await request.json()
      const employeeId = String(body.employeeId || '').trim()
      const workDate = String(body.date || '').trim()
      const startTime = String(body.startTime || '').trim()
      const endTime = String(body.endTime || '').trim()
      const breakMinutes = Number(body.breakMinutes || 0)
      const note = String(body.note || '').trim()

      if (!employeeId || !workDate || !startTime || !endTime) {
        return json({ error: 'Niet alle velden zijn ingevuld.' }, { status: 400 })
      }

      const employee = await env.DB.prepare(`SELECT id FROM employees WHERE id = ?1`).bind(employeeId).first()
      if (!employee) return json({ error: 'Medewerker niet gevonden.' }, { status: 404 })

      const [startHour, startMinute] = startTime.split(':').map(Number)
      const [endHour, endMinute] = endTime.split(':').map(Number)
      const startTotal = startHour * 60 + startMinute
      const endTotal = endHour * 60 + endMinute
      const totalHours = Math.max(endTotal - startTotal - breakMinutes, 0) / 60

      await env.DB.prepare(
        `INSERT INTO time_entries (employee_id, work_date, start_time, end_time, break_minutes, total_hours, note)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
      ).bind(employeeId, workDate, startTime, endTime, breakMinutes, totalHours, note).run()

      return json({ success: true, totalHours })
    }

    return env.ASSETS.fetch(request)
  },
}
