import type { EmployeeRecord } from '@/lib/hours-data'
import { apiUrl } from '@/lib/api-base'

export type TimeEntry = {
  id: number
  employeeName: string
  workDate: string
  startTime: string
  endTime: string
  breakMinutes: number
  totalHours: number
  note?: string
}

async function parseJson(response: Response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error || 'Er ging iets mis.')
  }

  return data
}

export async function getEmployees(): Promise<EmployeeRecord[]> {
  const response = await fetch(apiUrl('/api/employees'))
  const data = await parseJson(response)
  return data.employees || []
}

export async function createEmployee(firstName: string, lastName: string, pin: string) {
  const response = await fetch(apiUrl('/api/employees'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, pin }),
  })

  const data = await parseJson(response)
  return data.employee
}

export async function loginEmployee(employeeId: string, pin: string) {
  const response = await fetch(apiUrl('/api/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, pin }),
  })

  await parseJson(response)
  return true
}

export async function updateEmployeePin(employeeId: string, pin: string) {
  const response = await fetch(apiUrl('/api/employees/pin'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, pin }),
  })

  const data = await parseJson(response)
  return data.employee
}

export async function getTimeEntries(): Promise<TimeEntry[]> {
  const response = await fetch(apiUrl('/api/time-entries'))
  const data = await parseJson(response)
  return data.entries || []
}

export async function createTimeEntry(input: {
  employeeId: string
  date: string
  startTime: string
  endTime: string
  breakMinutes: number
}) {
  const response = await fetch(apiUrl('/api/time-entries'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const data = await parseJson(response)
  return data.totalHours
}

export async function getEmployeeMonthlyEntries(employeeId: string, month: string): Promise<TimeEntry[]> {
  const response = await fetch(apiUrl(`/api/time-entries?employeeId=${encodeURIComponent(employeeId)}&month=${encodeURIComponent(month)}`))
  const data = await parseJson(response)
  return data.entries || []
}
