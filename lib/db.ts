/**
 * lib/db.ts — Supabase sync layer
 *
 * All functions are fire-and-forget (no await needed in store mutations).
 * On login, loadUserData() hydrates the Zustand store from Supabase.
 */

import { supabase } from './supabase'
import type { CheckIn, SleepLog, ChatMessage, Achievement, PsychProfile, MoodLevel } from './store'

// ─── Load all user data on login ─────────────────────────────────────────────

export async function loadUserData(userId: string) {
  if (!supabase) return { profile: null, psychProfile: null, checkIns: [], sleepLogs: [], chatMessages: [], achievements: [], completedPractices: [] }

  const results = await Promise.allSettled([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('psych_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('check_ins').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(200),
    supabase.from('sleep_logs').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(90),
    supabase.from('chat_messages').select('*').eq('user_id', userId).order('timestamp', { ascending: true }).limit(200),
    supabase.from('achievements').select('*').eq('user_id', userId),
    supabase.from('completed_practices').select('practice_id').eq('user_id', userId),
  ])

  const get = <T>(i: number): T | null => {
    const r = results[i]
    return r.status === 'fulfilled' ? ((r.value as { data: T | null }).data ?? null) : null
  }

  const profile      = get<Record<string, unknown>>(0)
  const psychProfile = get<Record<string, unknown>>(1)
  const checkIns     = get<Record<string, unknown>[]>(2) ?? []
  const sleepLogs    = get<Record<string, unknown>[]>(3) ?? []
  const chatMessages = get<Record<string, unknown>[]>(4) ?? []
  const achievements = get<{ achievement_id: string; unlocked_at: number }[]>(5) ?? []
  const practices    = get<{ practice_id: string }[]>(6) ?? []

  return {
    profile: profile ?? null,
    psychProfile: psychProfile ? dbToPsychProfile(psychProfile) : null,
    checkIns: checkIns.map(dbToCheckIn),
    sleepLogs: sleepLogs.map(dbToSleepLog),
    chatMessages: chatMessages.map(dbToChatMessage),
    achievements: achievements.map(a => ({ id: a.achievement_id, unlockedAt: a.unlocked_at })) as Achievement[],
    completedPractices: practices.map(p => p.practice_id) as string[],
  }
}

// ─── Profile sync ─────────────────────────────────────────────────────────────

export function syncProfile(userId: string, data: {
  userName?: string
  hasOnboarded?: boolean
  wellnessGoals?: string[]
  checkInSchedule?: string[]
  detectionMethods?: string[]
  medicationStatus?: string | null
  notificationsEnabled?: boolean
}) {
  if (!supabase) return
  supabase.from('profiles').upsert({
    id: userId,
    user_name: data.userName,
    has_onboarded: data.hasOnboarded,
    wellness_goals: data.wellnessGoals,
    check_in_schedule: data.checkInSchedule,
    detection_methods: data.detectionMethods,
    medication_status: data.medicationStatus,
    notifications_enabled: data.notificationsEnabled,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' }).then()
}

// ─── CheckIn sync ─────────────────────────────────────────────────────────────

export function syncCheckIn(userId: string, ci: CheckIn) {
  if (!supabase) return
  supabase.from('check_ins').upsert({
    id: ci.id,
    user_id: userId,
    mood: ci.mood,
    score: ci.score,
    timestamp: ci.timestamp,
    note: ci.note ?? null,
    triggers: ci.triggers ?? [],
    sensor_data: ci.sensorData ?? null,
  }, { onConflict: 'id' }).then()
}

// ─── PsychProfile sync ────────────────────────────────────────────────────────

export function syncPsychProfile(userId: string, p: PsychProfile) {
  if (!supabase) return
  supabase.from('psych_profiles').upsert({
    user_id: userId,
    anxiety_score: p.anxietyScore,
    depression_score: p.depressionScore,
    tdah_score: p.tdahScore,
    burnout_score: p.burnoutScore,
    stress_score: p.stressScore,
    detected_patterns: p.detectedPatterns,
    has_migraine: p.hasMigraine,
    medication_status: p.medicationStatus,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' }).then()
}

// ─── SleepLog sync ────────────────────────────────────────────────────────────

export function syncSleepLog(userId: string, log: SleepLog) {
  if (!supabase) return
  supabase.from('sleep_logs').upsert({
    id: log.id,
    user_id: userId,
    date: log.date,
    quality: log.quality,
    hours: log.hours,
    notes: log.notes ?? null,
    timestamp: log.timestamp,
  }, { onConflict: 'id' }).then()
}

// ─── ChatMessage sync ─────────────────────────────────────────────────────────

export function syncChatMessage(userId: string, msg: ChatMessage) {
  if (!supabase) return
  supabase.from('chat_messages').upsert({
    id: msg.id,
    user_id: userId,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  }, { onConflict: 'id' }).then()
}

// ─── Achievement sync ─────────────────────────────────────────────────────────

export function syncAchievements(userId: string, achievements: Achievement[]) {
  if (!supabase || !achievements.length) return
  supabase.from('achievements').upsert(
    achievements.map(a => ({ achievement_id: a.id, user_id: userId, unlocked_at: a.unlockedAt })),
    { onConflict: 'achievement_id,user_id' }
  ).then()
}

// ─── Practice sync ────────────────────────────────────────────────────────────

export function syncPractice(userId: string, practiceId: string) {
  if (!supabase) return
  supabase.from('completed_practices').upsert(
    { practice_id: practiceId, user_id: userId },
    { onConflict: 'practice_id,user_id' }
  ).then()
}

// ─── DB row → store type converters ──────────────────────────────────────────

function dbToCheckIn(row: Record<string, unknown>): CheckIn {
  return {
    id: row.id as string,
    mood: row.mood as MoodLevel,
    score: row.score as number,
    timestamp: row.timestamp as number,
    note: row.note as string | undefined,
    triggers: (row.triggers as string[]) ?? [],
    sensorData: row.sensor_data as CheckIn['sensorData'],
  }
}

function dbToSleepLog(row: Record<string, unknown>): SleepLog {
  return {
    id: row.id as string,
    date: row.date as string,
    quality: row.quality as 1 | 2 | 3 | 4 | 5,
    hours: row.hours as number,
    notes: row.notes as string | undefined,
    timestamp: row.timestamp as number,
  }
}

function dbToChatMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    role: row.role as 'user' | 'assistant',
    content: row.content as string,
    timestamp: row.timestamp as number,
  }
}

function dbToPsychProfile(row: Record<string, unknown>): PsychProfile {
  return {
    anxietyScore: row.anxiety_score as number,
    depressionScore: row.depression_score as number,
    tdahScore: row.tdah_score as number,
    burnoutScore: row.burnout_score as number,
    stressScore: row.stress_score as number,
    detectedPatterns: (row.detected_patterns as string[]) ?? [],
    hasMigraine: row.has_migraine as boolean,
    medicationStatus: row.medication_status as PsychProfile['medicationStatus'],
  }
}
