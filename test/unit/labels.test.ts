import { describe, expect, it } from 'vitest'
import { errorMessage, formatDate, scoreColor, statusColors, statusLabels, toItems } from '../../app/utils/labels'

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

  it('affiche un tiret quand la date est absente', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
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
