import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncCheckIn, syncPsychProfile, syncSleepLog, syncChatMessage, syncAchievements, syncPractice, syncProfile } from './db'

export type MoodLevel = 'otimo' | 'bem' | 'ok' | 'mal' | 'crise'

export interface CheckIn {
  id: string
  mood: MoodLevel
  score: number
  timestamp: number
  note?: string
  triggers?: string[]
  sensorData?: { typingBurst?: number }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface SleepLog {
  id: string
  date: string          // YYYY-MM-DD
  quality: 1 | 2 | 3 | 4 | 5
  hours: number
  notes?: string
  timestamp: number
}

export interface Achievement {
  id: string
  unlockedAt: number
}

export interface BreatheSession {
  id: string
  techniqueId: string
  techniqueName: string
  durationMin: number
  timestamp: number
}

export type DetectionMethod = 'camera_frontal' | 'microfone' | 'acelerometro' | 'camera_traseira' | 'digitacao'
export type CheckInSchedule = 'manha' | 'tarde' | 'noite'
export type WellnessGoal = 'ansiedade' | 'estresse' | 'sono' | 'foco' | 'burnout' | 'depressao'

export interface PsychProfile {
  anxietyScore: number
  depressionScore: number
  tdahScore: number
  burnoutScore: number
  stressScore: number
  detectedPatterns: string[]
  hasMigraine: boolean
  medicationStatus: 'acompanhamento' | 'sem_acompanhamento' | 'automedicacao' | 'nenhuma' | null
}

export interface CareStore {
  userId: string | null
  userName: string
  userEmail: string
  hasOnboarded: boolean
  currentScore: number
  currentMood: MoodLevel | null
  checkIns: CheckIn[]
  chatMessages: ChatMessage[]
  sleepLogs: SleepLog[]
  achievements: Achievement[]
  completedPractices: string[]
  breatheSessions: BreatheSession[]
  sosActivations: number[]
  detectionMethods: DetectionMethod[]
  checkInSchedule: CheckInSchedule[]
  wellnessGoals: WellnessGoal[]
  psychProfile: PsychProfile | null
  medicationStatus: PsychProfile['medicationStatus']
  notificationsEnabled: boolean
  lastUnlockedAchievement: string | null

