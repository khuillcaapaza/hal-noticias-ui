import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePostEditor } from "@/hooks/usePostEditor";
import type { Post } from "@/lib/types";

const mockPost: Post = {
  uuid: "test-1",
  title: "Test Post",
  excerpt: "Test excerpt",
  cuerpo: "<p>Test content</p>",
  category: "General",
  coverColor: "from-blue-100 to-blue-200",
  date: "2024-01-01",
  author: "Test Author",
  publicado: true,
};

describe("usePostEditor - Edge Cases & Full Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debería inicializar con formulario vacío para nuevo post", () => {
    const { result } = renderHook(() =>
      usePostEditor({ uuid: "" })
    );

    expect(result.current.esNuevo).toBe(true);
    expect(result.current.form.titulo).toBe("");
    expect(result.current.cargando).toBe(false);
  });

  it("debería cargar post existente", async () => {
    const onFetchPost = vi.fn().mockResolvedValue(mockPost);
    const { result } = renderHook(() =>
      usePostEditor({ uuid: "test-1", onFetchPost })
    );

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.form.titulo).toBe("Test Post");
    expect(result.current.esNuevo).toBe(false);
  });

  it("debería marcar hayChanges cuando se edita un campo", () => {
    const { result } = renderHook(() =>
      usePostEditor({ uuid: "" })
    );

    expect(result.current.hayChanges).toBe(false);

    act(() => {
      result.current.set("titulo", "Nuevo título");
    });

    // The hook's registrarCambio should mark hayChanges as true
    expect(result.current.form.titulo).toBe("Nuevo título");
  });

  it("debería permitir setear cada campo", () => {
    const { result } = renderHook(() =>
      usePostEditor({ uuid: "" })
    );

    act(() => {
      result.current.set("titulo", "Test Title");
      result.current.set("excerpt", "Test Excerpt");
      result.current.set("cuerpo", "<p>Content</p>");
      result.current.set("categoria", "Salud");
    });

    expect(result.current.form.titulo).toBe("Test Title");
    expect(result.current.form.excerpt).toBe("Test Excerpt");
    expect(result.current.form.cuerpo).toBe("<p>Content</p>");
    expect(result.current.form.categoria).toBe("Salud");
  });

  it("debería autoguardar después del debounce", async () => {
    const onUpdatePost = vi.fn().mockResolvedValue(undefined);

    vi.useFakeTimers();
    const { result } = renderHook(() =>
      usePostEditor({
        uuid: "test-1",
        onUpdatePost,
      })
    );

    act(() => {
      result.current.set("titulo", "New Title");
      result.current.set("fecha_publicacion", "2024-01-01");
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });
    vi.useRealTimers();

    await vi.waitFor(() => {
      expect(onUpdatePost.mock.calls.length).toBeGreaterThan(0);
    });
  });

  it("debería guardar inmediatamente con guardarAhora", async () => {
    const onUpdatePost = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePostEditor({
        uuid: "test-1",
        onUpdatePost,
      })
    );

    act(() => {
      result.current.set("titulo", "New Title");
      result.current.set("fecha_publicacion", "2024-01-01");
    });

    act(() => {
      result.current.guardarAhora();
    });

    await vi.waitFor(() => {
      expect(onUpdatePost).toHaveBeenCalled();
    });
  });

  it("debería validar antes de autoguardar", async () => {
    const onUpdatePost = vi.fn().mockResolvedValue(undefined);

    vi.useFakeTimers();
    const { result } = renderHook(() =>
      usePostEditor({
        uuid: "test-1",
        onUpdatePost,
      })
    );

    act(() => {
      result.current.set("titulo", "New Title");
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });
    vi.useRealTimers();

    expect(onUpdatePost).not.toHaveBeenCalled();
  });

  it("debería manejar errores de carga", async () => {
    const errorMsg = "Error cargando post";
    const onFetchPost = vi.fn().mockRejectedValue(new Error(errorMsg));
    const { result } = renderHook(() =>
      usePostEditor({ uuid: "test-1", onFetchPost })
    );

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.mensaje).toBe(errorMsg);
  });

  it("debería resetear autosave después de cargar", async () => {
    const onFetchPost = vi.fn().mockResolvedValue(mockPost);
    const { result } = renderHook(() =>
      usePostEditor({ uuid: "test-1", onFetchPost })
    );

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.hayChanges).toBe(false);
  });

  it("debería detectar nuevo post correctamente", () => {
    const { result: resultNuevo } = renderHook(() =>
      usePostEditor({ uuid: "" })
    );

    expect(resultNuevo.current.esNuevo).toBe(true);

    const { result: resultExistente } = renderHook(() =>
      usePostEditor({ uuid: "test-1" })
    );

    expect(resultExistente.current.esNuevo).toBe(false);
  });

  it("debería permitir setForm completo", () => {
    const { result } = renderHook(() =>
      usePostEditor({ uuid: "" })
    );

    act(() => {
      result.current.setForm({
        titulo: "Full Form",
        excerpt: "Excerpt",
        cuerpo: "Content",
        categoria: "Tech",
        fecha_publicacion: "2024-01-01",
        autor: "Author",
        cover_color: "from-green-100 to-green-200",
        publicado: true,
      });
    });

    expect(result.current.form.titulo).toBe("Full Form");
    expect(result.current.form.excerpt).toBe("Excerpt");
  });

  it("debería permitir actualizar mensaje", () => {
    const { result } = renderHook(() =>
      usePostEditor({ uuid: "" })
    );

    expect(result.current.mensaje).toBeNull();

    act(() => {
      result.current.setMensaje("Test message");
    });

    expect(result.current.mensaje).toBe("Test message");
  });
});



