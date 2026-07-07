import axios from "axios";
import type {
  Post,
  PostInput,
  PostListResult,
  PostMeta,
  UploadResult,
  Usuario,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";
const FILES_API_BASE = process.env.NEXT_PUBLIC_FILES_API_BASE || "";
const COOKIE_NAME = "hal_token";
const HAL_AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3005";

// ── Cookie SSO (escrita por hal-auth) ───────────────────────────────

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function clearToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; domain=localhost; path=/; max-age=0`;
}

export function redirectToAuth(): void {
  if (typeof window === "undefined") return;
  window.location.href = HAL_AUTH_URL;
}

const http = axios.create({ baseURL: API_BASE });

// Añade el token a cada petición si existe.
http.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Normaliza errores y gestiona la expiración de sesión (401).
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:logout"));
      }
      return Promise.reject(new Error("Sesión expirada. Inicia sesión de nuevo."));
    }
    const msg =
      error?.response?.data?.error || error?.message || "Error en la solicitud";
    return Promise.reject(new Error(msg));
  }
);

export async function fetchPerfil(): Promise<Usuario> {
  const { data } = await http.get<{ usuario: Usuario }>("/me");
  return data.usuario;
}

// ── Posts (administración, requiere JWT) ───────────────────────────────

export interface FetchPostsParams {
  q?: string;
  category?: string;
  page?: number;
  perPage?: number;
}

interface PostsResponse {
  posts: PostMeta[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    categories: string[];
  };
}

export async function fetchPosts(
  params: FetchPostsParams = {}
): Promise<PostListResult> {
  const { data } = await http.get<PostsResponse>("/admin/posts", {
    params: {
      q: params.q || undefined,
      category: params.category || undefined,
      page: params.page ?? undefined,
      per_page: params.perPage ?? undefined,
    },
  });
  return {
    items: data.posts,
    total: data.meta.total,
    page: data.meta.page,
    perPage: data.meta.per_page,
    totalPages: data.meta.total_pages,
    categories: data.meta.categories ?? [],
  };
}

export async function fetchPost(uuid: string): Promise<Post> {
  const { data } = await http.get<{ post: Post }>(
    `/admin/posts/${encodeURIComponent(uuid)}`
  );
  return data.post;
}

export async function crearPost(input: PostInput): Promise<string> {
  const { data } = await http.post<{ uuid: string }>("/admin/posts", input);
  return data.uuid;
}

export async function actualizarPost(
  uuid: string,
  input: PostInput
): Promise<void> {
  await http.put(`/admin/posts/${encodeURIComponent(uuid)}`, input);
}

export async function eliminarPost(uuid: string): Promise<void> {
  await http.delete(`/admin/posts/${encodeURIComponent(uuid)}`);
}

/** Registra el metadato de una imagen ya subida al servicio de archivos. */
export async function registrarImagen(
  uuid: string,
  meta: { nombre: string; ext: string; tamano: number; es_portada?: boolean }
): Promise<number> {
  const { data } = await http.post<{ id: number }>(
    `/admin/posts/${encodeURIComponent(uuid)}/imagenes`,
    meta
  );
  return data.id;
}

export async function eliminarImagen(uuid: string, id: number): Promise<void> {
  await http.delete(`/admin/posts/${encodeURIComponent(uuid)}/imagenes/${id}`);
}

// ── Subida directa a hal-archivos-api (colección "posts") ──────────────

export async function subirImagen(
  uuid: string,
  subfolder: "cover" | "foto",
  archivo: File,
  onProgress?: (porcentaje: number) => void
): Promise<UploadResult> {
  const form = new FormData();
  form.append("uuid", uuid);
  form.append("subfolder", subfolder);
  form.append("archivo", archivo);
  const token = getToken();
  const { data } = await axios.post<UploadResult>(
    `${FILES_API_BASE}/posts/upload`,
    form,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      onUploadProgress: (e) => {
        if (!onProgress) return;
        const total = e.total ?? archivo.size;
        if (total > 0) {
          onProgress(Math.min(100, Math.round((e.loaded * 100) / total)));
        }
      },
    }
  );
  return data;
}

/** Borra el binario físico (usado para revertir subidas huérfanas). */
export async function eliminarImagenFisica(
  uuid: string,
  subfolder: "cover" | "foto",
  nombre: string
): Promise<void> {
  const token = getToken();
  await axios.delete(`${FILES_API_BASE}/posts/delete`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    data: { uuid, subfolder, nombre },
  });
}

/**
 * Sube una imagen y registra su metadato en un solo paso. El binario físico se
 * guarda por `slug` (carpeta en hal-archivos-api) y el metadato se asocia al
 * post por `uuid`. Si el registro falla, revierte el binario huérfano. Devuelve
 * la URL pública para incrustar.
 */
export async function subirYRegistrarImagen(
  uuid: string,
  archivo: File,
  opciones?: { esPortada?: boolean; onProgress?: (p: number) => void }
): Promise<UploadResult> {
  const esPortada = opciones?.esPortada ?? false;
  const subfolder: "cover" | "foto" = esPortada ? "cover" : "foto";
  const res = await subirImagen(uuid, subfolder, archivo, opciones?.onProgress);
  try {
    await registrarImagen(uuid, {
      nombre: res.nombre,
      ext: res.ext,
      tamano: res.tamano,
      es_portada: esPortada,
    });
  } catch (err) {
    await eliminarImagenFisica(uuid, subfolder, res.nombre).catch(() => undefined);
    throw err;
  }
  return res;
}

export default http;

// ── Métodos genéricos para consumo directo ──────────────────────────────

export const api = {
  async get(url: string, config?: any) {
    const { data } = await http.get(url, config);
    return data;
  },

  async post(url: string, payload?: any, config?: any) {
    const { data } = await http.post(url, payload, config);
    return data;
  },

  async put(url: string, payload?: any, config?: any) {
    const { data } = await http.put(url, payload, config);
    return data;
  },

  async delete(url: string, config?: any) {
    const { data } = await http.delete(url, config);
    return data;
  },
};