  setUserId: (id: string | null) => void
  hydrateFromDB: (data: {
    profile: Record<string, unknown> | null
    psychProfile: PsychProfile | null
    checkIns: CheckIn[]
    sleepLogs: SleepLog[]
    chatMessages: ChatMessage[]
    achievements: Achievement[]
    completedPractices: string[]
  }) => void
  setUserName: (name: string) => void
  setUserEmail: (email: string) => void
  setHasOnboarded: (v: boolean) => void
  setDetectionMethods: (methods: DetectionMethod[]) => void
  setCheckInSchedule: (schedule: CheckInSchedule[]) => void
  setWellnessGoals: (goals: WellnessGoal[]) => void
  setPsychProfile: (profile: PsychProfile) => void
  setMedicationStatus: (s: PsychProfile['medicationStatus']) => void
  setNotificationsEnabled: (v: boolean) => void
  addCheckIn: (mood: MoodLevel, score: number, note?: string, triggers?: string[], sensorData?: CheckIn['sensorData']) => void
  addChatMessage: (msg: ChatMessage) => void
  addSleepLog: (log: Omit<SleepLog, 'id' | 'timestamp'>) => void
  updateSleepLog: (id: string, updates: Partial<Pick<SleepLog, 'quality' | 'hours' | 'notes'>>) => void
  completePractice: (id: string) => void
  addBreatheSession: (session: Omit<BreatheSession, 'id' | 'timestamp'>) => void
  logSosActivation: () => void
  unlockAchievement: (id: string) => void
  clearLastUnlockedAchievement: () => void
  clearChat: () => void
  clearData: () => void
}

export const moodToScore: Record<MoodLevel, number> = {
  otimo: 90, bem: 72, ok: 50, mal: 28, crise: 10,
}
export const moodLabel: Record<MoodLevel, string> = {
  otimo: 'Ótimo', bem: 'Bem', ok: 'Ok', mal: 'Mal', crise: 'Em crise',
}
export const moodEmoji: Record<MoodLevel, string> = {
  otimo: '✨', bem: '🌿', ok: '😐', mal: '🌧', crise: '⛈',
}
export const moodColor: Record<MoodLevel, string> = {
  otimo: '#00D4A0', bem: '#7BF8C4', ok: '#C8C8C8', mal: '#FF8C00', crise: '#FF4466',
}

export function scoreColor(score: number) {
  if (score >= 70) return '#00D4A0'
  if (score >= 40) return '#FFB800'
  if (score >= 20) return '#FF7A00'
  return '#FF4466'
}
export function scoreLabel(score: number) {
  if (score >= 70) return 'Você está bem'
  if (score >= 40) return 'Atenção ao seu estado'
  if (score >= 20) return 'Hora de cuidar de você'
  return 'Você precisa de apoio agora'
}

// ─── Achievement definitions ─────────────────────────────────────────────────
export interface AchievementDef {
  id: string
  title: string
  desc: string
  hint: string
  icon: string
  color: string
}
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_checkin',    title: 'Primeiro passo',        desc: 'Fez o primeiro check-in',             hint: 'Faça seu primeiro check-in',               icon: '🌱', color: '#00D4A0' },
  { id: 'streak_3',         title: '3 dias seguidos',       desc: 'Check-in por 3 dias consecutivos',    hint: 'Check-in por 3 dias seguidos',             icon: '🔥', color: '#FFB800' },
  { id: 'streak_7',         title: 'Uma semana',            desc: 'Check-in por 7 dias consecutivos',    hint: 'Check-in por 7 dias seguidos',             icon: '⚡', color: '#FFB800' },
  { id: 'streak_30',        title: 'Um mês inteiro',        desc: '30 dias seguidos de autocuidado',     hint: 'Check-in por 30 dias seguidos',            icon: '🏆', color: '#FFB800' },
  { id: 'checkins_10',      title: '10 registros',          desc: 'Completou 10 check-ins no total',     hint: 'Acumule 10 check-ins',                     icon: '📊', color: '#7B8FF8' },
  { id: 'checkins_50',      title: '50 registros',          desc: '50 check-ins — dedicação real',       hint: 'Acumule 50 check-ins',                     icon: '💎', color: '#7B8FF8' },
  { id: 'used_breathing',   title: 'Primeiro fôlego',       desc: 'Completou uma sessão de respiração',  hint: 'Complete uma sessão em Respiração',        icon: '🌊', color: '#3A86FF' },
  { id: 'used_sos',         title: 'Pediu ajuda',           desc: 'Usou o protocolo SOS',                hint: 'Complete o protocolo SOS',                 icon: '🤝', color: '#FF4466' },
  { id: 'first_sleep',      title: 'Monitorando o sono',    desc: 'Registrou qualidade de sono',         hint: 'Registre uma noite na aba Sono',           icon: '🌙', color: '#3A86FF' },
  { id: 'all_practices',    title: 'Explorador',            desc: 'Explorou todas as categorias',        hint: 'Complete 5 práticas diferentes',           icon: '🗺️', color: '#00D4A0' },
  { id: 'high_score',       title: 'Dia brilhante',         desc: 'Score ≥ 85 em um check-in',           hint: 'Registre um check-in com score ≥ 85',      icon: '✨', color: '#00D4A0' },
  { id: 'consistency',      title: 'Consistência',          desc: '3 check-ins em um único dia',         hint: 'Faça 3 check-ins no mesmo dia',            icon: '🎯', color: '#E040FB' },
]

