import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

class AppErrorBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null }

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' }
  }

  render() {
    if (this.state.message) {
      return (
        <div className="grid min-h-screen place-items-center px-4 text-center" role="alert">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-green">تعذر عرض الصفحة</h1>
            <p className="mt-2">{this.state.message}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
if (!root) throw new Error('Missing root element')

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
