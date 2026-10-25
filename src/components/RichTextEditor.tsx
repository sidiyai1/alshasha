import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { Placeholder } from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { useState } from 'react'
import { Button, TextInput } from './ui.tsx'

const httpsUrl = /^https:\/\/[^\s<>"']+$/i

export function RichTextEditor({
  initialHtml,
  onChange,
}: {
  initialHtml: string
  onChange: (html: string) => void
}) {
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: false,
          linkOnPaste: false,
          defaultProtocol: 'https',
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
          isAllowedUri: (url) => httpsUrl.test(url),
        },
      }),
      Placeholder.configure({ placeholder: 'اكتبوا نص الخبر هنا…' }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        dir: 'rtl',
        class: 'tiptap px-3 py-3',
        'aria-label': 'نص الخبر',
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  })

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      underline: current.isActive('underline'),
      h2: current.isActive('heading', { level: 2 }),
      h3: current.isActive('heading', { level: 3 }),
      bullet: current.isActive('bulletList'),
      ordered: current.isActive('orderedList'),
      quote: current.isActive('blockquote'),
    }),
  })

  if (!editor) return null

  function applyLink() {
    const href = linkUrl.trim()
    if (!href) {
      editor?.chain().focus().unsetLink().run()
      setLinkError('')
      return
    }
    if (!httpsUrl.test(href)) {
      setLinkError('الرابط يجب أن يبدأ بـ https://')
      return
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href }).run()
    setLinkError('')
  }

  const tools = [
    ['عريض', () => editor.chain().focus().toggleBold().run(), active.bold],
    ['مائل', () => editor.chain().focus().toggleItalic().run(), active.italic],
    ['تحته خط', () => editor.chain().focus().toggleUnderline().run(), active.underline],
    ['عنوان', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active.h2],
    ['عنوان فرعي', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active.h3],
    ['قائمة', () => editor.chain().focus().toggleBulletList().run(), active.bullet],
    ['ترقيم', () => editor.chain().focus().toggleOrderedList().run(), active.ordered],
    ['اقتباس', () => editor.chain().focus().toggleBlockquote().run(), active.quote],
  ] as const

  return (
    <div className="border border-brand-line bg-white">
      <div className="no-print flex flex-wrap gap-1 border-b border-brand-line bg-brand-cream p-2">
        {tools.map(([label, action, pressed]) => (
          <button
            key={label}
            type="button"
            aria-pressed={pressed}
            onClick={action}
            className={`px-2.5 py-1.5 text-sm font-bold ${pressed ? 'bg-brand-green text-white' : 'bg-white text-brand-green'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
      <div className="no-print flex flex-col gap-2 border-t border-brand-line p-2 sm:flex-row">
        <TextInput
          value={linkUrl}
          onChange={(event) => setLinkUrl(event.target.value)}
          placeholder="https://example.com"
          aria-label="رابط"
          inputMode="url"
        />
        <Button type="button" variant="ghost" onClick={applyLink}>
          إدراج الرابط
        </Button>
      </div>
      {linkError ? (
        <p className="px-2 pb-2 text-sm text-red-700" role="alert">
          {linkError}
        </p>
      ) : null}
    </div>
  )
}
