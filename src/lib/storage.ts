/**
 * Primary data layer.
 *
 * Strategy:
 * - localStorage is the in-process cache (synchronous reads for all existing pages)
 * - Every write mirrors to Supabase asynchronously (fire-and-forget, no blocking)
 * - `initFromSupabase()` pre-loads all data from Supabase into localStorage on startup
 * - `setupRealtimeSubscriptions()` pushes live Supabase changes back into localStorage
 *   and notifies React components via `subscribeToKey()`
 *
 * Result: every existing page works unchanged; you get real persistence for free.
 */

import { supabase, isSupabaseEnabled } from './supabase'
import type { StorageSchema } from '@/types'

// ─── localStorage helpers ────────────────────────────────────────────────────

const PREFIX = 'elo_'
const lsKey = (k: string) => `${PREFIX}${k}`

function lsRead<K extends keyof StorageSchema>(k: K): StorageSchema[K] | null {
  try {
    const raw = localStorage.getItem(lsKey(k))
    return raw ? (JSON.parse(raw) as StorageSchema[K]) : null
  } catch {
    return null
  }
}

function lsWrite<K extends keyof StorageSchema>(k: K, v: StorageSchema[K]): void {
  localStorage.setItem(lsKey(k), JSON.stringify(v))
}

// ─── Supabase table map ──────────────────────────────────────────────────────

/** Maps StorageSchema array keys → Supabase table names. */
const TABLE_MAP: Partial<Record<keyof StorageSchema, string>> = {
  users: 'profiles',
  classes: 'classes',
  subjects: 'subjects',
  class_subjects: 'class_subjects',
  assessments: 'assessments',
  assessment_grades: 'assessment_grades',
  attendance: 'attendances',
  tasks: 'tasks',
  task_submissions: 'task_submissions',
  classroom_posts: 'classroom_posts',
  conversations: 'conversations',
  messages: 'messages',
  events: 'calendar_events',
  materials: 'materials',
  videos: 'videos',
  quizzes: 'quizzes',
  quiz_attempts: 'quiz_attempts',
  notifications: 'notifications',
  gamification: 'gamification',
  horarios: 'class_schedules',
}

// ─── Change notification (for realtime) ─────────────────────────────────────

type ChangeHandler = () => void
const keyListeners = new Map<string, Set<ChangeHandler>>()

/** Subscribe to in-process data changes for a given key. Returns unsubscribe fn. */
export function subscribeToKey(k: keyof StorageSchema, handler: ChangeHandler): () => void {
  if (!keyListeners.has(k)) keyListeners.set(k, new Set())
  keyListeners.get(k)!.add(handler)
  return () => keyListeners.get(k)?.delete(handler)
}

function notifyKey(k: keyof StorageSchema): void {
  keyListeners.get(k)?.forEach((h) => h())
}

// ─── Realtime ────────────────────────────────────────────────────────────────

let realtimeCleanup: (() => void) | null = null

/**
 * Subscribe to Supabase Realtime for chat messages, notifications, and feed posts.
 * Call this once after the user is authenticated.
 */
export function setupRealtimeSubscriptions(): void {
  if (!isSupabaseEnabled || !supabase) return

  realtimeCleanup?.()

  const tracked: [string, keyof StorageSchema][] = [
    ['messages', 'messages'],
    ['notifications', 'notifications'],
    ['classroom_posts', 'classroom_posts'],
    ['tasks', 'tasks'],
  ]

  const channels = tracked.map(([table, storeKey]) =>
    supabase!
      .channel(`rt_${table}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          applyRealtime(
            storeKey,
            payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            payload.new || payload.old,
          )
        },
      )
      .subscribe(),
  )

  realtimeCleanup = () => channels.forEach((ch) => supabase!.removeChannel(ch))
}

export function teardownRealtimeSubscriptions(): void {
  realtimeCleanup?.()
  realtimeCleanup = null
}

function applyRealtime(
  k: keyof StorageSchema,
  event: 'INSERT' | 'UPDATE' | 'DELETE',
  row: unknown,
): void {
  const arr = (lsRead(k) ?? []) as { id: string }[]
  const r = row as { id: string }

  let next: { id: string }[]
  if (event === 'INSERT') {
    if (arr.some((x) => x.id === r.id)) return // dedup
    next = [...arr, r]
  } else if (event === 'UPDATE') {
    next = arr.map((x) => (x.id === r.id ? { ...x, ...r } : x))
  } else {
    next = arr.filter((x) => x.id !== r.id)
  }

  lsWrite(k, next as StorageSchema[typeof k])
  notifyKey(k)
}

// ─── Supabase initialisation ─────────────────────────────────────────────────

/**
 * Load all data from Supabase into localStorage.
 * Called once on app startup. No-op when Supabase is not configured.
 */
export async function initFromSupabase(): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return

  const keys = Object.keys(TABLE_MAP) as (keyof StorageSchema)[]

  const results = await Promise.allSettled(
    keys.map((k) =>
      supabase!
        .from(TABLE_MAP[k]!)
        .select('*')
        .then(({ data }) => ({ k, data: data ?? [] })),
    ),
  )

  for (const r of results) {
    if (r.status === 'fulfilled') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lsWrite(r.value.k, r.value.data as any)
    }
  }
}

// ─── Public storage API (same interface as before) ──────────────────────────

function get<K extends keyof StorageSchema>(k: K): StorageSchema[K] | null {
  return lsRead(k)
}

function set<K extends keyof StorageSchema>(k: K, value: StorageSchema[K]): void {
  lsWrite(k, value)
}

function getArray<K extends keyof StorageSchema>(
  k: K,
): StorageSchema[K] extends unknown[] ? StorageSchema[K] : never {
  type R = StorageSchema[K] extends unknown[] ? StorageSchema[K] : never
  return (lsRead(k) ?? []) as R
}

function push<K extends keyof StorageSchema>(
  k: K,
  item: StorageSchema[K] extends (infer I)[] ? I : never,
): void {
  const arr = getArray(k) as unknown[]
  arr.push(item)
  lsWrite(k, arr as StorageSchema[K])
  notifyKey(k)

  const table = TABLE_MAP[k]
  if (isSupabaseEnabled && supabase && table) {
    supabase
      .from(table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(item as any)
      .then(({ error }) => {
        if (error) console.warn(`[db] insert ${table}:`, error.message)
      })
  }
}

function update<T extends { id: string }>(
  k: keyof StorageSchema,
  id: string,
  patch: Partial<T>,
): void {
  const arr = (lsRead(k) ?? []) as unknown as T[]
  const idx = arr.findIndex((x) => x.id === id)
  if (idx !== -1) {
    arr[idx] = { ...arr[idx], ...patch }
    lsWrite(k, arr as unknown as StorageSchema[typeof k])
    notifyKey(k)
  }

  const table = TABLE_MAP[k]
  if (isSupabaseEnabled && supabase && table) {
    supabase
      .from(table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn(`[db] update ${table}:`, error.message)
      })
  }
}

function remove_item(k: keyof StorageSchema, id: string): void {
  const arr = (lsRead(k) ?? []) as { id: string }[]
  lsWrite(k, arr.filter((x) => x.id !== id) as StorageSchema[typeof k])
  notifyKey(k)

  const table = TABLE_MAP[k]
  if (isSupabaseEnabled && supabase && table) {
    supabase
      .from(table)
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn(`[db] delete ${table}:`, error.message)
      })
  }
}

function clear_all(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k))
}

export const storage = { get, set, getArray, push, update, remove_item, clear_all }
