export type EmployeeOption = {
  id: string
  name: string
}

export type EmployeeRecord = EmployeeOption & {
  firstName: string
  lastName: string
  pin?: string
  isActive?: boolean
}

export type EmployeeSummary = {
  employeeId: string
  employeeName: string
  totalHours: number
  entryCount: number
  lastWorkedDate: string | null
}

export const defaultEmployees: EmployeeRecord[] = [
  { id: 'ahmed', name: 'Ahmed', firstName: 'Ahmed', lastName: '', isActive: true },
  { id: 'bo', name: 'Bo', firstName: 'Bo', lastName: '', isActive: true },
  { id: 'fatima', name: 'Fatima', firstName: 'Fatima', lastName: '', isActive: true },
  { id: 'jian', name: 'Jian', firstName: 'Jian', lastName: '', isActive: true },
  { id: 'lisa', name: 'Lisa', firstName: 'Lisa', lastName: '', isActive: true },
]
