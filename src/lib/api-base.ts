export function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (!base) return path
  return `${base.replace(/\/$/, '')}${path}`
}
