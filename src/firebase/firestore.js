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
  setDoc,
} from 'firebase/firestore'
import { db } from './config'

// ── Babies ────────────────────────────────────────────────────────────────────

export async function createBaby(userId, data) {
  const ref = await addDoc(collection(db, `users/${userId}/babies`), {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateBaby(userId, babyId, data) {
  await updateDoc(doc(db, `users/${userId}/babies/${babyId}`), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function getActiveBaby(userId) {
  const q = query(
    collection(db, `users/${userId}/babies`),
    where('isActive', '==', true),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

// ── Feedings ─────────────────────────────────────────────────────────────────

export async function addFeeding(userId, data) {
  const ref = await addDoc(collection(db, `users/${userId}/feedings`), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateFeeding(userId, feedingId, data) {
  await updateDoc(doc(db, `users/${userId}/feedings/${feedingId}`), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteFeeding(userId, feedingId) {
  await deleteDoc(doc(db, `users/${userId}/feedings/${feedingId}`))
}

export async function getFeeding(userId, feedingId) {
  const snap = await getDoc(doc(db, `users/${userId}/feedings/${feedingId}`))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export function subscribeToFeedings(userId, babyId, callback, onError) {
  const q = query(
    collection(db, `users/${userId}/feedings`),
    where('babyId', '==', babyId),
    orderBy('startTime', 'desc'),
    limit(300)
  )
  return onSnapshot(
    q,
    (snap) => {
      const feedings = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(feedings)
    },
    onError
  )
}

// ── Sleeps ───────────────────────────────────────────────────────────────────

export async function addSleep(userId, data) {
  const ref = await addDoc(collection(db, `users/${userId}/sleeps`), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateSleep(userId, sleepId, data) {
  await updateDoc(doc(db, `users/${userId}/sleeps/${sleepId}`), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteSleep(userId, sleepId) {
  await deleteDoc(doc(db, `users/${userId}/sleeps/${sleepId}`))
}

export async function getSleep(userId, sleepId) {
  const snap = await getDoc(doc(db, `users/${userId}/sleeps/${sleepId}`))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export function subscribeToSleeps(userId, babyId, callback, onError) {
  const q = query(
    collection(db, `users/${userId}/sleeps`),
    where('babyId', '==', babyId),
    orderBy('startTime', 'desc'),
    limit(300)
  )
  return onSnapshot(
    q,
    (snap) => {
      const sleeps = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(sleeps)
    },
    onError
  )
}
