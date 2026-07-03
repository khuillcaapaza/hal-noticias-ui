export interface Usuario {
  usuario: string;
  email?: string;
  nombre?: string;
  rol?: string;
}

/** Aviso de feedback para el usuario (formularios, acciones). */
export type Mensaje = { texto: string; tipo: "ok" | "error" } | null;

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

/** Respuesta del primer paso del login: se envió un código al email. */
export interface LoginChallenge {
  requiere2fa: true;
  email: string;
  expira_en?: number;
  mensaje?: string;
  /** Solo en modo desarrollo (APP_DEBUG): código para autocompletar. */
  dev_codigo?: string;
}

// ── Posts / Noticias ───────────────────────────────────────────────────

/** Imagen asociada a un post (portada o incrustada en el cuerpo). */
export interface PostImagen {
  id: number;
  name: string;
  ext: string;
  size: number;
  isCover: boolean;
  url: string;
}

/** Metadatos de un post (listados). */
export interface PostMeta {
  /** Identificador estable usado en la URL del panel y las rutas de la API. */
  uuid: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  /** Fecha ISO `yyyy-mm-dd`. */
  date: string;
  author: string;
  coverColor: string;
  /** URL pública de la portada, o null si no tiene. */
  cover: string | null;
  publicado: boolean;
}

/** Post completo, con su cuerpo HTML e imágenes. */
export interface Post extends PostMeta {
  cuerpo?: string;
  actualizado?: string | null;
  imagenes: PostImagen[];
}

/** Página de resultados del listado de posts (búsqueda + paginación). */
export interface PostListResult {
  items: PostMeta[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  categories: string[];
}

/** Datos del formulario para crear/editar un post. */
export interface PostInput {
  slug?: string;
  titulo: string;
  excerpt: string;
  categoria: string;
  fecha_publicacion: string;
  autor: string;
  cover_color: string;
  /** Contenido HTML generado por el editor. */
  cuerpo: string;
  publicado: boolean;
}

/** Resultado de subir una imagen a hal-archivos-api. */
export interface UploadResult {
  ok: boolean;
  slug: string;
  nombre: string;
  ext: string;
  tamano: number;
  url: string;
}

/**
 * Datos que el editor traspasa (vía localStorage) a la página de vista previa,
 * para reflejar el estado actual del formulario aunque aún no se haya guardado.
 */
export interface PostPreviewData {
  title: string;
  excerpt: string;
  category: string;
  /** Fecha ISO `yyyy-mm-dd`. */
  date: string;
  author: string;
  coverColor: string;
  cover: string | null;
  cuerpo: string;
  publicado: boolean;
}

/** Prefijo de la clave de localStorage usada para la vista previa de un post. */
export const PREVIEW_STORAGE_PREFIX = "noticias_preview:";
