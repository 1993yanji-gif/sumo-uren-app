async function hashPin(pin) {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function onRequestPost(context) {
  const { DB } = context.env
  const body = await context.request.json()
  const employeeId = String(body.employeeId || '').trim()
  const pin = String(body.pin || '').trim()

  if (!employeeId || !/^\d{4}$/.test(pin)) {
    return Response.json({ error: 'Ongeldige logingegevens.' }, { status: 400 })
  }

  const employee = await DB.prepare(`SELECT pin_hash FROM employees WHERE id = ?1`).bind(employeeId).first()
  if (!employee) {
    return Response.json({ error: 'Medewerker niet gevonden.' }, { status: 404 })
  }

  const pinHash = await hashPin(pin)
  if (employee.pin_hash !== pinHash) {
    return Response.json({ error: 'Onjuiste pincode.' }, { status: 401 })
  }

  return Response.json({ success: true })
}
