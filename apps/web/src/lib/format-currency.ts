const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'ETB',
  currencyDisplay: 'code',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

// Prisma Decimal values arrive from the API as strings, so accept both.
export function formatEtb(amount: number | string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  return Number.isFinite(value) ? formatter.format(value) : '—'
}