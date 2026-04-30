function calculateHours(startTime, endTime, breakMinutes) {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute
  const workedMinutes = Math.max(endTotal - startTotal - breakMinutes, 0)
  return workedMinutes / 60
}

export async function onRequestGet(context) {
  const { DB } = context.env
  const result = await DB.prepare(
    `SELECT t.id, e.display_name AS employee_name, t.work_date, t.start_time, t.end_time, t.break_minutes, t.total_hours, t.note
     FROM time_entries t
     JOIN employees e ON e.id = t.employee_id
     ORDER BY t.work_date DESC, t.id DESC`
  ).all()

  const entries = (result.results || []).map((row) => ({
    id: row.id,
    employeeName: row.employee_name,
    workDate: row.work_date,
    startTime: row.start_time,
    endTime: row.end_time,
    breakMinutes: row.break_minutes,
    totalHours: row.total_hours,
    note: row.note,
  }))

  return Response.json({ entries })
}

export async function onRequestPost(context) {
  const { DB } = context.env
  const body = await context.request.json()
  const employeeId = String(body.employeeId || '').trim()
  const workDate = String(body.date || '').trim()
  const startTime = String(body.startTime || '').trim()
  const endTime = String(body.endTime || '').trim()
  const breakMinutes = Number(body.breakMinutes || 0)
  const note = String(body.note || '').trim()

  if (!employeeId || !workDate || !startTime || !endTime) {
    return Response.json({ error: 'Niet alle velden zijn ingevuld.' }, { status: 400 })
  }

  const employee = await DB.prepare(`SELECT id FROM employees WHERE id = ?1`).bind(employeeId).first()
  if (!employee) {
    return Response.json({ error: 'Medewerker niet gevonden.' }, { status: 404 })
  }

  const totalHours = calculateHours(startTime, endTime, breakMinutes)

  await DB.prepare(
    `INSERT INTO time_entries (employee_id, work_date, start_time, end_time, break_minutes, total_hours, note)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
  )
    .bind(employeeId, workDate, startTime, endTime, breakMinutes, totalHours, note)
    .run()

  return Response.json({ success: true, totalHours })
}
