'use client'

import { useState, useEffect, useRef } from 'react'
import removeMd from 'remove-markdown'
import Skeleton from '@/components/Skeleton'
import Link from 'next/link'
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Eye,
  ChevronDown,
  BarChart,
  Zap,
  MessageSquare,
  Users
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useApi from '@/lib/useApi'
import { aiNlToRulesUrl } from '@/lib/api'
import type { SegmentationRules, SegmentationCondition, CampaignFormData, ApiResponse, MessageSuggestion } from '@/types'
import ConfirmModal from '@/components/ConfirmModal'
import SignInModal from '@/components/SignInModal'
import SendOptionsModal from '@/components/SendOptionsModal'
import { LARGE_AUDIENCE_THRESHOLD } from '@/config'
import { useRouter } from 'next/navigation'
import DraftsManager from '@/components/DraftsManager'
import { ToastProvider, useToast } from '@/components/toast/ToastProvider'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import RuleRow from '@/components/campaigns/RuleRow'
import MessageEditor from '@/components/campaigns/MessageEditor'
import AISuggestions from '@/components/campaigns/AISuggestions'
import CampaignDeliveryDemo from '@/components/CampaignDeliveryDemo'
import CampaignLauncher from '@/components/CampaignLauncher'
// MissingContextModal removed for live-preview behavior

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  message: z.string().min(1, 'Message is required')
})

type CampaignForm = z.infer<typeof campaignSchema>

const fieldOptions = [
  { value: 'totalSpending', label: 'Total Spending' },
  { value: 'visitCount', label: 'Visit Count' },
  { value: 'emailCount', label: 'Email Count' },
  { value: 'lastVisit', label: 'Last Visit' },
  { value: 'email', label: 'Email' }
]

