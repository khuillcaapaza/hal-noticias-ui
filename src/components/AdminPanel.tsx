"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { usePostEditor } from "@/hooks";
import { useListPosts } from "@/hooks/useListPosts";
import GestorPortada from "@/components/GestorPortada";
import ModalConfirmar, {
  type ConfirmacionState,
} from "@/components/ModalConfirmar";
import PostCard from "@/components/PostCard";
import RichTextEditor from "@/components/RichTextEditor";
import ListHeader from "@/components/ListHeader";
import ListBarrier from "@/components/ListBarrier";
import PostGrid from "@/components/PostGrid";
import PaginationControls from "@/components/PaginationControls";
import Toggle from "@/components/Toggle";
import {
  actualizarPost,
  crearPost,
  eliminarImagen,
  eliminarPost,
  fetchPost,
  fetchPosts,
  subirYRegistrarImagen,
} from "@/lib/api";
import {
  PREVIEW_STORAGE_PREFIX,
  type PostMeta,
  type PostPreviewData,
  type Usuario,
} from "@/lib/types";

interface Props {
  usuario: Usuario;
  onLogout: () => void;
}

const CATEGORIAS = [
  "Institucional",
  "Salud",
  "Vacunación",
  "Prevención",
  "Investigación",
  "General",
];

const COLORES_PORTADA = [
  { valor: "from-green-100 to-green-200", etiqueta: "Verde" },
  { valor: "from-blue-100 to-blue-200", etiqueta: "Azul" },
  { valor: "from-rose-100 to-rose-200", etiqueta: "Rosa" },
  { valor: "from-amber-100 to-amber-200", etiqueta: "Ámbar" },
  { valor: "from-purple-100 to-purple-200", etiqueta: "Morado" },
];

const POR_PAGINA = 9;

function IconoNoticias() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h13a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V4z" />
      <path d="M8 8h7M8 12h7M8 16h4" strokeLinecap="round" />
    </svg>
  );
}

