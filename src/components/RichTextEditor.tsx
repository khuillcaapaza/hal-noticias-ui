"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

interface Props {
  value: string;
  onChange: (html: string) => void;
  /** Sube una imagen y devuelve su URL pública para incrustarla. */
  onImageUpload: (file: File) => Promise<string>;
  placeholder?: string;
}

/** Envoltorio SVG con estilo uniforme para los iconos de la barra. */
function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function BotonBarra({
  activo,
  disabled,
  onClick,
  title,
  children,
}: {
  activo?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={"rte-btn" + (activo ? " rte-btn--activo" : "")}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

function Barra({
  editor,
  onPedirImagen,
  subiendo,
}: {
  editor: Editor;
  onPedirImagen: () => void;
  subiendo: boolean;
}) {
  function ponerEnlace() {
    const previo = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace:", previo ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  return (
    <div className="rte-barra">
      <BotonBarra
        title="Negrita"
        activo={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </BotonBarra>
      <BotonBarra
        title="Cursiva"
        activo={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </BotonBarra>
      <BotonBarra
        title="Tachado"
        activo={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </BotonBarra>
      <span className="rte-sep" />
      <BotonBarra
        title="Título"
        activo={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        H2
      </BotonBarra>
      <BotonBarra
        title="Subtítulo"
        activo={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        H3
      </BotonBarra>
      <span className="rte-sep" />
      <BotonBarra
        title="Lista con viñetas"
        activo={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <Svg>
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <line x1="4" y1="6" x2="4.01" y2="6" />
          <line x1="4" y1="12" x2="4.01" y2="12" />
          <line x1="4" y1="18" x2="4.01" y2="18" />
        </Svg>
      </BotonBarra>
      <BotonBarra
        title="Lista numerada"
        activo={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <Svg>
          <line x1="10" y1="6" x2="20" y2="6" />
          <line x1="10" y1="12" x2="20" y2="12" />
          <line x1="10" y1="18" x2="20" y2="18" />
          <text
            x="1"
            y="8"
            fontSize="7"
            stroke="none"
            fill="currentColor"
          >
            1
          </text>
          <text
            x="1"
            y="14"
            fontSize="7"
            stroke="none"
            fill="currentColor"
          >
            2
          </text>
          <text
            x="1"
            y="20"
            fontSize="7"
            stroke="none"
            fill="currentColor"
          >
            3
          </text>
        </Svg>
      </BotonBarra>
      <BotonBarra
        title="Cita"
        activo={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Svg>
          <path
            d="M7 7H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2v1a2 2 0 0 1-2 2"
            fill="none"
          />
          <path
            d="M17 7h-3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2v1a2 2 0 0 1-2 2"
            fill="none"
          />
        </Svg>
      </BotonBarra>
      <span className="rte-sep" />
      <BotonBarra
        title="Enlace"
        activo={editor.isActive("link")}
        onClick={ponerEnlace}
      >
        <Svg>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </Svg>
      </BotonBarra>
      <BotonBarra
        title="Insertar imagen"
        disabled={subiendo}
        onClick={onPedirImagen}
      >
        {subiendo ? (
          "…"
        ) : (
          <Svg>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </Svg>
        )}
      </BotonBarra>
      <span className="rte-sep" />
      <BotonBarra
        title="Deshacer"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Svg>
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </Svg>
      </BotonBarra>
      <BotonBarra
        title="Rehacer"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Svg>
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </Svg>
      </BotonBarra>
    </div>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  onImageUpload,
  placeholder,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const subiendoRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rte-area",
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sincroniza el contenido externo (al cargar un post existente).
  useEffect(() => {
    if (!editor) return;
    const actual = editor.getHTML();
    if (value && value !== actual) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  async function onSeleccionImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor || subiendoRef.current) return;
    subiendoRef.current = true;
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      // El componente padre muestra el error; aquí solo evitamos romper el editor.
    } finally {
      subiendoRef.current = false;
    }
  }

  if (!editor) {
    return <div className="rte rte--cargando">Cargando editor…</div>;
  }

  return (
    <div className="rte">
      <Barra
        editor={editor}
        subiendo={subiendoRef.current}
        onPedirImagen={() => fileRef.current?.click()}
      />
      <EditorContent editor={editor} />
      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        hidden
        onChange={onSeleccionImagen}
      />
    </div>
  );
}