// ─── Auto-derive psychProfile from check-in history ─────────────────────────
let _lastRecalcAt = 0
export function recalculatePsychProfile(checkIns: CheckIn[], existing: PsychProfile | null): PsychProfile {
  // Debounce: skip full recalculation if called within 500ms (rapid programmatic calls)
  const now = Date.now()
  if (existing && now - _lastRecalcAt < 500) return existing
  _lastRecalcAt = now
  const hasMigraine = existing?.hasMigraine ?? false
  const medicationStatus = existing?.medicationStatus ?? null
  const recent30 = checkIns.filter(c => c.timestamp > Date.now() - 30 * 86_400_000)

  if (recent30.length < 3) {
    return existing ?? { anxietyScore: 0, depressionScore: 0, tdahScore: 0, burnoutScore: 0, stressScore: 0, detectedPatterns: ['Estado estavel'], hasMigraine, medicationStatus }
  }

  const scores = recent30.map(c => c.score)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length
  const varianceNorm = Math.min(100, Math.round(Math.sqrt(variance) * 2.5))

  const n = Math.max(1, checkIns.length)
  const allTriggers = checkIns.flatMap(c => c.triggers ?? [])
  const tc = (t: string) => allTriggers.filter(x => x === t).length
  const stressTrig = tc('Trabalho') + tc('Sobrecarga') + tc('Conflito')
  const anxTrig    = tc('Incerteza') + tc('Sobrecarga') + tc('Redes sociais')
  const depTrig    = tc('Solidão') + tc('Família')

  const lowMoodRate = recent30.filter(c => c.mood === 'mal' || c.mood === 'crise').length / recent30.length
  const half = Math.floor(recent30.length / 2)
  const olderAvg = recent30.slice(half).reduce((s, c) => s + c.score, 0) / Math.max(1, half)
  const recentAvg = recent30.slice(0, half).reduce((s, c) => s + c.score, 0) / Math.max(1, half)
  const declining = recentAvg < olderAvg

  // Within-day variance → TDAH signal
  const dayMap: Record<string, number[]> = {}
  checkIns.forEach(c => {
    const k = new Date(c.timestamp).toDateString()
    ;(dayMap[k] = dayMap[k] ?? []).push(c.score)
  })
  const multiDays = Object.values(dayMap).filter(g => g.length >= 2)
  const withinDayVar = multiDays.length
    ? multiDays.reduce((sum, g) => {
        const m = g.reduce((a, b) => a + b) / g.length
        return sum + g.reduce((a, b) => a + Math.pow(b - m, 2), 0) / g.length
      }, 0) / multiDays.length
    : 0

  // Typing burst (if present in recent check-ins) — fast/erratic typing = stress signal
  const typingScores = recent30.filter(c => c.sensorData?.typingBurst !== undefined).map(c => c.sensorData!.typingBurst!)
  const typingStress = typingScores.length ? Math.round(typingScores.reduce((a, b) => a + b, 0) / typingScores.length) : 50

  const anxietyScore    = Math.min(100, Math.round(varianceNorm * 0.35 + lowMoodRate * 35 + (anxTrig / n) * 30))
  const depressionScore = Math.min(100, Math.round(lowMoodRate * 55 + (declining ? 20 : 0) + (depTrig / n) * 20 + (mean < 35 ? 15 : 0)))
  const stressScore     = Math.min(100, Math.round(varianceNorm * 0.3 + (stressTrig / n) * 35 + lowMoodRate * 25 + (typingStress > 70 ? 10 : 0)))
  const burnoutScore    = Math.min(100, Math.round((mean >= 25 && mean <= 55 && recent30.length >= 7 ? 40 : 0) + (stressTrig / n) * 30 + (declining ? 20 : 0)))
  const tdahScore       = Math.min(100, Math.round(Math.sqrt(withinDayVar) * 2.8 + varianceNorm * 0.2))

  const detectedPatterns: string[] = []
  if (anxietyScore    > 45) detectedPatterns.push('Ansiedade')
  if (depressionScore > 45) detectedPatterns.push('Sinais depressivos')
  if (burnoutScore    > 45) detectedPatterns.push('Risco de burnout')
  if (tdahScore       > 45) detectedPatterns.push('Padrões de TDAH')
  if (stressScore     > 45) detectedPatterns.push('Estresse elevado')
  if (detectedPatterns.length === 0) detectedPatterns.push('Estado estavel')

  return { anxietyScore, depressionScore, tdahScore, burnoutScore, stressScore, detectedPatterns, hasMigraine, medicationStatus }
}

