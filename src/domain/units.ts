export function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment
}

const LB_PER_KG = 2.20462262

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG
}

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG
}
