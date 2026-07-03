import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useListPosts } from "@/hooks/useListPosts";
import type { PostMeta } from "@/lib/types";

const mockPosts: PostMeta[] = [
  {
    uuid: "post-1",
    slug: "post-1",
    title: "Post 1",
    excerpt: "Excerpt 1",
    category: "General",
    date: "2026-01-01",
    author: "Author 1",
    coverColor: "from-blue-100 to-blue-200",
    cover: null,
    publicado: true,
  },
  {
    uuid: "post-2",
    slug: "post-2",
    title: "Post 2",
    excerpt: "Excerpt 2",
    category: "Salud",
    date: "2026-01-02",
    author: "Author 2",
    coverColor: "from-green-100 to-green-200",
    cover: null,
    publicado: true,
  },
];

describe("useListPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debería inicializar con estado de cargando", () => {
    const mockFetch = vi.fn();
    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    expect(result.current.cargando).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("debería cargar posts exitosamente", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      items: mockPosts,
      total: 2,
      totalPages: 1,
      categories: ["General", "Salud"],
    });

    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.items).toEqual(mockPosts);
    expect(result.current.total).toBe(2);
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.categorias).toEqual(["General", "Salud"]);
  });

  it("debería actualizar busqueda y recargar después del debounce", async () => {
    vi.useFakeTimers();
    const mockFetch = vi.fn().mockResolvedValue({
      items: mockPosts,
      total: 2,
      totalPages: 1,
      categories: ["General"],
    });

    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    // Primera carga
    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    act(() => {
      result.current.setBusqueda("test");
    });

    // El debounce espera 350ms
    act(() => {
      vi.advanceTimersByTime(350);
    });

    await vi.waitFor(() => {
      expect(result.current.busquedaAplicada).toBe("test");
    });

    vi.useRealTimers();
  });

  it("debería manejar cambios de categoría", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      items: mockPosts,
      total: 2,
      totalPages: 1,
      categories: ["General", "Salud"],
    });

    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    act(() => {
      result.current.cambiarCategoria("Salud");
    });

    expect(result.current.categoria).toBe("Salud");
    expect(result.current.pagina).toBe(1);
  });

  it("debería cambiar página", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      items: mockPosts,
      total: 20,
      totalPages: 3,
      categories: ["General"],
    });

    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    act(() => {
      result.current.setPagina(2);
    });

    expect(result.current.pagina).toBe(2);
  });

  it("debería detectar si hay filtro activo", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      totalPages: 1,
      categories: ["General"],
    });

    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    expect(result.current.hayFiltro).toBe(false);

    act(() => {
      result.current.setBusqueda("test");
    });

    // Esperar a debounce
    vi.useFakeTimers();
    act(() => {
      vi.advanceTimersByTime(350);
    });
    vi.useRealTimers();

    await vi.waitFor(() => {
      expect(result.current.hayFiltro).toBe(true);
    });
  });

  it("debería manejar errores de carga", async () => {
    const errorMsg = "Error cargando posts";
    const mockFetch = vi
      .fn()
      .mockRejectedValue(new Error(errorMsg));

    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.error).toBe(errorMsg);
  });

  it("debería ajustar página si totalPaginas disminuye", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        items: mockPosts,
        total: 20,
        totalPages: 3,
        categories: ["General"],
      })
      .mockResolvedValueOnce({
        items: mockPosts,
        total: 5,
        totalPages: 1,
        categories: ["General"],
      });

    const { result, rerender } = renderHook(
      ({ onFetch }) => useListPosts({ onFetch }),
      { initialProps: { onFetch: mockFetch } }
    );

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    act(() => {
      result.current.setPagina(3);
    });

    // Simular cambio en resultados
    rerender({ onFetch: mockFetch });

    await vi.waitFor(() => {
      expect(result.current.pagina).toBeLessThanOrEqual(result.current.totalPaginas);
    });
  });
});
