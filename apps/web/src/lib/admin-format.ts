// "listing.removed_by_moderator" -> "Listing removed by moderator"
export function formatAction(action: string): string {
  const text = action.replace(/[._]+/g, ' ').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : action
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}