const operatorOptions = {
  totalSpending: [
    { value: '>', label: 'Greater than' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<', label: 'Less than' },
    { value: '<=', label: 'Less than or equal' },
    { value: '=', label: 'Equal to' }
  ],
  visitCount: [
    { value: '>', label: 'Greater than' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<', label: 'Less than' },
    { value: '<=', label: 'Less than or equal' },
    { value: '=', label: 'Equal to' }
  ],
  emailCount: [
    { value: '>', label: 'Greater than' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<', label: 'Less than' },
    { value: '<=', label: 'Less than or equal' },
    { value: '=', label: 'Equal to' }
  ],
  lastVisit: [
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' }
  ],
  email: [
    { value: 'contains', label: 'Contains' }
  ]
}

function NewCampaignInner() {
  // using browser navigation to avoid requiring next/router in this client component
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [audienceSize, setAudienceSize] = useState<number>(0)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [unauthenticated, setUnauthenticated] = useState(false)
  const [pendingAction, setPendingAction] = useState<'preview' | 'submit' | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null)
  const [sendOptionsOpen, setSendOptionsOpen] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<{ campaignData: CampaignFormData; message?: string } | null>(null)
  const [resumeConfirmOpen, setResumeConfirmOpen] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [isAutosaving, setIsAutosaving] = useState(false)
  const [announceAudience, setAnnounceAudience] = useState('')
  const [draftSaved, setDraftSaved] = useState(false)
  const [segmentationRules, setSegmentationRules] = useState<SegmentationRules>({
    logic: 'AND',
    conditions: [{
      field: 'totalSpending',
      operator: '>',
      value: 0
    }]
  })
  
  // Ensure any rules coming from external sources are valid and have a conditions array
  const normalizeRules = (r: any): SegmentationRules => {
    try {
      if (!r || typeof r !== 'object') return { logic: 'AND', conditions: [] }
      const logic = (r.logic === 'OR' ? 'OR' : 'AND') as 'AND' | 'OR'
      const conditions = Array.isArray(r.conditions) ? r.conditions : []

      // Normalize connectors: only allow 'AND' or 'OR'. If the AI returned
      // unexpected tokens (e.g. 'add' or other words), treat them as 'AND'.
      let connectors: ('AND'|'OR')[] | undefined = undefined
      if (Array.isArray((r as any).connectors)) {
        connectors = (r as any).connectors.map((c: any) => {
          if (!c && c !== 0) return undefined
          const s = String(c).trim().toUpperCase()
          if (s === 'OR') return 'OR'
          return 'AND'
        }).filter(Boolean) as ('AND'|'OR')[]
      }

      // Ensure connectors length matches conditions.length - 1
      const expected = Math.max(0, conditions.length - 1)
      if (!connectors) connectors = expected > 0 ? Array(expected).fill(logic) : undefined
      else if (connectors.length !== expected) {
        if (connectors.length > expected) connectors = connectors.slice(0, expected)
        else {
          // pad with the global logic value
          const pad = Array(expected - connectors.length).fill(logic)
          connectors = [...connectors, ...pad]
        }
      }

      // Ensure each condition is a well-formed object with defaults
      const safeConditions = (conditions || []).map((c: any) => ({
        field: c?.field ?? 'totalSpending',
        operator: c?.operator ?? (c?.field === 'lastVisit' ? 'before' : '>='),
        value: typeof c?.value !== 'undefined' ? c.value : (c?.field === 'lastVisit' ? '' : 0)
      }))

      return connectors ? { logic, conditions: safeConditions, connectors } as SegmentationRules : { logic, conditions: safeConditions } as SegmentationRules
    } catch {
      return { logic: 'AND', conditions: [] }
    }
  }
  // connectors represent per-gap operators between consecutive conditions
  // connectors.length === conditions.length - 1
  // message is managed by react-hook-form's `watch('message')`; remove local state
  const [aiSuggestions, setAiSuggestions] = useState<MessageSuggestion[]>([])
  const [loadingAI, setLoadingAI] = useState(false)
  const [suggestionApplied, setSuggestionApplied] = useState(false)
  const [appliedSuggestionId, setAppliedSuggestionId] = useState<number | null>(null)
  
  // removed missing context modal state to always show preview suggestions
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('')
  const [showAllRules, setShowAllRules] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema)
  })

  const router = useRouter()
  const nameRef = useRef<HTMLInputElement | null>(null)
  // extract register props for name so we can combine refs
  const nameRegister = register('name')

  const apiClient = useApi()

  const watchedMessage = watch('message')

  const fmt = (n?: number | null) => (typeof n === 'number' ? n.toLocaleString() : '0')

  const renderConditionText = (condition: SegmentationCondition) => {
    const formatNumber = (v: number | string | undefined) => {
      if (v === undefined || v === null || v === '') return ''
      const num = typeof v === 'number' ? v : Number(v)
      if (Number.isNaN(num)) return String(v)
      return new Intl.NumberFormat(undefined).format(num)
    }

    const formatCurrency = (v: number | string | undefined) => {
      if (v === undefined || v === null || v === '') return ''
      const num = typeof v === 'number' ? v : Number(v)
      if (Number.isNaN(num)) return String(v)
      // Default to USD; apps can be extended to use a configured currency code
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num)
    }

    const formatDate = (v: string | number | undefined) => {
      if (!v) return ''
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) return String(v)
      return d.toLocaleDateString()
    }

    switch (condition.field) {
      case 'totalSpending':
        return `Total spending ${condition.operator} ${formatCurrency(condition.value as any)}`
      case 'visitCount':
        return `Visit count ${condition.operator} ${formatNumber(condition.value as any)}`
      case 'emailCount':
        return `Email count ${condition.operator} ${formatNumber(condition.value as any)}`
      case 'lastVisit':
        return condition.operator === 'before' ? `Last visit before ${formatDate(condition.value as any)}` : `Last visit after ${formatDate(condition.value as any)}`
      case 'email':
        return `Email contains "${condition.value}"`
      default:
        return ''
    }
  }

  // Update audience size preview when rules change
  // NOTE (interview): This debounced preview calls the backend to estimate audience size.
  // It demonstrates UX-first design: debounce to reduce backend load, optimistic spinner, and
  // handling of 401 to prompt sign-in and resume the user's action.
  useEffect(() => {
    const previewAudience = async () => {
      // show spinner only after a short delay to avoid flicker for fast responses
      let showTimer: ReturnType<typeof setTimeout> | null = null
      try {
        showTimer = setTimeout(() => setLoadingPreview(true), 300)
        const response = await apiClient.request<{ audienceSize: number }>({ method: 'post', url: '/campaigns/preview-audience', data: { rules: segmentationRules } })
        if (!response.ok && response.status === 401) {
          setPendingAction('preview')
          setUnauthenticated(true)
          return
        }
        if (response.ok && response.data) {
          setAudienceSize(response.data.audienceSize)
          setAnnounceAudience(`${response.data.audienceSize} customers match your criteria`)
        }
      } catch (error) {
        console.error('Failed to preview audience:', error)
      } finally {
        if (showTimer) {
          clearTimeout(showTimer)
          showTimer = null
        }
        // ensure spinner is hidden after response
        setLoadingPreview(false)
      }
    }

    const timeoutId = setTimeout(previewAudience, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [segmentationRules, apiClient])

  // focus name input once on mount for better UX
  useEffect(() => {
    if (nameRef.current) nameRef.current.focus()
  }, [])

  const toast = useToast()

  // Autosave (debounced)
  // NOTE (interview): Autosave stores a compact draft in localStorage every 30s.
  // This is resilient to auth redirects and helps users recover work during interruptions.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const save = () => {
      try {
        const draft = { id: String(Date.now()), name: watch('name') || '', campaignData: { name: watch('name') || '', description: watch('description') || '', rules: segmentationRules }, message: watch('message') || '', createdAt: Date.now() }
        // store single quick draft under pendingCampaignForm (existing contract)
        localStorage.setItem('pendingCampaignForm', JSON.stringify({ campaignData: draft.campaignData, message: draft.message }))
        setDraftSaved(true)
        setLastSavedAt(Date.now())
        try { toast.show({ id: String(Date.now()), message: 'Draft auto-saved' }) } catch {}
        setTimeout(() => setDraftSaved(false), 1800)
      } catch {}
    }

    // debounce 30s
    timer = setTimeout(save, 30000)
    return () => { if (timer) clearTimeout(timer) }
    // only trigger when key parts change
  }, [watch('name'), watch('description'), watch('message'), segmentationRules])

  // On mount, restore pending form data saved to localStorage (if any)
  // NOTE (interview): Restoring drafts improves UX; we surface a resume confirmation to the user.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pendingCampaignForm')
      if (raw) {
        const parsed = JSON.parse(raw) as { campaignData: CampaignFormData; message?: string }
        if (parsed && parsed.campaignData) {
          setPendingFormData(parsed)
          // Pre-populate form
          setValue('name', parsed.campaignData.name || '')
          setValue('description', parsed.campaignData.description || '')
          if (parsed.message) setValue('message', parsed.message)
          setSegmentationRules(normalizeRules(parsed.campaignData.rules))
          setResumeConfirmOpen(true)
        }
      }
    } catch (err) {
      console.warn('Failed to restore pending campaign form:', err)
    }
  }, [setValue])

  const addCondition = () => {
    setSegmentationRules(prev => {
      const s = normalizeRules(prev)
      const newConditions = [...s.conditions, {
        field: 'totalSpending',
        operator: '>',
        value: 0
      }]
      const updated = { ...s, conditions: newConditions, connectors: ([...((s as any).connectors || []), (s.logic || 'AND')]) }
      return normalizeRules(updated)
    })
  }

  const removeCondition = (index: number) => {
    setSegmentationRules(prev => {
      const s = normalizeRules(prev)
      const newConditions = s.conditions.filter((_, i) => i !== index)
      const oldConnectors: ('AND'|'OR')[] = ((s as any).connectors || [])
      let newConnectors: ('AND' | 'OR')[] = []
      if (oldConnectors.length > 0) {
        if (index < oldConnectors.length) {
          newConnectors = [...oldConnectors.slice(0, index), ...oldConnectors.slice(index + 1)]
        } else {
          newConnectors = oldConnectors.slice(0, -1)
        }
      }
      return normalizeRules({ ...s, conditions: newConditions, connectors: newConnectors })
    })
  }

  const updateCondition = (index: number, updates: Partial<SegmentationCondition>) => {
    setSegmentationRules(prev => {
      const s = normalizeRules(prev)
      const updated = { ...s, conditions: s.conditions.map((condition, i) => i === index ? { ...condition, ...updates } : condition) }
      return normalizeRules(updated)
    })
  }

  const handleLogicChange = (logic: 'AND' | 'OR') => {
    // Keep global logic value but do not overwrite per-gap connectors.
    setSegmentationRules(prev => normalizeRules({ ...normalizeRules(prev), logic }))
  }

  const setConnector = (index: number, value: 'AND' | 'OR') => {
    setSegmentationRules(prev => {
      const s = normalizeRules(prev)
      const connectors: ('AND'|'OR')[] = [...(((s as any).connectors || []))]
      connectors[index] = value
      return normalizeRules({ ...s, connectors })
    })
  }

  const generateAISuggestions = async (overridePrompt?: string) => {
    try {
      setLoadingAI(true)
      const client = apiClient
      console.debug('[AI] generateAISuggestions calling /ai/generate, prompt=', watchedMessage)
      const resp = await client.request<{ message?: string; providerRaw?: any; needsContext?: boolean; success?: boolean; data?: any }>({ method: 'post', url: '/ai/generate', data: { prompt: watchedMessage || '', tone: 'friendly' } })

      // Normalize different possible response shapes from the backend or proxy
      let generated: string | undefined
      let needsContext = false
      if (resp.ok && resp.data) {
        if (typeof (resp.data as any).message === 'string') {
          generated = (resp.data as any).message
          needsContext = Boolean((resp.data as any).needsContext)
        } else if ((resp.data as any).data && typeof (resp.data as any).data.message === 'string') {
          generated = (resp.data as any).data.message
          needsContext = Boolean((resp.data as any).data.needsContext)
        }
      }

      if (generated) {
        // Use remove-markdown to strip Markdown reliably, then strip HTML tags and collapse whitespace
        let cleaned = removeMd(String(generated))
        // strip remaining HTML tags as a safety-net
        cleaned = cleaned.replace(/<[^>]+>/g, '')
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim()

        // Always show preview-only suggestions (do not surface clarifying questions as a modal)
        setAiSuggestions([{ id: 1, message: cleaned, tone: 'friendly', estimatedEngagement: 0, recommendation: 'AI suggestion' }])
        try { toast.show({ message: 'AI suggestion ready — click a suggestion to apply' }) } catch {}
        return
      }

      console.warn('[AI] /ai/generate returned no message or not ok', resp)
      setAiSuggestions([])
      try { toast.show({ message: 'AI did not return a suggestion' }) } catch {}
    } catch (err) {
      console.error('[AI] /ai/generate error', err)
      setAiSuggestions([])
      try { toast.show({ message: 'AI generation failed. Please try again later.' }) } catch {}
    } finally {
      setLoadingAI(false)
    }
  }

  // Real-time suggestions: generate after user stops typing for 800ms
  useEffect(() => {
    // Do not auto-generate when a suggestion was just applied (prevents immediate re-trigger)
    if (suggestionApplied) return
    // Avoid empty prompts and short texts to reduce noise and cost
    if (!watchedMessage || watchedMessage.trim().length < 10) {
      // clear suggestions when message is small
      setAiSuggestions([])
      return
    }

    const debounce = setTimeout(() => {
      // don't start another generation if one is already running
      if (!loadingAI) generateAISuggestions()
    }, 800)

    return () => clearTimeout(debounce)
  }, [watchedMessage, suggestionApplied])

  const convertNaturalLanguage = async () => {
    if (!naturalLanguageQuery.trim()) return

    try {
      setLoadingAI(true)
      const client = apiClient
      // Choose the appropriate NL->rules endpoint depending on environment
      const url = aiNlToRulesUrl()
      console.debug('[AI] convertNaturalLanguage calling', url, 'prompt=', naturalLanguageQuery)
      const response = await client.request<{ success?: boolean; data?: any }>({ method: 'post', url, data: { prompt: naturalLanguageQuery } })
      console.debug('[AI] convertNaturalLanguage response', response)

  if (response.ok && response.data) {
        // Backend responses vary. Handle common shapes:
        // 1) { success: true, data: { prompt, rules, explanation } }
        // 2) { success: true, data: { /* direct rules shape */ } }
        // 3) legacy: return rules directly as the top-level body
        const body = response.data as any

        // unwrap nested .data if present
        const nested = body.data ?? body

        // if nested contains a `rules` property, that's the canonical container
        const extractedRules = nested.rules ?? nested

        // If the backend included provider metadata (e.g., GEMINI), show a transient toast
        try {
          const providerUsed = (nested && (nested.provider ?? nested.data?.provider)) ?? extractedRules?.provider ?? null
          if (providerUsed) {
            let providerDisplay = String(providerUsed)
            const up = providerDisplay.toUpperCase()
            if (up.includes('GEMINI')) providerDisplay = 'Gemini'
            else if (up.includes('OPENAI')) providerDisplay = 'OpenAI'
            else providerDisplay = providerDisplay.charAt(0).toUpperCase() + providerDisplay.slice(1).toLowerCase()
            try { toast.show({ message: `AI: ${providerDisplay}`, duration: 2000 }) } catch {}
          }
        } catch {}

        // apply normalization and update UI
        const hasConditions = extractedRules && (Array.isArray(extractedRules.conditions) ? extractedRules.conditions.length > 0 : Object.keys(extractedRules).length > 0)
        if (!hasConditions) {
          try { toast.show({ message: 'No rules were identified from that query. Try rephrasing.' }) } catch {}
        } else {
          setSegmentationRules(normalizeRules(extractedRules))
          setNaturalLanguageQuery('')
        }
      }
      else {
        try { toast.show({ message: 'Failed to convert natural language to rules. Please try again.' }) } catch {}
      }
    } catch (error) {
      console.error('Failed to convert natural language:', error)
      try { toast.show({ message: 'Failed to understand the query. Please try rephrasing.' }) } catch {}
    } finally {
      setLoadingAI(false)
    }
  }

  // Conversion is triggered explicitly by the Convert button — no auto-convert

  const onSubmit = async (data: CampaignForm) => {
    try {
      setLoading(true)
      setErrorMessage(null)
      
  const campaignData: CampaignFormData = {
        name: data.name,
        description: data.description,
        rules: segmentationRules
      }
  // persist last attempted form in case we need to resume after auth
  const pending = { campaignData, message: data.message }
  setPendingFormData(pending)
  try { localStorage.setItem('pendingCampaignForm', JSON.stringify(pending)) } catch (err) { console.warn('Failed to persist pending form data', err) }

  // Create campaign
      const response = await apiClient.request<{ id?: string; campaign?: any }>({ method: 'post', url: '/campaigns', data: campaignData })

      if (!response.ok && response.status === 401) {
        setPendingAction('submit')
        setUnauthenticated(true)
        return
      }

      if (response.ok && response.data) {
        // Backend returns { data: { id, campaign } }
        const campaignId = (response.data as any).id ?? (response.data as any).campaign?.id
  // If message provided and audience large, open modal confirmation
        if (data.message.trim() && audienceSize >= LARGE_AUDIENCE_THRESHOLD) {
          setPendingCampaignId(campaignId)
          // open send options modal instead of immediate confirm
          setSendOptionsOpen(true)
          // clear pending form since campaign already created
          setPendingFormData(null)
          try { localStorage.removeItem('pendingCampaignForm') } catch {}
          return
        }

        if (data.message.trim()) {
          const sendResp = await apiClient.request({ method: 'post', url: `/campaigns/${campaignId}/launch`, data: { message: data.message } })
          if (!sendResp.ok) {
            toast.show({ message: `Failed to send campaign — ${sendResp.error || 'Unknown error'}` })
            setErrorMessage(sendResp.error || 'Failed to send')
            // Stop further processing
            setPendingFormData(null)
            try { localStorage.removeItem('pendingCampaignForm') } catch {}
            setLoading(false)
            return
          }
          toast.show({ message: 'Campaign queued for delivery' })
        }
  setPendingFormData(null)
  try { localStorage.removeItem('pendingCampaignForm') } catch {}
  router.push('/dashboard/campaigns')
      } else {
        toast.show({ message: `Failed to create campaign — ${response.error || 'Unknown error'}` })
        setErrorMessage(response.error || 'Failed to create campaign')
        setLoading(false)
        return
      }
    } catch (_err: unknown) {
      console.error('Failed to create campaign:', _err)
      const error = _err as { message?: string }
      const msg = error.message || 'Failed to create campaign'
      setErrorMessage(msg)
      try { toast.show({ message: msg }) } catch {}
    } finally {
      setLoading(false)
    }
  }

  // resume pending action after sign-in
  // After the user signs in, attempt to resume the pending action (preview or submit).
  // This shows how to build resilient flows around auth redirects.
  const handleResumeAfterSignIn = async () => {
    try {
      if (pendingAction === 'preview') {
        // re-run a preview (best-effort)
        const resp = await apiClient.request<{ audienceSize: number }>({ method: 'post', url: '/campaigns/preview-audience', data: { rules: segmentationRules } })
        if (resp.ok && resp.data) {
          setAudienceSize(resp.data.audienceSize)
        }
      } else if (pendingAction === 'submit' && pendingFormData) {
        // attempt automatic resubmit of the saved form
        try {
          setLoading(true)
          const createResp = await apiClient.request<{ id?: string; campaign?: any }>({ method: 'post', url: '/campaigns', data: pendingFormData.campaignData })
          if (!createResp.ok && createResp.status === 401) {
            // still unauthorized
            return
          }
          if (createResp.ok && createResp.data) {
            const campaignId = (createResp.data as any).id ?? (createResp.data as any).campaign?.id
            // if message and audience large, open send options to confirm
            const message = pendingFormData.message || ''
            if (message.trim() && audienceSize >= LARGE_AUDIENCE_THRESHOLD) {
              setPendingCampaignId(campaignId)
              setSendOptionsOpen(true)
              setPendingFormData(null)
              try { localStorage.removeItem('pendingCampaignForm') } catch {}
              return
            }

            if (message.trim()) {
              const sendResp = await apiClient.request({ method: 'post', url: `/campaigns/${campaignId}/launch`, data: { message } })
              if (!sendResp.ok) {
                setErrorMessage(sendResp.error || 'Failed to send campaign')
                setPendingFormData(null)
                try { localStorage.removeItem('pendingCampaignForm') } catch {}
                return
              }
            }

            setPendingFormData(null)
            try { localStorage.removeItem('pendingCampaignForm') } catch {}
            router.push('/dashboard/campaigns')
          }
        } finally {
          setLoading(false)
        }
      }
    } finally {
      setPendingAction(null)
      setUnauthenticated(false)
    }
  }

  const handleConfirmSend = async () => {
    if (!pendingCampaignId) return
    try {
      setConfirmOpen(false)
      setLoading(true)
      // the message content is read from the form's watch
  const message = watch('message') as string
  const client = apiClient
  const res = await client.request({ method: 'post', url: `/campaigns/${pendingCampaignId}/launch`, data: { message } })
  if (!res.ok) {
    toast.show({ message: `Failed to send campaign — ${res.error || 'Unknown error'}` })
    setErrorMessage(res.error || 'Failed to send campaign')
    return
  }
  router.push('/dashboard/campaigns')
    } catch (_err) {
      console.error('Failed to send campaign:', _err)
      setErrorMessage('Failed to send campaign')
    } finally {
      setLoading(false)
      setPendingCampaignId(null)
    }
  }

  // prevent unused variable lint warnings in development for optional features
  void errorMessage
  void confirmOpen
  void handleConfirmSend

  const handleSendOptionsConfirm = async (options: { scheduleAt?: string; queue: boolean }) => {
    if (!pendingCampaignId) return
    try {
      setSendOptionsOpen(false)
      setLoading(true)
  const message = watch('message') as string
  // include options in request
  const client = apiClient
  const res = await client.request({ method: 'post', url: `/campaigns/${pendingCampaignId}/launch`, data: { message, scheduleAt: options.scheduleAt, queue: options.queue } })
  if (!res.ok) {
    toast.show({ message: `Failed to send campaign — ${res.error || 'Unknown error'}` })
    setErrorMessage(res.error || 'Failed to send campaign')
    return
  }
  router.push('/dashboard/campaigns')
    } catch (err) {
      console.error('Failed to send campaign with options:', err)
      setErrorMessage('Failed to send campaign')
    } finally {
      setLoading(false)
      setPendingCampaignId(null)
    }
  }

  const conditions = Array.isArray(segmentationRules?.conditions) ? segmentationRules.conditions : []

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        {/* Dashboard-style Header with controls */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
              <Link 
                href="/dashboard/campaigns" 
                aria-label="Back to campaigns" 
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Link>
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Create Campaign</h1>
                <p className="text-gray-600 max-w-3xl mt-2 text-base leading-relaxed">Create and manage targeted marketing campaigns with ease — optimize engagement and reach.</p>
              </div>
            </div>

            {/* Top-right controls (Create CTA + Save Draft + Autosave indicator) */}
            <div className="flex items-center gap-3">

              <div className="relative">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-full px-3 py-2 flex items-center gap-2"
                  onClick={() => {
                    try {
                      setIsAutosaving(true)
                      const draft = { campaignData: { name: watch('name') || '', description: watch('description') || '', rules: segmentationRules }, message: watch('message') || '' }
                      localStorage.setItem('pendingCampaignForm', JSON.stringify(draft))
                      setPendingFormData(draft)
                      setDraftSaved(true)
                      setLastSavedAt(Date.now())
                      try { toast.show({ id: String(Date.now()), message: 'Draft saved', duration: 3000 }) } catch {}
                      setTimeout(() => setDraftSaved(false), 2500)
                      setTimeout(() => setIsAutosaving(false), 900)
                    } catch (e) {
                      setIsAutosaving(false)
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Save Draft</span>

                </Button>

                {draftSaved && (
                  <div className="absolute -bottom-9 right-0 flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Saved
                  </div>
                )}
              </div>

              <div className="text-right text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isAutosaving ? 'bg-green-500 ring-2 ring-green-200 animate-pulse' : (lastSavedAt ? 'bg-green-500' : 'bg-gray-300')}`} />
                  <div className="text-xs text-gray-600">
                    {isAutosaving ? 'Autosaving...' : (lastSavedAt ? `Autosaved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not saved yet')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form id="new-campaign-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8" noValidate>
          {/* Left column - Main form */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-900">Campaign Name *</Label>
                  <Input
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    type="text"
                    id="name"
                    {...nameRegister}
                    ref={(el) => { nameRegister.ref(el); nameRef.current = el }}
                    className={`w-full h-9 rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 text-sm ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Enter a descriptive campaign name..."
                  />
                  {errors.name && (
                    <div id="name-error" role="alert" className="text-sm text-red-600 flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      {errors.name.message}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-900">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    {...register('description')}
                    placeholder="Optional campaign description to help you identify this campaign later..."
                    className="resize-none rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 text-sm"
                  />
                  <p className="text-xs text-gray-500">This description is for your internal reference only.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">AI-Powered Segmentation</CardTitle>
                    <CardDescription className="text-gray-600 text-sm">Turn plain English into segmentation rules</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              {/* Plain English to Rules Converter */}
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Natural Language Query</Label>
                  <div className="flex gap-2">
                    <Textarea
                      value={naturalLanguageQuery}
                      onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                      placeholder="Type in plain English, e.g., 'customers who spent more than $100 in the last month'"
                      className="flex-1 h-16 text-sm rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                    />
                    <Button 
                      onClick={convertNaturalLanguage}
                      disabled={!naturalLanguageQuery.trim() || loadingAI}
                      className="h-16 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {loadingAI ? <Sparkles className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      <span className="ml-2 text-sm font-medium">Convert</span>
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">Use natural language to automatically generate segmentation rules</p>
                </div>
              </div>

              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Segmentation Rules</h3>
                    <p className="text-gray-600 text-sm">Combine rules to precisely target your audience</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                      <span className="text-xs font-semibold text-gray-800">Logic:</span>
                      <Select value={segmentationRules.logic} onValueChange={(v) => handleLogicChange(v as 'AND'|'OR')}>
                        <SelectTrigger className="w-36 h-7 rounded-md bg-white border-0 shadow-none inline-flex items-center justify-between px-2">
                            <span className="text-xs font-medium text-gray-800">{segmentationRules.logic} {segmentationRules.logic === 'AND' ? '(All)' : '(Any)'}</span>
                          </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND (All conditions)</SelectItem>
                          <SelectItem value="OR">OR (Any condition)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg px-3 py-2 h-8 text-xs font-medium"
                      onClick={() => addCondition()}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add Rule
                    </Button>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4 space-y-6">
                {conditions.map((condition, index) => (
                  <div key={`condition-${index}-${String(condition.field)}`} className="relative">
                    <RuleRow
                      index={index}
                      condition={condition}
                      fieldOptions={fieldOptions}
                      operatorOptions={operatorOptions}
                      onUpdate={updateCondition}
                      onRemove={removeCondition}
                    />
                    {index < conditions.length - 1 && (
                      <div className="flex justify-center my-4">
                        <Select value={((segmentationRules as any).connectors || [])[index] || segmentationRules.logic} onValueChange={(v) => setConnector(index, v as 'AND'|'OR')}>
                          <SelectTrigger className="w-24 h-8 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 font-medium text-xs inline-flex items-center justify-center gap-1">
                              <span className="select-value">{((segmentationRules as any).connectors || [])[index] || segmentationRules.logic}</span>
                            </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">AND</SelectItem>
                            <SelectItem value="OR">OR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}

                <div className="mt-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-gray-900">Audience Preview</h4>
                            <p className="text-xs text-gray-600">Real-time audience calculation</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {loadingPreview ? 'Calculating...' : fmt(audienceSize)}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">customers</div>
                        </div>
                      </div>
                      <div aria-live="polite" className="sr-only">{announceAudience}</div>
                      {unauthenticated && (
                        <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-lg">
                          <p className="text-sm text-amber-800">
                            You need to <Link href="/auth/login" className="font-semibold underline hover:text-amber-900">sign in</Link> to preview audience and create campaigns.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <div className="w-5 h-5 bg-green-600 rounded"></div>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Campaign Message</CardTitle>
                    <CardDescription className="text-gray-600 text-sm">Write the message that will be sent to your audience</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <MessageEditor value={watchedMessage || ''} onChange={(v) => setValue('message', v)} audienceSize={audienceSize} onGenerate={generateAISuggestions} loading={loadingAI} flash={suggestionApplied} />
                <div className="mt-4">
                  <AISuggestions suggestions={aiSuggestions} appliedSuggestionId={appliedSuggestionId} loading={loadingAI} isLive={!!(watchedMessage && watchedMessage.trim().length > 10 && aiSuggestions.length > 0 && !loadingAI)} onUse={(msg, id) => {
                    setValue('message', msg)
                    try { toast.show({ message: 'Suggestion applied' }) } catch {}
                    // Trigger editor flash
                    setSuggestionApplied(true)
                    setTimeout(() => setSuggestionApplied(false), 700)
                    // Trigger card animation for the specific suggestion
                    if (typeof id === 'number') {
                      setAppliedSuggestionId(id)
                      setTimeout(() => setAppliedSuggestionId(null), 900)
                    }
                  }} />
                  {/* MissingContextModal removed — AI suggestions show as live previews */}
                  <div className="mt-2 text-xs text-gray-500">
                    <div>AI suggestions powered by the configured provider.</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Summary & Actions */}
          <aside className="lg:col-span-4 space-y-6">
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900">Campaign Summary</CardTitle>
                    <CardDescription className="text-gray-600 text-xs">Current campaign overview</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-xs font-medium text-gray-600">Estimated recipients</span>
                      <span className="font-semibold text-gray-900 text-sm">{fmt(audienceSize)}</span>
                    </div>
                    <div className="flex items-start justify-between py-1 border-b border-gray-100">
                      <div className="text-xs font-medium text-gray-600">Rules</div>
                      <div className="text-xs text-gray-900 font-medium">{conditions.length} conditions</div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-semibold text-gray-900 mb-2">{segmentationRules.logic === 'AND' ? 'All of:' : 'Any of:'}</div>
                    <ul className="space-y-1">
                      {(showAllRules ? conditions : conditions.slice(0, 3)).map((c, i) => (
                        <li key={`condition-${i}-${String(c.field)}`} className="text-xs text-gray-700 flex items-start gap-1">
                          <div className="w-1 h-1 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <span>{renderConditionText(c)}</span>
                        </li>
                      ))}
                    </ul>
                    {conditions.length > 3 && (
                      <button type="button" className="mt-2 text-xs text-purple-600 font-medium hover:text-purple-700 transition-colors" onClick={() => setShowAllRules(prev => !prev)}>
                        {showAllRules ? 'Show less' : `Show ${conditions.length - 3} more`}
                      </button>
                    )}
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">Send Options</Label>
                    <Button type="button" onClick={() => setSendOptionsOpen(true)} variant="outline" size="sm" className="w-full h-8 rounded-md border-gray-200 hover:bg-gray-50 transition-colors text-xs">
                      Schedule / Queue
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900">Quick Actions</CardTitle>
                    <CardDescription className="text-gray-600 text-xs">Streamline your workflow</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" onClick={() => { setValue('message', 'Hello! We have an exclusive offer for you.'); }} className="w-full justify-start gap-2 h-8 rounded-md text-xs">
                    <MessageSquare className="h-3 w-3" />
                    Use Example Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div>
              <DraftsManager onLoad={(d) => {
                try {
                  // populate form with draft
                  const cd = d.campaignData || d
                  setValue('name', cd.name || '')
                  setValue('description', cd.description || '')
                  setValue('message', d.message || '')
                  if (cd.rules) setSegmentationRules(normalizeRules(cd.rules))
                  try { toast.show({ id: String(Date.now()), message: 'Draft loaded', duration: 2500 }) } catch {}
                } catch (e) {}
              }} onDelete={(id) => {
                try { toast.show({ id: String(Date.now()), message: 'Draft deleted' }) } catch {}
              }} />
            </div>

            <div className="sticky top-28">
              <Card className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 border border-purple-200 rounded-xl shadow-md overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <Button type="submit" form="new-campaign-form" className="w-full h-10 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 text-sm" disabled={loading || audienceSize === 0}>
                      {loading ? <Skeleton width="w-20" height="h-4" className="bg-white/20 inline-block" /> : `Create & Send (${fmt(audienceSize)})`}
                    </Button>
                    <Button type="button" variant="outline" className="w-full h-9 rounded-lg border-gray-200 hover:bg-gray-50 transition-colors text-sm" onClick={() => { try { localStorage.removeItem('pendingCampaignForm'); router.push('/dashboard/campaigns') } catch { router.push('/dashboard/campaigns') } }}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
                {/* Delivery demo panel for interview/demo visibility */}
                <CampaignDeliveryDemo />
                <CampaignLauncher />
              </Card>
            </div>
          </aside>
        </form>

        <SignInModal open={unauthenticated} onSuccess={handleResumeAfterSignIn} />
        <SendOptionsModal open={sendOptionsOpen} onCancel={() => setSendOptionsOpen(false)} onConfirm={handleSendOptionsConfirm} />
        <ConfirmModal
          open={resumeConfirmOpen}
          title="Resume your draft?"
          message="We found a saved draft for this campaign — would you like to re-submit it now or continue editing?"
          confirmLabel="Re-submit"
          cancelLabel="Edit"
          onConfirm={() => { setResumeConfirmOpen(false); handleResumeAfterSignIn() }}
          onCancel={() => { setResumeConfirmOpen(false); /* leave form populated for editing */ }}
        />
      </div>
    </div>
  )
}

export default function NewCampaignPage() {
  return (
    <ToastProvider>
      <NewCampaignInner />
    </ToastProvider>
  )
}