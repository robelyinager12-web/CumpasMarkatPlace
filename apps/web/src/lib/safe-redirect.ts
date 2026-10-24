// Only allow same-site relative paths, which blocks open-redirect attacks via ?next=
export function safeNextPath(value: string | undefined, fallback = '/dashboard') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  return value
}