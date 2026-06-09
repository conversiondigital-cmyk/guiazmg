"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import CharacterCount from "@tiptap/extension-character-count"
import { useEffect, useCallback, useRef } from "react"
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link2, ImageUp,
  AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Minus, Loader2,
} from "lucide-react"
import { useState } from "react"

interface RichEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

function ToolbarBtn({
  onClick, active, title, disabled, children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded text-sm transition-colors disabled:opacity-40
        ${active
          ? "bg-green-100 text-green-800"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="h-5 w-px bg-gray-200 mx-1" />
}

export function RichEditor({ content, onChange, placeholder = "Escribe el contenido del artículo..." }: RichEditorProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({
        inline: false,
        allowBase64: false, // R2 rule: NO base64, always upload
        HTMLAttributes: { class: "rounded-xl max-w-full shadow-sm" },
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-green-700 underline" } }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none min-h-[400px] focus:outline-none px-5 py-4",
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount

  // Upload image to R2 via /api/upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "blog")

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? "Upload failed")

      // Insert image with R2 URL — never base64
      editor.chain().focus().setImage({ src: data.url, alt: file.name }).run()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al subir imagen")
    } finally {
      setUploading(false)
    }
  }, [editor])

  const triggerImageUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
    e.target.value = "" // reset
  }, [handleImageUpload])

  // Also handle paste of images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find((i) => i.type.startsWith("image/"))
    if (imageItem) {
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (file) handleImageUpload(file)
    }
  }, [handleImageUpload])

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes("link").href
    const url = window.prompt("URL del enlace:", prev || "https://")
    if (url === null) return
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  const charCount  = editor.storage.characterCount?.characters?.() ?? 0
  const wordCount  = editor.storage.characterCount?.words?.() ?? 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5 sticky top-0 z-10">
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Deshacer"><Undo className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Rehacer"><Redo className="h-3.5 w-3.5" /></ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive("bold")}      title="Negrita"><Bold className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive("italic")}    title="Cursiva"><Italic className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Subrayado"><UnderlineIcon className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()}    active={editor.isActive("strike")}    title="Tachado"><Strikethrough className="h-3.5 w-3.5" /></ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Encabezado 2"><Heading2 className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Encabezado 3"><Heading3 className="h-3.5 w-3.5" /></ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive("bulletList")}  title="Lista"><List className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada"><ListOrdered className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Cita"><Quote className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()}       active={editor.isActive("code")}       title="Código inline"><Code className="h-3.5 w-3.5" /></ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()}   active={editor.isActive({ textAlign: "left" })}   title="Alinear izquierda"><AlignLeft className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centrar"><AlignCenter className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()}  active={editor.isActive({ textAlign: "right" })}  title="Alinear derecha"><AlignRight className="h-3.5 w-3.5" /></ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={setLink}            active={editor.isActive("link")} title="Insertar enlace"><Link2 className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={triggerImageUpload} title="Subir imagen a R2"        disabled={uploading}>
          {uploading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <ImageUp className="h-3.5 w-3.5" />
          }
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador"><Minus className="h-3.5 w-3.5" /></ToolbarBtn>
      </div>

      {/* Editor area */}
      <div onPaste={handlePaste}>
        <EditorContent editor={editor} />
      </div>

      {/* Stats bar */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-1.5 flex items-center justify-between text-xs text-gray-400">
        <span className="text-[10px] text-green-700 font-medium">
          📎 Imágenes: se suben a Cloudflare R2 automáticamente
        </span>
        <div className="flex gap-4">
          <span>{wordCount} palabras</span>
          <span>{charCount} caracteres</span>
        </div>
      </div>
    </div>
  )
}
