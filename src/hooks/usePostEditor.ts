import { useCallback, useEffect, useRef, useState } from "react";
import { useAutoSave } from "./useAutoSave";
import { type Post, type PostInput } from "@/lib/types";

interface UsePostEditorOptions {
  uuid: string; // "" para nuevo post
  onFetchPost?: (uuid: string) => Promise<Post>;
  onUpdatePost?: (uuid: string, data: PostInput) => Promise<void>;
}

/**
 * Hook para manejar la lógica del editor de posts.
 * Incluye carga, cambios detectados, autoguardado y validación.
 */
export function usePostEditor({
  uuid,
  onFetchPost,
  onUpdatePost,
}: UsePostEditorOptions) {
  const esNuevo = uuid === "";
  const [form, setForm] = useState<PostInput>({
    titulo: "",
    excerpt: "",
    categoria: "Institucional",
    fecha_publicacion: "",
    autor: "Unidad de Comunicaciones e Imagen Institucional",
    cover_color: "from-green-100 to-green-200",
    cuerpo: "",
    publicado: true,
  });
  const [post, setPost] = useState<Post | null>(null);
  const [cargando, setCargando] = useState(!esNuevo);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const skipFirstUpdateRef = useRef(true); // ignorar primera actualización después de cargar

  const autoSave = useAutoSave({
    debounceMs: 900,
    onSave: onUpdatePost ? (data) => onUpdatePost(uuid, data) : undefined,
    isValid: () => !!form.titulo.trim() && !!form.fecha_publicacion,
  });

  // Cargar post existente
  const cargar = useCallback(async () => {
    if (esNuevo || !onFetchPost) return;
    setCargando(true);
    try {
      const p = await onFetchPost(uuid);
      setPost(p);
      setForm({
        titulo: p.title,
        excerpt: p.excerpt,
        categoria: p.category,
        fecha_publicacion: p.date,
        autor: p.author,
        cover_color: p.coverColor,
        cuerpo: p.cuerpo ?? "",
        publicado: p.publicado,
      });
      autoSave.resetearAutosave();
      skipFirstUpdateRef.current = true; // ignorar la próxima actualización del effect
      setMensaje(null);
    } catch (err) {
      setMensaje((err as Error).message);
    } finally {
      setCargando(false);
    }
  }, [uuid, esNuevo, onFetchPost]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Actualizar campo del formulario
  function set<K extends keyof PostInput>(campo: K, valor: PostInput[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  // Iniciar autoguardado cuando el form cambia
  useEffect(() => {
    if (esNuevo) return;
    
    // Ignorar la primera actualización después de cargar
    if (skipFirstUpdateRef.current) {
      skipFirstUpdateRef.current = false;
      autoSave.saltarAutosave.current = false; // permitir autosave en el próximo cambio
      return;
    }
    
    // Marcar cambios después de cargar
    autoSave.registrarCambio();
    const cleanup = autoSave.iniciarAutosave(form);
    return cleanup;
  }, [form, esNuevo]);

  return {
    form,
    setForm,
    set,
    post,
    setPost,
    cargando,
    setCargando,
    mensaje,
    setMensaje,
    hayChanges: autoSave.hayChanges,
    autoEstado: autoSave.autoEstado,
    guardarAhora: () => autoSave.guardarAhora(form),
    esNuevo,
    cargar,
  };
}
