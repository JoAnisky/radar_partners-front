import { describe, expect, it } from 'vitest'
import { areaPath, axisMax, donutArcs, linePath, percent, scalePoints, ticks } from '../../app/utils/chart'

describe('scalePoints', () => {
  it('répartit les points sur la largeur et place 0 en bas', () => {
    expect(scalePoints([0, 5, 10], 100, 40)).toEqual([
      { x: 0, y: 40 },
      { x: 50, y: 20 },
      { x: 100, y: 0 },
    ])
  })

  it('utilise le maximum imposé et gère une série plate ou vide', () => {
    expect(scalePoints([5], 100, 40, 10)).toEqual([{ x: 0, y: 20 }])
    expect(scalePoints([0, 0, 0], 100, 40).map(p => p.y)).toEqual([40, 40, 40])
    expect(scalePoints([], 100, 40)).toEqual([])
  })
})

describe('linePath', () => {
  it('renvoie une chaîne vide sans point et un simple départ pour un point', () => {
    expect(linePath([])).toBe('')
    expect(linePath([{ x: 3, y: 4 }])).toBe('M 3 4')
  })

  it('trace une courbe de Bézier par segment, commençant au premier point', () => {
    const path = linePath(scalePoints([0, 10, 5, 10], 90, 30))

    expect(path.startsWith('M 0 30')).toBe(true)
    expect(path.match(/ C /g)).toHaveLength(3)
    expect(path.endsWith('90 0')).toBe(true)
  })

  it('ne dépasse jamais les valeurs de ses voisins (pas de creux sous la ligne de base)', () => {
    const points = scalePoints([0, 0, 20, 0, 0], 100, 50)
    const ys = [...linePath(points).matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)(?= C| L|$)/g)]

    expect(ys.length).toBeGreaterThan(0)
    for (const [, , y] of ys) expect(Number(y)).toBeLessThanOrEqual(50)
    const controlYs = [...linePath(points).matchAll(/C (\S+) (\S+) (\S+) (\S+)/g)].flatMap(m => [Number(m[2]), Number(m[4])])
    for (const y of controlYs) {
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(50)
    }
  })
})

describe('areaPath', () => {
  it('referme la courbe sur la ligne de base', () => {
    const path = areaPath(scalePoints([1, 2], 10, 20), 20)

    expect(path.endsWith('L 10 20 L 0 20 Z')).toBe(true)
    expect(areaPath([], 20)).toBe('')
  })
})

describe('axisMax et ticks', () => {
  it.each([
    [0, 4],
    [1, 4],
    [4, 4],
    [6, 8],
    [19, 20],
    [20, 20],
    [21, 40],
    [163, 200],
    [210, 400],
    [900, 1000],
  ])('axisMax(%i) = %i', (value, expected) => {
    expect(axisMax(value)).toBe(expected)
  })

  it('produit des graduations régulières de 0 au maximum', () => {
    expect(ticks(8)).toEqual([0, 2, 4, 6, 8])
    expect(ticks(200)).toEqual([0, 50, 100, 150, 200])
  })
})

describe('donutArcs', () => {
  it('répartit les parts sur 100 avec un espace entre elles', () => {
    const arcs = donutArcs([50, 50], 1)

    expect(arcs).toEqual([{ start: 0, length: 49 }, { start: 50, length: 49 }])
  })

  it('gère un total nul et les parts minuscules', () => {
    expect(donutArcs([0, 0])).toEqual([{ start: 0, length: 0 }, { start: 0, length: 0 }])
    expect(donutArcs([1, 999], 0.8)[0]!.length).toBeGreaterThanOrEqual(0)
  })
})

describe('percent', () => {
  it('arrondit et évite la division par zéro', () => {
    expect(percent(1, 3)).toBe(33)
    expect(percent(5, 0)).toBe(0)
  })
})
