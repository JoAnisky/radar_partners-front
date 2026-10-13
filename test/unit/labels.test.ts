import { describe, expect, it } from 'vitest'
import { errorMessage, formatDate, formatDayMonth, formatDelta, scoreColor, statusColors, statusLabels, toItems } from '../../app/utils/labels'

describe('toItems', () => {
  it('transforme un dictionnaire de libellés en options de liste', () => {
    expect(toItems({ A: 'Alpha', B: 'Bravo' })).toEqual([
      { value: 'A', label: 'Alpha' },
      { value: 'B', label: 'Bravo' },
    ])
  })
})

describe('formatDate', () => {
  it('formate une date ISO en français', () => {
    expect(formatDate('2026-10-13T12:00:00+02:00')).toBe('13/10/2026')
  })

  it('ne décale jamais le jour selon l\'heure ou le fuseau', () => {
    expect(formatDate('2026-10-01T00:00:00+02:00')).toBe('01/10/2026')
    expect(formatDate('2026-10-01T23:59:59+02:00')).toBe('01/10/2026')
    expect(formatDate('2026-12-31')).toBe('31/12/2026')
  })

  it('affiche un tiret quand la date est absente', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })
})

describe('formatDayMonth', () => {
  it('garde le jour et le mois', () => {
    expect(formatDayMonth('2026-10-12')).toBe('12/10')
    expect(formatDayMonth('2026-10-12T00:00:00+02:00')).toBe('12/10')
  })
})

describe('formatDelta', () => {
  it('signe les variations et arrondit', () => {
    expect(formatDelta(700)).toBe('+700 %')
    expect(formatDelta(12.5)).toBe('+13 %')
    expect(formatDelta(-3.1)).toBe('-3 %')
    expect(formatDelta(0)).toBe('0 %')
  })
})

describe('errorMessage', () => {
  it('utilise le détail renvoyé par l\'API', () => {
    expect(errorMessage({ data: { detail: 'Le SIREN doit contenir 9 chiffres.' } })).toBe('Le SIREN doit contenir 9 chiffres.')
  })

  it('utilise le champ error des conflits', () => {
    expect(errorMessage({ data: { error: 'Une entreprise porte déjà ce nom.', id: 3 } })).toBe('Une entreprise porte déjà ce nom.')
  })

  it('retombe sur un message générique', () => {
    expect(errorMessage(new Error('réseau'))).toBe('Une erreur est survenue.')
    expect(errorMessage(null)).toBe('Une erreur est survenue.')
  })
})

describe('scoreColor', () => {
  it.each([
    [0, 'neutral'],
    [14, 'neutral'],
    [15, 'warning'],
    [34, 'warning'],
    [35, 'info'],
    [59, 'info'],
    [60, 'success'],
    [100, 'success'],
  ] as const)('score %i → %s', (score, color) => {
    expect(scoreColor(score)).toBe(color)
  })
})

describe('statuts', () => {
  it('chaque statut a un libellé et une couleur', () => {
    expect(Object.keys(statusLabels).sort()).toEqual(Object.keys(statusColors).sort())
    expect(Object.keys(statusLabels)).toHaveLength(7)
  })
})
