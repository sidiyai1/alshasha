import type { ReactNode } from 'react'

export const pageShell = 'mx-auto w-full max-w-[90rem] px-4 sm:px-5 lg:px-6'

export function PageFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${pageShell} py-6 lg:py-8 ${className}`}>{children}</div>
}
