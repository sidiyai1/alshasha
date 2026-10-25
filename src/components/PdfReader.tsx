import { useEffect, useRef, useState } from 'react'
import { Download, ExternalLink, Maximize2, Minimize2, Minus, Plus } from 'lucide-react'
import { isSafeMediaUrl } from '../lib/validators.ts'
import { Button } from './ui.tsx'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3

function cancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('name' in error)) return false
  const name = String(error.name)
  return name.includes('Cancel') || name === 'AbortException'
}

export function PdfReader({ url }: { url: string }) {
  const shellRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null)
  const renderRef = useRef<import('pdfjs-dist').RenderTask | null>(null)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [frameWidth, setFrameWidth] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'blocked'>('loading')
  const [fullscreen, setFullscreen] = useState(false)
  const safeUrl = isSafeMediaUrl(url)
  const fullscreenSupported = typeof document !== 'undefined' && document.fullscreenEnabled

  useEffect(() => {
    let cancelledLoad = false
    let closed = false
    let loadingTask: import('pdfjs-dist').PDFDocumentLoadingTask | null = null

    function closeDocument() {
      if (closed) return
      closed = true
      renderRef.current?.cancel()
      pdfRef.current = null
      void loadingTask?.destroy().catch(() => undefined)
    }
    setStatus('loading')
    setPage(1)
    setPageCount(0)
    setZoom(1)

    async function load() {
      if (!isSafeMediaUrl(url)) throw new Error('unsafe-pdf-url')
      const pdfjs = await import('pdfjs-dist')
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      loadingTask = pdfjs.getDocument({
        url,
        enableXfa: false,
        disableStream: true,
        disableAutoFetch: true,
        useWasm: true,
        wasmUrl: '/pdfjs/wasm/',
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        withCredentials: false,
      })
      const pdf = await loadingTask.promise
      if (cancelledLoad) {
        pdfRef.current = null
        void loadingTask.destroy().catch(() => undefined)
        return
      }
      pdfRef.current = pdf
      setPageCount(pdf.numPages)
      setStatus('ready')
    }

    void load().catch(() => {
      if (!cancelledLoad) setStatus('blocked')
    })

    return () => {
      cancelledLoad = true
      closeDocument()
    }
  }, [url])

  useEffect(() => {
    if (status !== 'ready') return
    const frame = frameRef.current
    if (!frame) return
    let frameId = 0
    const measure = () => setFrameWidth(frame.clientWidth)
    measure()
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(measure)
    })
    observer.observe(frame)
    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [status])

  useEffect(() => {
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    const frame = frameRef.current
    if (status !== 'ready' || !pdf || !canvas || !frame || frameWidth <= 0) return
    let stale = false

    async function paint() {
      const current = pdfRef.current
      if (!current || !canvas || !frame) return
      const pdfPage = await current.getPage(page)
      if (stale) return
      const base = pdfPage.getViewport({ scale: 1 })
      const fit = Math.min(2.5, Math.max(0.35, (frame.clientWidth - 4) / base.width))
      const density = Math.min(window.devicePixelRatio || 1, 2)
      const viewport = pdfPage.getViewport({ scale: fit * zoom * density })
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${Math.floor(viewport.width / density)}px`
      canvas.style.height = `${Math.floor(viewport.height / density)}px`
      renderRef.current?.cancel()
      const task = pdfPage.render({ canvas, viewport })
      renderRef.current = task
      await task.promise
    }

    void paint().catch((error: unknown) => {
      if (stale || cancelled(error)) return
      setStatus('blocked')
    })

    return () => {
      stale = true
      renderRef.current?.cancel()
    }
  }, [frameWidth, page, pageCount, status, zoom])

  useEffect(() => {
    function onChange() {
      setFullscreen(document.fullscreenElement === shellRef.current)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === 'PageDown') setPage((current) => Math.min(pageCount || current, current + 1))
      if (event.key === 'PageUp') setPage((current) => Math.max(1, current - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pageCount])

  async function toggleFullscreen() {
    const shell = shellRef.current
    if (!shell || !fullscreenSupported) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await shell.requestFullscreen()
  }

  return (
    <div ref={shellRef} className="border border-brand-line bg-white">
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-brand-line bg-brand-cream p-3">
        <Button type="button" variant="ghost" className="min-h-11" disabled={status !== 'ready' || page <= 1} onClick={() => setPage((current) => current - 1)}>
          السابقة
        </Button>
        <p className="min-w-20 text-center text-sm font-bold text-brand-green" aria-live="polite">
          {pageCount > 0 ? `${page} / ${pageCount}` : '—'}
        </p>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          disabled={status !== 'ready' || page >= pageCount}
          onClick={() => setPage((current) => current + 1)}
        >
          التالية
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          aria-label="تصغير"
          disabled={status !== 'ready' || zoom <= MIN_ZOOM}
          onClick={() => setZoom((current) => Math.max(MIN_ZOOM, Math.round(current * 0.8 * 100) / 100))}
        >
          <Minus aria-hidden="true" size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          aria-label="تكبير"
          disabled={status !== 'ready' || zoom >= MAX_ZOOM}
          onClick={() => setZoom((current) => Math.min(MAX_ZOOM, Math.round(current * 1.25 * 100) / 100))}
        >
          <Plus aria-hidden="true" size={16} />
        </Button>
        <Button type="button" variant="ghost" className="min-h-11" disabled={status !== 'ready'} onClick={() => setZoom(1)}>
          ملاءمة العرض
        </Button>
        {fullscreenSupported ? (
          <Button type="button" variant="ghost" className="min-h-11" onClick={() => void toggleFullscreen()}>
            {fullscreen ? <Minimize2 aria-hidden="true" size={16} /> : <Maximize2 aria-hidden="true" size={16} />}
            {fullscreen ? 'إغلاق' : 'ملء الشاشة'}
          </Button>
        ) : null}
        <a className="inline-flex min-h-11 items-center gap-1 border border-brand-green bg-white px-4 py-2.5 text-sm font-bold text-brand-green" href={safeUrl ? url : undefined} download={safeUrl ? '' : undefined} aria-disabled={!safeUrl}>
          <Download aria-hidden="true" size={16} />
          تنزيل
        </a>
        <a
          className="inline-flex min-h-11 items-center gap-1 bg-brand-green px-4 py-2.5 text-sm font-bold text-white"
          href={safeUrl ? url : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!safeUrl}
        >
          <ExternalLink aria-hidden="true" size={16} />
          فتح الرابط الخارجي
        </a>
      </div>
      <div ref={frameRef} className="overflow-auto bg-brand-cream p-3">
        {status === 'loading' ? <p className="py-16 text-center text-brand-green">جارٍ تحميل ملف PDF</p> : null}
        {status === 'blocked' ? (
          <div className="mx-auto max-w-xl py-10 text-center">
            <p className="text-lg font-extrabold text-brand-green">تعذر عرض الملف داخل الصفحة</p>
            <p className="mt-3 leading-8 text-brand-muted">
              المتصفح منع التضمين، أو الملف لا يسمح بالقراءة من موقع آخر. استخدموا فتح الرابط الخارجي أو التنزيل.
            </p>
          </div>
        ) : null}
        <canvas ref={canvasRef} className={`mx-auto bg-white shadow-sm ${status === 'ready' ? 'block' : 'hidden'}`} />
      </div>
    </div>
  )
}
