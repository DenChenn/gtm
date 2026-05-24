export function safeDivide(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return numerator / denominator
}

export function formatPercent(ratio: number, fractionDigits = 1): string {
  return `${(ratio * 100).toFixed(fractionDigits)}%`
}

const twdFormatter = new Intl.NumberFormat('zh-TW', {
  style: 'currency',
  currency: 'TWD',
  maximumFractionDigits: 0,
})

export function formatCurrency(amount: number): string {
  return twdFormatter.format(amount)
}

const numberFormatter = new Intl.NumberFormat('en-US')

export function formatNumber(n: number): string {
  return numberFormatter.format(n)
}

export function conversionRate(conversions: number, clicks: number): number {
  return safeDivide(conversions, clicks)
}

export function aov(revenue: number, conversions: number): number {
  return safeDivide(revenue, conversions)
}

export function epc(revenue: number, clicks: number): number {
  return safeDivide(revenue, clicks)
}