export const useCareStore = create<CareStore>()(
  persist(
    (set, get) => ({
      userId: null,
      userName: '',
      userEmail: '',
      hasOnboarded: false,
      currentScore: 50,
      currentMood: null,
      checkIns: [],
      chatMessages: [],
      sleepLogs: [],
      achievements: [],
      completedPractices: [],
      breatheSessions: [],
      sosActivations: [],
      detectionMethods: ['microfone', 'acelerometro', 'digitacao'],
      checkInSchedule: ['manha', 'tarde', 'noite'],
      wellnessGoals: [],
      lastUnlockedAchievement: null,
      psychProfile: null,
      medicationStatus: null,
      notificationsEnabled: false,

      setUserId: (id) => set({ userId: id }),

      hydrateFromDB: (data) => {
        const p = data.profile
        set({
          ...(p ? {
            userName: (p.user_name as string) ?? '',
            userEmail: (p.user_email as string) ?? '',
            hasOnboarded: (p.has_onboarded as boolean) ?? false,
            wellnessGoals: (p.wellness_goals as WellnessGoal[]) ?? [],
            checkInSchedule: (p.check_in_schedule as CheckInSchedule[]) ?? [],
            detectionMethods: (p.detection_methods as DetectionMethod[]) ?? [],
            medicationStatus: (p.medication_status as PsychProfile['medicationStatus']) ?? null,
            notificationsEnabled: (p.notifications_enabled as boolean) ?? false,
          } : {}),
          ...(data.psychProfile ? { psychProfile: data.psychProfile } : {}),
          checkIns: data.checkIns,
          sleepLogs: data.sleepLogs,
          chatMessages: data.chatMessages,
          achievements: data.achievements,
          completedPractices: data.completedPractices,
          currentScore: data.checkIns[0]?.score ?? 50,
          currentMood: data.checkIns[0]?.mood ?? null,
        })
      },

      setUserName: (name) => set({ userName: name }),
      setPsychProfile: (profile) => set({ psychProfile: profile }),
      setMedicationStatus: (s) => set({ medicationStatus: s }),
      setUserEmail: (email) => set({ userEmail: email }),
      setHasOnboarded: (v) => {
        set({ hasOnboarded: v })
        const s = get()
        if (s.userId) syncProfile(s.userId, { hasOnboarded: v })
      },
      setDetectionMethods: (methods) => {
        set({ detectionMethods: methods })
        const s = get()
        if (s.userId) syncProfile(s.userId, { detectionMethods: methods as string[] })
      },
      setCheckInSchedule: (schedule) => {
        set({ checkInSchedule: schedule })
        const s = get()
        if (s.userId) syncProfile(s.userId, { checkInSchedule: schedule as string[] })
      },
      setWellnessGoals: (goals) => {
        set({ wellnessGoals: goals })
        const s = get()
        if (s.userId) syncProfile(s.userId, { wellnessGoals: goals as string[] })
      },
      setNotificationsEnabled: (v) => {
        set({ notificationsEnabled: v })
        const s = get()
        if (s.userId) syncProfile(s.userId, { notificationsEnabled: v })
      },

      addCheckIn: (mood, score, note, triggers, sensorData) => {
        const ci: CheckIn = { id: Date.now().toString(), mood, score, timestamp: Date.now(), note, triggers, sensorData }
        const s = get()
        const newCheckIns = [ci, ...s.checkIns].slice(0, 200)

        // Auto-unlock achievements
        const earned = new Set(s.achievements.map(a => a.id))
        const toUnlock: Achievement[] = []
        const unlock = (id: string) => { if (!earned.has(id)) { toUnlock.push({ id, unlockedAt: Date.now() }); earned.add(id) } }

        if (newCheckIns.length === 1) unlock('first_checkin')
        if (newCheckIns.length >= 10) unlock('checkins_10')
        if (newCheckIns.length >= 50) unlock('checkins_50')
        if (score >= 85) unlock('high_score')

        // day streak
        const days = new Set(newCheckIns.map(c => new Date(c.timestamp).toDateString()))
        let streak = 0
        const d = new Date()
        while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1) }
        if (streak >= 3)  unlock('streak_3')
        if (streak >= 7)  unlock('streak_7')
        if (streak >= 30) unlock('streak_30')

        // 3 check-ins today
        const today = new Date().toDateString()
        const todayCount = newCheckIns.filter(c => new Date(c.timestamp).toDateString() === today).length
        if (todayCount >= 3) unlock('consistency')

        const updatedProfile = recalculatePsychProfile(newCheckIns, s.psychProfile)
        set({ currentScore: score, currentMood: mood, checkIns: newCheckIns, achievements: [...s.achievements, ...toUnlock], psychProfile: updatedProfile, ...(toUnlock.length ? { lastUnlockedAchievement: toUnlock[toUnlock.length - 1].id } : {}) })
        if (s.userId) {
          syncCheckIn(s.userId, ci)
          syncPsychProfile(s.userId, updatedProfile)
          if (toUnlock.length) syncAchievements(s.userId, [...s.achievements, ...toUnlock])
        }
      },

      addSleepLog: (log) => {
        const s = get()
        const full: SleepLog = { ...log, id: Date.now().toString(), timestamp: Date.now() }
        const earned = new Set(s.achievements.map(a => a.id))
        const newAch = earned.has('first_sleep') ? [] : [{ id: 'first_sleep', unlockedAt: Date.now() }]
        set({ sleepLogs: [full, ...s.sleepLogs].slice(0, 90), achievements: [...s.achievements, ...newAch], ...(newAch.length ? { lastUnlockedAchievement: 'first_sleep' } : {}) })
        if (s.userId) {
          syncSleepLog(s.userId, full)
          if (newAch.length) syncAchievements(s.userId, [...s.achievements, ...newAch])
        }
      },

      unlockAchievement: (id) => {
        const s = get()
        if (s.achievements.find(a => a.id === id)) return
        const updated = [...s.achievements, { id, unlockedAt: Date.now() }]
        set({ achievements: updated, lastUnlockedAchievement: id })
        if (s.userId) syncAchievements(s.userId, updated)
      },

      addChatMessage: (msg) => {
        const s = get()
        set({ chatMessages: [...s.chatMessages, msg].slice(-100) })
        if (s.userId) syncChatMessage(s.userId, msg)
      },

      updateSleepLog: (id, updates) => {
        const s = get()
        const updated = s.sleepLogs.map(l => l.id === id ? { ...l, ...updates } : l)
        set({ sleepLogs: updated })
        const log = updated.find(l => l.id === id)
        if (s.userId && log) syncSleepLog(s.userId, log)
      },

      logSosActivation: () => {
        const s = get()
        set({ sosActivations: [Date.now(), ...s.sosActivations].slice(0, 50) })
      },

      addBreatheSession: (session) => {
        const s = get()
        const full: BreatheSession = { ...session, id: Date.now().toString(), timestamp: Date.now() }
        set({ breatheSessions: [full, ...s.breatheSessions].slice(0, 50) })
      },

      completePractice: (id) => {
        const s = get()
        if (s.completedPractices.includes(id)) return
        const newCompleted = [...s.completedPractices, id]
        const earned = new Set(s.achievements.map(a => a.id))
        const newAch = !earned.has('all_practices') && newCompleted.length >= 5
          ? [...s.achievements, { id: 'all_practices', unlockedAt: Date.now() }]
          : s.achievements
        set({ completedPractices: newCompleted, achievements: newAch, ...(newAch.length > s.achievements.length ? { lastUnlockedAchievement: 'all_practices' } : {}) })
        if (s.userId) {
          syncPractice(s.userId, id)
          if (newAch.length > s.achievements.length) syncAchievements(s.userId, newAch)
        }
      },

      clearLastUnlockedAchievement: () => set({ lastUnlockedAchievement: null }),
      clearChat: () => set({ chatMessages: [] }),
      clearData: () => set({ userId: null, checkIns: [], chatMessages: [], sleepLogs: [], completedPractices: [], currentScore: 50, currentMood: null }),
    }),
    {
      name: 'care-storage',
      partialize: (s) => ({
        userName: s.userName,
        userEmail: s.userEmail,
        hasOnboarded: s.hasOnboarded,
        currentScore: s.currentScore,
        currentMood: s.currentMood,
        checkIns: s.checkIns,
        chatMessages: s.chatMessages,
        sleepLogs: s.sleepLogs,
        achievements: s.achievements,
        completedPractices: s.completedPractices,
        breatheSessions: s.breatheSessions,
        sosActivations: s.sosActivations,
        detectionMethods: s.detectionMethods,
        checkInSchedule: s.checkInSchedule,
        wellnessGoals: s.wellnessGoals,
        psychProfile: s.psychProfile,
        medicationStatus: s.medicationStatus,
        notificationsEnabled: s.notificationsEnabled,
      }),
    }
  )
)
