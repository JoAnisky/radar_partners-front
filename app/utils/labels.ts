import type { Channel, CompanyType, Outcome, PipelineStatus, Scope, SignalType } from '~/types/api'

/** Nom de l'assistant, affiché dans le chat. */
export const ASSISTANT_NAME = 'Amelio'

export const statusLabels: Record<PipelineStatus, string> = {
  TO_CONTACT: 'À contacter',
  CONTACTED: 'Contactée',
  FOLLOW_UP: 'À suivre',
  MEETING: 'Rendez-vous',
  PARTNER: 'Partenaire',
  ON_HOLD: 'En attente',
  EXCLUDED: 'Exclue',
}

export const statusColors: Record<PipelineStatus, 'neutral' | 'info' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
  TO_CONTACT: 'neutral',
  CONTACTED: 'info',
  FOLLOW_UP: 'primary',
  MEETING: 'success',
  PARTNER: 'secondary',
  ON_HOLD: 'warning',
  EXCLUDED: 'error',
}

export const channelLabels: Record<Channel, string> = {
  PHONE: 'Téléphone',
  EMAIL: 'Email',
  IN_PERSON: 'En personne',
  LINKEDIN: 'LinkedIn',
  WEB_FORM: 'Formulaire web',
}

export const outcomeLabels: Record<Outcome, string> = {
  NO_ANSWER: 'Pas de réponse',
  VOICEMAIL: 'Répondeur',
  NOBODY_ON_SITE: 'Personne sur place',
  NO_NEED: 'Pas de besoin',
  NO_FREELANCE_POLICY: 'Ne travaille pas avec des freelances',
  JUST_HIRED: 'Vient d\'embaucher',
  MEETING_SCHEDULED: 'Rendez-vous fixé',
  POSITIVE: 'Échange positif',
  OTHER: 'Autre',
}

export const scopeLabels: Record<Scope, string> = { LOCAL: 'Local', NATIONAL: 'National' }

export const typeLabels: Record<CompanyType, string> = {
  ESN: 'ESN',
  WEB_AGENCY: 'Agence web',
  COM_AGENCY: 'Agence de com',
  END_CLIENT: 'Client final',
  UNKNOWN: 'Inconnu',
}

export const signalTypeLabels: Record<SignalType, string> = {
  JOB_POSTING: 'Offre d\'emploi',
  FREELANCE_MISSION: 'Mission freelance',
  STACK_DETECTED: 'Stack détectée',
  COMPANY_CREATED: 'Création d\'entreprise',
  RECENT_HIRE: 'Embauche récente',
}

export function toItems<T extends string>(labels: Record<T, string>) {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }))
}

/** Jour calendaire du serveur lu dans la chaîne ISO : pas de décalage selon le fuseau du navigateur. */
function calendarDay(iso: string): [string, string, string] {
  const [year = '', month = '', day = ''] = iso.slice(0, 10).split('-')

  return [year, month, day]
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [year, month, day] = calendarDay(iso)

  return `${day}/${month}/${year}`
}

export function errorMessage(error: unknown): string {
  const data = (error as { data?: { detail?: string, error?: string } } | null)?.data
  return data?.detail ?? data?.error ?? 'Une erreur est survenue.'
}

export function scoreColor(score: number): 'neutral' | 'warning' | 'info' | 'success' {
  if (score >= 60) return 'success'
  if (score >= 35) return 'info'
  if (score >= 15) return 'warning'
  return 'neutral'
}

/** Couleurs des graphiques (palette Tailwind) : les variables CSS ne sont émises que si une classe les utilise. */
export const statusChartColors: Record<PipelineStatus, string> = {
  TO_CONTACT: '#71717a',
  CONTACTED: '#0ea5e9',
  FOLLOW_UP: '#8b5cf6',
  MEETING: '#10b981',
  PARTNER: '#d946ef',
  ON_HOLD: '#f59e0b',
  EXCLUDED: '#ef4444',
}

export function formatDayMonth(iso: string): string {
  const [, month, day] = calendarDay(iso)

  return `${day}/${month}`
}

export function formatDelta(percent: number): string {
  return `${percent > 0 ? '+' : ''}${Math.round(percent)} %`
}
