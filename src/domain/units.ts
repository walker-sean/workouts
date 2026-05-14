export function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment
}

// kg support is deferred — app is lb-only for v1