function IconoBuscar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminPanel({ usuario, onLogout }: Props) {
  const [vista, setVista] = useState<"lista" | "editor">("lista");
  // uuid en edición; "" indica un post nuevo (aún no creado).
  const [uuidEditando, setUuidEditando] = useState<string | null>(null);

  // Sincroniza el estado con la URL para que el post en edición
  // (?editar=<uuid> o ?nuevo=1) se refleje en la barra de
  // direcciones y funcionen los botones atrás/adelante del navegador.
  useEffect(() => {
    function aplicarDesdeURL() {
      const params = new URLSearchParams(window.location.search);
      const uuid = params.get("editar");
      if (uuid) {
        setUuidEditando(uuid);
        setVista("editor");
      } else if (params.get("nuevo") !== null) {
        setUuidEditando("");
        setVista("editor");
      } else {
        setUuidEditando(null);
        setVista("lista");
      }
    }
    aplicarDesdeURL();
    window.addEventListener("popstate", aplicarDesdeURL);
    return () => window.removeEventListener("popstate", aplicarDesdeURL);
  }, []);

  function navegar(search: string) {
    const url = window.location.pathname + (search ? "?" + search : "");
    window.history.pushState(null, "", url);
  }

  function irANoticias() {
    setUuidEditando(null);
    setVista("lista");
    navegar("");
  }

  function nuevo() {
    setUuidEditando("");
    setVista("editor");
    navegar("nuevo=1");
  }

  function editar(uuid: string) {
    setUuidEditando(uuid);
    setVista("editor");
    navegar("editar=" + encodeURIComponent(uuid));
  }

  function volverALista() {
    setUuidEditando(null);
    setVista("lista");
    navegar("");
  }

  return (
    <div className="panel">
      <header className="topbar">
        <div className="topbar__brand">
          <strong>Sistema de Noticias</strong>
          <span>Hospital Antonio Lorena</span>
        </div>
        <div className="topbar__user">
          <span>
            Hola, <strong>{usuario.nombre || usuario.usuario}</strong>
            {usuario.rol ? ` (${usuario.rol})` : ""}
          </span>
          <button
            type="button"
            className="boton boton--secundario boton--sm"
            onClick={onLogout}
          >
            Salir
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav>
            <button 
              type="button" 
              className="nav-item nav-item--activo"
              onClick={irANoticias}
            >
              <IconoNoticias />
              Noticias
            </button>
          </nav>
        </aside>

        <main className="contenido">
          {vista === "lista" ? (
            <ListaPosts onNuevo={nuevo} onEditar={editar} />
          ) : (
            <EditorPost
              uuid={uuidEditando ?? ""}
              onVolver={volverALista}
              onCreado={editar}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ── Lista ────────────────────────────────────────────────────────────

function ListaPosts({
  onNuevo,
  onEditar,
}: {
  onNuevo: () => void;
  onEditar: (uuid: string) => void;
}) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionState | null>(null);

  const handleFetch = useCallback(
    async (params: {
      q: string;
      category: string;
      page: number;
      perPage: number;
    }) => {
      const res = await fetchPosts({
        q: params.q,
        category: params.category,
        page: params.page,
        perPage: params.perPage,
      });
      return {
        items: res.items,
        total: res.total,
        totalPages: res.totalPages,
        categories: res.categories,
      };
    },
    []
  );

  const {
    items,
    total,
    totalPaginas,
    cargando,
    error,
    categorias,
    busqueda,
    busquedaAplicada,
    categoria,
    pagina,
    hayFiltro,
    setBusqueda,
    cambiarCategoria,
    setPagina,
    cargar,
  } = useListPosts({
    onFetch: handleFetch,
    perPage: POR_PAGINA,
  });

  const borrar = useCallback(
    (uuid: string, titulo: string) => {
      setConfirmacion({
        titulo: "Eliminar noticia",
        mensaje: `¿Eliminar la noticia "${titulo}" y todas sus imágenes? Esta acción no se puede deshacer.`,
        onConfirmar: async () => {
          try {
            await eliminarPost(uuid);
            setMensaje("Noticia eliminada.");
            // Si era el último de la página, retrocede una.
            if (items.length === 1 && pagina > 1) {
              setPagina(pagina - 1);
            } else {
              await cargar();
            }
          } catch (err) {
            setMensaje((err as Error).message);
          }
        },
      });
    },
    [items.length, pagina, setPagina, cargar]
  );

  const mostrarMensaje = error || mensaje;
  const mostrarLista = total > 0 || hayFiltro;
  const estaVacio = !cargando && total === 0 && !hayFiltro;
  const noHayResultados = !cargando && items.length === 0 && hayFiltro;

  return (
    <section>
      <ListHeader
        title="Noticias"
        subtitle="Crea y administra las notas de prensa y novedades del hospital."
        onCreateNew={onNuevo}
      />

      {mostrarMensaje && (
        <p className="aviso aviso--error">{mostrarMensaje}</p>
      )}

      <ListBarrier
        searchValue={busqueda}
        onSearchChange={setBusqueda}
        categoryValue={categoria}
        onCategoryChange={cambiarCategoria}
        categorias={categorias}
        total={total}
        show={mostrarLista}
      />

      {cargando ? (
        <p className="cargando">Cargando…</p>
      ) : estaVacio ? (
        <p className="cargando">Aún no hay noticias. Crea la primera.</p>
      ) : noHayResultados ? (
        <p className="cargando">
          No se encontraron noticias con esos criterios.
        </p>
      ) : (
        <>
          <PostGrid
            items={items}
            onEdit={onEditar}
            onDelete={borrar}
            isLoading={false}
            isEmpty={false}
          />
          <PaginationControls
            currentPage={pagina}
            totalPages={totalPaginas}
            onPageChange={setPagina}
          />
        </>
      )}

      <ModalConfirmar
        estado={confirmacion}
        onCerrar={() => setConfirmacion(null)}
      />
    </section>
  );
}

// ── Editor ───────────────────────────────────────────────────────────

function EditorPost({
  uuid,
  onVolver,
  onCreado,
}: {
  uuid: string; // "" = nuevo
  onVolver: () => void;
  onCreado: (uuid: string) => void;
}) {
  const [guardando, setGuardando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionState | null>(null);

  const editor = usePostEditor({
    uuid,
    onFetchPost: fetchPost,
    onUpdatePost: actualizarPost,
  });

  // El slug (legible) identifica las carpetas de imágenes y el sitio público.
  const slug = editor.post?.slug ?? "";

  async function guardar(e: FormEvent) {
    e.preventDefault();
    // En modo edición el guardado es automático; el submit (p. ej. Enter) no hace nada.
    if (!editor.esNuevo) return;
    if (!editor.form.titulo.trim()) {
      editor.setMensaje("El título es obligatorio.");
      return;
    }
    if (!editor.form.fecha_publicacion) {
      editor.setMensaje("La fecha de publicación es obligatoria.");
      return;
    }
    setGuardando(true);
    try {
      const nuevoUuid = await crearPost(editor.form);
      editor.setMensaje("Noticia creada. Ya puedes añadir la portada e imágenes.");
      onCreado(nuevoUuid); // pasa a modo edición del nuevo post
    } catch (err) {
      editor.setMensaje((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  // Sube una imagen incrustada en el cuerpo (requiere post ya creado).
  const subirImagenCuerpo = useCallback(
    async (file: File): Promise<string> => {
      const res = await subirYRegistrarImagen(uuid, file, {
        esPortada: false,
      });
      return res.url;
    },
    [slug, uuid]
  );

  // Abre la noticia en una pestaña nueva como página completa, reflejando el
  // estado actual del formulario (aunque no se haya guardado), incluso en borrador.
  function abrirVistaPrevia() {
    const datos: PostPreviewData = {
      title: editor.form.titulo,
      excerpt: editor.form.excerpt,
      category: editor.form.categoria,
      date: editor.form.fecha_publicacion,
      author: editor.form.autor,
      coverColor: editor.form.cover_color,
      cover: editor.post?.cover ?? null,
      cuerpo: editor.form.cuerpo,
      publicado: editor.form.publicado,
    };
    try {
      window.localStorage.setItem(
        PREVIEW_STORAGE_PREFIX + uuid,
        JSON.stringify(datos)
      );
    } catch {
      // Si localStorage falla, la pestaña usará la versión guardada en la API.
    }
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    window.open(
      `${base}/preview/?uuid=${encodeURIComponent(uuid)}`,
      "_blank",
      "noopener"
    );
  }

  // Meta en vivo para la vista previa de la tarjeta (refleja el formulario).
  const previewMeta: PostMeta = {
    uuid: uuid || "nueva-noticia",
    slug: slug || "nueva-noticia",
    title: editor.form.titulo.trim() || "Título de la noticia",
    excerpt: editor.form.excerpt.trim() || "Resumen de la noticia…",
    category: editor.form.categoria,
    date: editor.form.fecha_publicacion || "—",
    author: editor.form.autor.trim() || "Autor",
    coverColor: editor.form.cover_color,
    cover: editor.post?.cover ?? null,
    publicado: editor.form.publicado,
  };

  return (
    <section>
      <button type="button" className="link-volver" onClick={onVolver}>
        ← Volver a la lista
      </button>

      <div className="seccion-head">
        <h2>{editor.esNuevo ? "Nueva noticia" : "Editar noticia"}</h2>
        {!editor.esNuevo && (
          <div className="editor-actions">
            <button
              type="button"
              className="boton boton--sm"
              onClick={abrirVistaPrevia}
            >
              Vista previa
            </button>
            <Toggle
              id="publicar-toggle"
              label="Publicar"
              checked={editor.form.publicado}
              disabled={false}
              onChange={(checked) => {
                editor.set("publicado", checked);
                setTimeout(() => {
                  editor.guardarAhora();
                }, 0);
              }}
              ariaLabel="Cambiar estado de publicación"
            />
          </div>
        )}
      </div>

      {editor.mensaje && (
        <p className="aviso aviso--error">
          {editor.mensaje}
        </p>
      )}

      {editor.cargando ? (
        <p className="cargando">Cargando…</p>
      ) : (
        <div className="editor-layout">
          <div className="editor-layout__main">
            <form className="panel-card" onSubmit={guardar} noValidate>
            <label className="campo">
              <span>Título</span>
              <input
                type="text"
                value={editor.form.titulo}
                onChange={(e) => editor.set("titulo", e.target.value)}
                maxLength={220}
                required
              />
            </label>

            <div className="fila">
              <label className="campo">
                <span>Categoría</span>
                <select
                  value={editor.form.categoria}
                  onChange={(e) => editor.set("categoria", e.target.value)}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="campo">
                <span>Fecha de publicación</span>
                <input
                  type="date"
                  value={editor.form.fecha_publicacion}
                  onChange={(e) => editor.set("fecha_publicacion", e.target.value)}
                  required
                />
              </label>

              <label className="campo">
                <span>Color de portada</span>
                <select
                  value={editor.form.cover_color}
                  onChange={(e) => editor.set("cover_color", e.target.value)}
                >
                  {COLORES_PORTADA.map((c) => (
                    <option key={c.valor} value={c.valor}>
                      {c.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="campo">
              <span>Autor</span>
              <input
                type="text"
                value={editor.form.autor}
                onChange={(e) => editor.set("autor", e.target.value)}
                maxLength={160}
              />
            </label>

            <label className="campo">
              <span>Resumen (para tarjetas y vista previa)</span>
              <textarea
                rows={3}
                value={editor.form.excerpt}
                onChange={(e) => editor.set("excerpt", e.target.value)}
                maxLength={500}
              />
            </label>

            <div className="campo">
              <span>Contenido</span>
              {editor.esNuevo ? (
                <p className="seccion-sub">
                  Guarda la noticia para habilitar el editor con imágenes.
                </p>
              ) : (
                <RichTextEditor
                  value={editor.form.cuerpo}
                  onChange={(html) => editor.set("cuerpo", html)}
                  onImageUpload={subirImagenCuerpo}
                  placeholder="Escribe el contenido de la noticia…"
                />
              )}
            </div>

            <div className="fila fila--acciones">
              {editor.esNuevo ? (
                <button type="submit" className="boton" disabled={guardando}>
                  {guardando ? "Creando…" : "Crear noticia"}
                </button>
              ) : (
                <span
                  className={"autosave autosave--" + editor.autoEstado}
                  role="status"
                  aria-live="polite"
                >
                  {editor.autoEstado === "guardando"
                    ? "Guardando…"
                    : editor.autoEstado === "pendiente"
                      ? "Cambios sin guardar…"
                      : editor.autoEstado === "guardado"
                        ? "Guardado automáticamente"
                        : editor.autoEstado === "error"
                          ? "Error al guardar"
                          : "Todos los cambios guardados"}
                </span>
              )}
            </div>
          </form>
          </div>

          <aside className="editor-layout__side">
            <div className="preview-card-wrap">
              <span className="preview-card-wrap__label">
                Vista previa de la tarjeta
              </span>
              <PostCard post={previewMeta} preview />
            </div>

            {!editor.esNuevo && editor.post && (
              <GestorPortada post={editor.post} onCambio={() => editor.cargar?.()} />
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
