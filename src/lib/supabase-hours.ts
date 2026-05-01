import { supabase } from '@/lib/supabase'
import type { EmployeeRecord, EmployeeSummary } from '@/lib/hours-data'

export type TimeEntry = {
  id: number
  employeeId?: string
  employeeName: string
  workDate: string
  startTime: string
  endTime: string
  breakMinutes: number
  totalHours: number
  note?: string
}

type EmployeeRow = {
  id: string
  first_name: string
  last_name: string
  display_name: string
  pin: string
  is_active?: boolean | null
}

type TimeEntryRow = {
  id: number
  employee_id?: string
  work_date: string
  start_time: string
  end_time: string
  break_minutes: number
  total_hours: number
  note: string | null
  employees?:
    | {
        display_name: string
      }
    | {
        display_name: string
      }[]
    | null
}

const slugifyEmployeeId = (firstName: string, lastName: string) =>
  `${firstName} ${lastName}`
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

function mapEmployee(employee: EmployeeRow): EmployeeRecord {
  return {
    id: employee.id,
    firstName: employee.first_name,
    lastName: employee.last_name,
    name: employee.display_name,
    pin: employee.pin,
    isActive: employee.is_active ?? true,
  }
}

function mapEntry(entry: TimeEntryRow): TimeEntry {
  return {
    id: entry.id,
    employeeId: entry.employee_id,
    employeeName: Array.isArray(entry.employees)
      ? entry.employees[0]?.display_name || 'Onbekend'
      : entry.employees?.display_name || 'Onbekend',
    workDate: entry.work_date,
    startTime: entry.start_time,
    endTime: entry.end_time,
    breakMinutes: entry.break_minutes,
    totalHours: entry.total_hours,
    note: entry.note || '',
  }
}

export async function getEmployees(options?: { includeInactive?: boolean }): Promise<EmployeeRecord[]> {
  let query = supabase
    .from('employees')
    .select('id, first_name, last_name, display_name, pin, is_active')
    .order('display_name', { ascending: true })

  if (!options?.includeInactive) {
    query = query.or('is_active.is.null,is_active.eq.true')
  }

  const { data, error } = await query

  if (error) throw error

  return ((data || []) as EmployeeRow[]).map(mapEmployee)
}

export async function createEmployee(firstName: string, lastName: string, pin: string) {
  const id = slugifyEmployeeId(firstName, lastName)
  const displayName = `${firstName.trim()} ${lastName.trim()}`.trim()

  const { data: existing } = await supabase
    .from('employees')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (existing) {
    throw new Error('Deze medewerker bestaat al.')
  }

  const { data, error } = await supabase
    .from('employees')
    .insert({
      id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      display_name: displayName,
      pin,
      is_active: true,
    })
    .select('id, first_name, last_name, display_name, pin, is_active')
    .single()

  if (error) throw error

  return mapEmployee(data as EmployeeRow)
}

export async function updateEmployeePin(employeeId: string, pin: string) {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('Pincode moet uit 4 cijfers bestaan.')
  }

  const { data, error } = await supabase
    .from('employees')
    .update({ pin })
    .eq('id', employeeId)
    .select('id, display_name')
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.display_name,
  }
}

export async function setEmployeeActiveStatus(employeeId: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('employees')
    .update({ is_active: isActive })
    .eq('id', employeeId)
    .select('id, display_name, is_active')
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.display_name,
    isActive: data.is_active,
  }
}

export async function loginEmployee(employeeId: string, pin: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, pin, is_active')
    .eq('id', employeeId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Medewerker niet gevonden.')
  if (data.is_active === false) throw new Error('Deze medewerker staat inactief.')
  if (data.pin !== pin) throw new Error('Pincode klopt niet.')

  return true
}

export async function getTimeEntries(): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('id, employee_id, work_date, start_time, end_time, break_minutes, total_hours, note, employees(display_name)')
    .order('work_date', { ascending: false })
    .order('id', { ascending: false })

  if (error) throw error

  return ((data || []) as TimeEntryRow[]).map(mapEntry)
}

export async function createTimeEntry(input: {
  employeeId: string
  date: string
  startTime: string
  endTime: string
  breakMinutes: number
}) {
  const [startHour, startMinute] = input.startTime.split(':').map(Number)
  const [endHour, endMinute] = input.endTime.split(':').map(Number)
  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute
  const totalHours = Math.max(endTotal - startTotal - input.breakMinutes, 0) / 60

  const { error } = await supabase.from('time_entries').insert({
    employee_id: input.employeeId,
    work_date: input.date,
    start_time: input.startTime,
    end_time: input.endTime,
    break_minutes: input.breakMinutes,
    total_hours: totalHours,
    note: '',
  })

  if (error) throw error

  return totalHours
}

export async function getEmployeeMonthlyEntries(employeeId: string, month: string): Promise<TimeEntry[]> {
  const monthStart = `${month}-01`
  const monthEnd = `${month}-31`

  const { data, error } = await supabase
    .from('time_entries')
    .select('id, employee_id, work_date, start_time, end_time, break_minutes, total_hours, note, employees(display_name)')
    .eq('employee_id', employeeId)
    .gte('work_date', monthStart)
    .lte('work_date', monthEnd)
    .order('work_date', { ascending: false })
    .order('id', { ascending: false })

  if (error) throw error

  return ((data || []) as TimeEntryRow[]).map(mapEntry)
}

export function summarizeEmployeeEntries(entries: TimeEntry[], employees: EmployeeRecord[]): EmployeeSummary[] {
  return employees.map((employee) => {
    const employeeEntries = entries.filter((entry) => entry.employeeId === employee.id)
    const totalHours = employeeEntries.reduce((sum, entry) => sum + entry.totalHours, 0)
    const lastWorkedDate = employeeEntries.length
      ? employeeEntries
          .map((entry) => entry.workDate)
          .sort((a, b) => (a < b ? 1 : -1))[0]
      : null

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      totalHours,
      entryCount: employeeEntries.length,
      lastWorkedDate,
    }
  })
}
