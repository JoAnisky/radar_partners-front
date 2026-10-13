export type PipelineStatus = 'TO_CONTACT' | 'CONTACTED' | 'FOLLOW_UP' | 'MEETING' | 'PARTNER' | 'ON_HOLD' | 'EXCLUDED'
export type Scope = 'LOCAL' | 'NATIONAL'
export type CompanyType = 'ESN' | 'WEB_AGENCY' | 'COM_AGENCY' | 'END_CLIENT' | 'UNKNOWN'
export type Channel = 'PHONE' | 'EMAIL' | 'IN_PERSON' | 'LINKEDIN' | 'WEB_FORM'
export type Outcome
  = | 'NO_ANSWER' | 'VOICEMAIL' | 'NOBODY_ON_SITE' | 'NO_NEED' | 'NO_FREELANCE_POLICY'
    | 'JUST_HIRED' | 'MEETING_SCHEDULED' | 'POSITIVE' | 'OTHER'
export type SignalType = 'JOB_POSTING' | 'FREELANCE_MISSION' | 'STACK_DETECTED' | 'COMPANY_CREATED' | 'RECENT_HIRE'

export interface Page<T> {
  items: T[]
  total: number
  page: number
  perPage: number
}

export interface CompanySummary {
  id: number
  name: string
  siren: string | null
  website: string | null
  city: string | null
  postalCode: string | null
  phone: string | null
  nafCode: string | null
  headcountRange: string | null
  type: CompanyType
  scope: Scope
  status: PipelineStatus
  score: number
  flags: string[]
  recontactAfter: string | null
  lastInteractionAt: string | null
  archived: boolean
}

export interface Contact {
  id: number
  fullName: string
  role: string | null
  phone: string | null
  email: string | null
  linkedinUrl: string | null
  notes: string | null
}

export interface Interaction {
  id: number
  contactId: number | null
  occurredAt: string
  channel: Channel
  origin: string | null
  outcome: Outcome
  notes: string | null
  nextActionAt: string | null
}

export interface Signal {
  id: number
  companyId: number | null
  companyName: string | null
  type: SignalType
  source: string
  title: string | null
  url: string | null
  detectedAt: string
  publishedAt: string | null
  extracted: Record<string, unknown>
}

export interface CompanyDetail extends CompanySummary {
  address: string | null
  email: string | null
  parentId: number | null
  scoreExplanation: string | null
  notes: string | null
  createdAt: string
  contacts: Contact[]
  interactions: Interaction[]
  signals: Signal[]
}

export interface InteractionPayload {
  channel: Channel
  occurredAt?: string
  outcome: Outcome
  contactId?: number
  origin?: string
  notes?: string
  nextActionAt?: string
}

export interface InteractionUpdatePayload {
  channel?: Channel
  occurredAt?: string
  outcome?: Outcome
  contactId?: number | null
  origin?: string | null
  notes?: string | null
  nextActionAt?: string | null
}

export interface CompanyUpdatePayload {
  name?: string
  type?: CompanyType
  scope?: Scope
  website?: string | null
  address?: string | null
  postalCode?: string | null
  city?: string | null
  phone?: string | null
  email?: string | null
  siren?: string | null
  nafCode?: string | null
  headcountRange?: string | null
}

export interface ContactPayload {
  fullName?: string
  role?: string | null
  phone?: string | null
  email?: string | null
  linkedinUrl?: string | null
  notes?: string | null
}

export interface ContactListItem extends Contact {
  company: { id: number, name: string, city: string | null, status: PipelineStatus }
  lastInteractionAt: string | null
}
