import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { Announcement, Baby, Feeding, Sleep } from '../types'

// ── Babies ────────────────────────────────────────────────────────────────────

export async function createBaby(userId: string, data: Partial<Baby>): Promise<string> {
  const ref = await addDoc(collection(db, `users/${userId}/babies`), {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateBaby(
  userId: string,
  babyId: string,
  data: Partial<Baby>
): Promise<void> {
  await updateDoc(doc(db, `users/${userId}/babies/${babyId}`), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function getActiveBaby(userId: string): Promise<Baby | null> {
  const q = query(
    collection(db, `users/${userId}/babies`),
    where('isActive', '==', true),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Baby
}

// ── Feedings ─────────────────────────────────────────────────────────────────

export async function addFeeding(userId: string, data: Partial<Feeding>): Promise<string> {
  const ref = await addDoc(collection(db, `users/${userId}/feedings`), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateFeeding(
  userId: string,
  feedingId: string,
  data: Partial<Feeding>
): Promise<void> {
  await updateDoc(doc(db, `users/${userId}/feedings/${feedingId}`), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteFeeding(userId: string, feedingId: string): Promise<void> {
  await deleteDoc(doc(db, `users/${userId}/feedings/${feedingId}`))
}

export async function getFeeding(userId: string, feedingId: string): Promise<Feeding | null> {
  const snap = await getDoc(doc(db, `users/${userId}/feedings/${feedingId}`))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Feeding
}

export function subscribeToFeedings(
  userId: string,
  babyId: string,
  callback: (feedings: Feeding[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(
    collection(db, `users/${userId}/feedings`),
    where('babyId', '==', babyId),
    orderBy('startTime', 'desc'),
    limit(300)
  )
  return onSnapshot(
    q,
    (snap) => {
      const feedings = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Feeding)
      callback(feedings)
    },
    onError
  )
}

// ── Sleeps ───────────────────────────────────────────────────────────────────

export async function addSleep(userId: string, data: Partial<Sleep>): Promise<string> {
  const ref = await addDoc(collection(db, `users/${userId}/sleeps`), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateSleep(
  userId: string,
  sleepId: string,
  data: Partial<Sleep>
): Promise<void> {
  await updateDoc(doc(db, `users/${userId}/sleeps/${sleepId}`), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteSleep(userId: string, sleepId: string): Promise<void> {
  await deleteDoc(doc(db, `users/${userId}/sleeps/${sleepId}`))
}

export async function getSleep(userId: string, sleepId: string): Promise<Sleep | null> {
  const snap = await getDoc(doc(db, `users/${userId}/sleeps/${sleepId}`))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Sleep
}

export function subscribeToSleeps(
  userId: string,
  babyId: string,
  callback: (sleeps: Sleep[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(
    collection(db, `users/${userId}/sleeps`),
    where('babyId', '==', babyId),
    orderBy('startTime', 'desc'),
    limit(300)
  )
  return onSnapshot(
    q,
    (snap) => {
      const sleeps = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Sleep)
      callback(sleeps)
    },
    onError
  )
}

// ── Announcements ──────────────────────────────────────────────────────────────
// Product updates / new-feature notices, authored manually in the Firestore
// console. Each doc: { title, body, publishedAt: timestamp, active: bool }.
// Set active to false to retire an announcement without deleting it.

export async function getLatestAnnouncement(): Promise<Announcement | null> {
  // Order by publishedAt only (single-field, auto-indexed) and filter to the
  // newest active one client-side — avoids needing a composite index.
  const q = query(
    collection(db, 'announcements'),
    orderBy('publishedAt', 'desc'),
    limit(5)
  )
  const snap = await getDocs(q)
  const latest = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Announcement)
    .find((a) => a.active)
  return latest ?? null
}
