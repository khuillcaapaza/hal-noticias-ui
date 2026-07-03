import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePostEditor } from "@/hooks/usePostEditor";
import type { Post, PostInput } from "@/lib/types";

const mockPost: Post = {
  uuid: "test-uuid",
  slug: "test-post",
  title: "Test Post",
  excerpt: "Test excerpt",
  category: "General",
  date: "2026-01-01",
  author: "Test Author",
  coverColor: "from-blue-100 to-blue-200",
  cuerpo: "<p>Test content</p>",
  publicado: true,
  cover: null,
  imagenes: [],
};

describe("usePostEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debería inicializar con un formulario vacío para nuevo post", () => {
    const { result } = renderHook(() =>
      usePostEditor({ uuid: "", onFetchPost: vi.fn(), onUpdatePost: vi.fn() })
    );

    expect(result.current.esNuevo).toBe(true);
    expect(result.current.form.titulo).toBe("");
    expect(result.current.form.publicado).toBe(true);
  });

  it("debería cargar un post existente", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockPost);
    const { result } = renderHook(() =>
      usePostEditor({
        uuid: "test-uuid",
        onFetchPost: mockFetch,
        onUpdatePost: vi.fn(),
      })
    );

    expect(result.current.cargando).toBe(true);

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith("test-uuid");
    expect(result.current.form.titulo).toBe("Test Post");
    expect(result.current.form.excerpt).toBe("Test excerpt");
    expect(result.current.post).toEqual(mockPost);
  });

  it("debería marcar hayChanges cuando se edita un campo", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockPost);
    const { result } = renderHook(() =>
      usePostEditor({
        uuid: "test-uuid",
        onFetchPost: mockFetch,
        onUpdatePost: vi.fn(),
      })
    );

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    act(() => {
      result.current.set("titulo", "Nuevo título");
    });

    expect(result.current.hayChanges).toBe(true);
  });

  it("debería autoguardar después del debounce", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockPost);
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePostEditor({
        uuid: "test-uuid",
        onFetchPost: mockFetch,
        onUpdatePost: mockUpdate,
      })
    );

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    act(() => {
      result.current.set("titulo", "Nuevo título");
    });

    expect(result.current.autoEstado).toBe("pendiente");

    act(() => {
      vi.runAllTimers();
    });

    await vi.waitFor(() => {
      expect(result.current.autoEstado).toBe("guardado");
      expect(mockUpdate).toHaveBeenCalledWith("test-uuid", expect.objectContaining({
        titulo: "Nuevo título",
      }));
    });
  });

  it("debería guardar inmediatamente con guardarAhora", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockPost);
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePostEditor({
        uuid: "test-uuid",
        onFetchPost: mockFetch,
        onUpdatePost: mockUpdate,
      })
    );

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    act(() => {
      result.current.set("titulo", "Cambio rápido");
    });

    act(() => {
      result.current.guardarAhora();
    });

    await vi.waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith("test-uuid", expect.objectContaining({
        titulo: "Cambio rápido",
      }));
      expect(result.current.hayChanges).toBe(false);
    });
  });

  it("debería validar antes de autoguardar", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockPost);
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePostEditor({
        uuid: "test-uuid",
        onFetchPost: mockFetch,
        onUpdatePost: mockUpdate,
      })
    );

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    act(() => {
      result.current.set("titulo", "");
      result.current.set("fecha_publicacion", "");
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(result.current.autoEstado).toBe("idle");
  });

  it("debería manejar errores de carga", async () => {
    const errorMsg = "Error cargando post";
    const mockFetch = vi.fn().mockRejectedValue(new Error(errorMsg));
    const { result } = renderHook(() =>
      usePostEditor({
        uuid: "test-uuid",
        onFetchPost: mockFetch,
        onUpdatePost: vi.fn(),
      })
    );

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.mensaje).toBe(errorMsg);
  });

  it("debería permitir setForm completo", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockPost);
    const { result } = renderHook(() =>
      usePostEditor({
        uuid: "test-uuid",
        onFetchPost: mockFetch,
        onUpdatePost: vi.fn(),
      })
    );

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    const nuevoForm: PostInput = {
      titulo: "Nuevo",
      excerpt: "Nuevo excerpt",
      categoria: "Salud",
      fecha_publicacion: "2026-02-02",
      autor: "Nuevo autor",
      cover_color: "from-rose-100 to-rose-200",
      cuerpo: "<p>Nuevo contenido</p>",
      publicado: false,
    };

    act(() => {
      result.current.setForm(nuevoForm);
    });

    expect(result.current.form).toEqual(nuevoForm);
  });

  it("debería resetear autosave después de cargar", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockPost);
    const { result } = renderHook(() =>
      usePostEditor({
        uuid: "test-uuid",
        onFetchPost: mockFetch,
        onUpdatePost: vi.fn(),
      })
    );

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.hayChanges).toBe(false);
  });
});
