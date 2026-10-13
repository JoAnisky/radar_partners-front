export interface Point { x: number, y: number }

const round = (value: number) => Math.round(value * 100) / 100
const clamp = (value: number, a: number, b: number) => Math.min(Math.max(value, Math.min(a, b)), Math.max(a, b))

/** Place les valeurs dans un cadre `width` × `height` (y vers le bas), 0 en bas et `max` en haut. */
export function scalePoints(values: number[], width: number, height: number, max = Math.max(...values, 1)): Point[] {
  const step = values.length > 1 ? width / (values.length - 1) : 0

  return values.map((value, index) => ({ x: round(index * step), y: round(height * (1 - value / max)) }))
}

/** Courbe lissée (Catmull-Rom en Bézier) sans dépasser les valeurs voisines. */
export function linePath(points: Point[]): string {
  const [first] = points
  if (!first) return ''
  if (points.length === 1) return `M ${first.x} ${first.y}`

  let path = `M ${first.x} ${first.y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p0 = points[i - 1] ?? p1
    const p3 = points[i + 2] ?? p2
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6, p1.y, p2.y)
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6, p1.y, p2.y)
    path += ` C ${round(p1.x + (p2.x - p0.x) / 6)} ${round(c1y)} ${round(p2.x - (p3.x - p1.x) / 6)} ${round(c2y)} ${p2.x} ${p2.y}`
  }

  return path
}

/** Zone sous la courbe, refermée sur la ligne de base. */
export function areaPath(points: Point[], baseline: number): string {
  const first = points[0]
  const last = points.at(-1)
  if (!first || !last) return ''

  return `${linePath(points)} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`
}

/** Maximum d'axe arrondi : multiple de 4 sous 20, sinon 1, 2, 4, 5, 8 ou 10 × une puissance de 10. */
export function axisMax(value: number): number {
  if (value <= 0) return 4
  if (value < 20) return Math.ceil(value / 4) * 4

  const exponent = 10 ** Math.floor(Math.log10(value))
  const mantissa = [1, 2, 4, 5, 8, 10].find(m => m * exponent >= value) ?? 10

  return mantissa * exponent
}

/** Valeurs des graduations de 0 à `max` (`count` intervalles). */
export function ticks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => Math.round((max / count) * i))
}

export interface DonutArc { start: number, length: number }

/** Arcs d'un donut de circonférence 100 : début et longueur de chaque part, avec un petit espace entre elles. */
export function donutArcs(values: number[], gap = 0.8): DonutArc[] {
  const total = values.reduce((sum, value) => sum + value, 0)
  let start = 0

  return values.map((value) => {
    const share = total > 0 ? (value / total) * 100 : 0
    const arc = { start: round(start), length: round(Math.max(share - (share > gap ? gap : 0), 0)) }
    start += share

    return arc
  })
}

export function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0
}
