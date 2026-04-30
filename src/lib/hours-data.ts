export type EmployeeOption = {
  id: string
  name: string
}

export type EmployeeRecord = EmployeeOption & {
  firstName: string
  lastName: string
}

export const defaultEmployees: EmployeeRecord[] = [
  { id: 'ahmed', name: 'Ahmed', firstName: 'Ahmed', lastName: '' },
  { id: 'bo', name: 'Bo', firstName: 'Bo', lastName: '' },
  { id: 'fatima', name: 'Fatima', firstName: 'Fatima', lastName: '' },
  { id: 'jian', name: 'Jian', firstName: 'Jian', lastName: '' },
  { id: 'lisa', name: 'Lisa', firstName: 'Lisa', lastName: '' },
]
