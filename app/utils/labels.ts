import type { Channel, CompanyType, Outcome, PipelineStatus, Scope, SignalType } from '~/types/api'

export const statusLabels: Record<PipelineStatus, string> = {
  TO_CONTACT: 'À contacter',
  CONTACTED: 'Contactée',
  FOLLOW_UP: 'À suivre',
  MEETING: 'Rendez-vous',
  PARTNER: 'Partenaire',
  ON_HOLD: 'En attente',
  EXCLUDED: 'Exclue',
}

export const statusColors: Record<PipelineStatus, 'neutral' | 'info' | 'primary' | 'success' | 'warning' | 'error'> = {
  TO_CONTACT: 'neutral',
  CONTACTED: 'info',
  FOLLOW_UP: 'primary',
  MEETING: 'success',
  PARTNER: 'success',
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
  JUST_HIRED: "Vient d'embaucher",
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
  JOB_POSTING: "Offre d'emploi",
  FREELANCE_MISSION: 'Mission freelance',
  STACK_DETECTED: 'Stack détectée',
  COMPANY_CREATED: "Création d'entreprise",
  RECENT_HIRE: 'Embauche récente',
}

export function toItems<T extends string>(labels: Record<T, string>) {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }))
}

export function formatDate(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString('fr-FR') : '—'
}

export function errorMessage(error: unknown): string {
  const data = (error as { data?: { detail?: string, error?: string } } | null)?.data
  return data?.detail ?? data?.error ?? 'Une erreur est survenue.'
}
