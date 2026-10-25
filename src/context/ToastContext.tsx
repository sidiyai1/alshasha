import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface ToastItem {
  id: number
  tone: 'success' | 'error'
  text: string
}

interface ToastState {
  push: (tone: ToastItem['tone'], text: string) => void
}

const ToastContext = createContext<ToastState | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((tone: ToastItem['tone'], text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setItems((current) => [...current, { id, tone, text }])
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id))
    }, 4200)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="no-print pointer-events-none fixed bottom-4 left-4 z-50 flex w-[min(100%-2rem,24rem)] flex-col gap-2" aria-live="polite">
        {items.map((item) => (
          <p
            key={item.id}
            role={item.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto border px-4 py-3 text-sm font-semibold shadow-sm ${
              item.tone === 'error'
                ? 'border-red-200 bg-white text-red-800'
                : 'border-brand-line bg-white text-brand-green'
            }`}
          >
            {item.text}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastState {
  const value = useContext(ToastContext)
  if (!value) throw new Error('ToastProvider missing')
  return value
}
