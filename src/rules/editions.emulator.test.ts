// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import rules from '../../firestore.rules?raw'
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'

const emulator = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.FIRESTORE_EMULATOR_HOST

function clientDb(context: { firestore: () => unknown }): Firestore {
  return context.firestore() as unknown as Firestore
}

function publishedEdition(createdAt: unknown = serverTimestamp()) {
  return {
    issueNumber: 1284,
    title: 'ملف المعيشة',
    description: 'وصف تجريبي للعدد يكفي للقاعدة.',
    coverImageUrl: 'https://cdn.example.com/cover.jpg',
    pdfUrl: 'https://cdn.example.com/issue.pdf',
    status: 'published',
    isDemo: false,
    publishedAt: Timestamp.fromDate(new Date('2026-10-20T02:00:00.000Z')),
    createdAt,
    updatedAt: serverTimestamp(),
  }
}

describe.skipIf(!emulator)('unauthorized edition writes', () => {
  let testEnv: import('@firebase/rules-unit-testing').RulesTestEnvironment

  beforeAll(async () => {
    const { initializeTestEnvironment } = await import('@firebase/rules-unit-testing')
    const host = emulator?.split(':')[0] ?? '127.0.0.1'
    const port = Number(emulator?.split(':')[1] ?? 8080)
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-alshasha',
      firestore: {
        rules,
        host,
        port,
      },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'admins', 'admin-1'), { role: 'admin' })
    })
  })

  async function savedEdition(id: string): Promise<DocumentData> {
    let data: DocumentData | undefined
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const snapshot = await getDoc(doc(context.firestore(), 'editions', id))
      data = snapshot.data()
    })
    if (!data) throw new Error('missing edition')
    return data
  }

  it('blocks guests and signed-in non-admins from creating, changing, or deleting an edition', async () => {
    const { assertFails, assertSucceeds } = await import('@firebase/rules-unit-testing')
    const admin = clientDb(testEnv.authenticatedContext('admin-1'))
    const guest = clientDb(testEnv.unauthenticatedContext())
    const stranger = clientDb(testEnv.authenticatedContext('stranger'))

    await assertSucceeds(setDoc(doc(admin, 'editions', 'issue-1'), publishedEdition()))
    const current = await savedEdition('issue-1')

    await assertFails(setDoc(doc(guest, 'editions', 'evil'), publishedEdition()))
    await assertFails(setDoc(doc(stranger, 'editions', 'evil'), publishedEdition()))
    await assertFails(setDoc(doc(guest, 'editions', 'issue-1'), { ...publishedEdition(current.createdAt), title: 'تعديل ممنوع' }))
    await assertFails(setDoc(doc(stranger, 'editions', 'issue-1'), { ...publishedEdition(current.createdAt), title: 'تعديل ممنوع' }))
    await assertFails(deleteDoc(doc(guest, 'editions', 'issue-1')))
    await assertFails(deleteDoc(doc(stranger, 'editions', 'issue-1')))
    await assertFails(setDoc(doc(stranger, 'admins', 'stranger'), { role: 'admin' }))
    await assertFails(setDoc(doc(admin, 'admins', 'admin-1'), { role: 'admin' }))
    await assertFails(setDoc(doc(stranger, 'articles', 'story'), { title: 'محاولة تعديل' }))
    await assertFails(setDoc(doc(guest, 'articles', 'story'), { title: 'محاولة تعديل' }))
    await assertFails(deleteDoc(doc(stranger, 'articles', 'story')))
    await assertFails(setDoc(doc(stranger, 'settings', 'site'), { siteName: 'اختراق' }))
    await assertFails(setDoc(doc(guest, 'settings', 'site'), { siteName: 'اختراق' }))

    await assertSucceeds(getDoc(doc(guest, 'editions', 'issue-1')))
    await assertFails(
      setDoc(doc(admin, 'editions', 'embedded'), {
        ...publishedEdition(),
        pdfUrl: 'data:application/pdf;base64,AAAA',
      }),
    )
  })

  it('hides unpublished editions from the public', async () => {
    const { assertFails, assertSucceeds } = await import('@firebase/rules-unit-testing')
    const admin = clientDb(testEnv.authenticatedContext('admin-1'))
    const guest = clientDb(testEnv.unauthenticatedContext())
    await assertSucceeds(
      setDoc(doc(admin, 'editions', 'draft-1'), {
        ...publishedEdition(),
        status: 'draft',
        publishedAt: null,
        pdfUrl: '',
        coverImageUrl: '',
        description: '',
      }),
    )
    await assertFails(getDoc(doc(guest, 'editions', 'draft-1')))
    await assertSucceeds(getDoc(doc(admin, 'editions', 'draft-1')))
  })
})
