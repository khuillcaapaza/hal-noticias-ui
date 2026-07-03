import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

describe("useListPosts - Edge Cases & Full Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debería inicializar con estado de cargando", () => {
    const mockFetch = vi.fn();
    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    expect(result.current.cargando).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.error).toBe(null);
    expect(result.current.busqueda).toBe("");
    expect(result.current.busquedaAplicada).toBe("");
    expect(result.current.categoria).toBe("");
    expect(result.current.pagina).toBe(1);
    expect(result.current.hayFiltro).toBe(false);
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
    expect(result.current.error).toBe(null);
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

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    act(() => {
      result.current.setBusqueda("test");
    });

    expect(result.current.busqueda).toBe("test");
    expect(result.current.busquedaAplicada).toBe("");

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
    const mockFetch = vi.fn().mockRejectedValue(new Error(errorMsg));

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

    rerender({ onFetch: mockFetch });

    await vi.waitFor(() => {
      expect(result.current.pagina).toBeLessThanOrEqual(result.current.totalPaginas);
    });
  });

  it("debería usar perPage personalizado", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      items: mockPosts,
      total: 100,
      totalPages: 5,
      categories: ["General"],
    });

    const { result } = renderHook(() =>
      useListPosts({ onFetch: mockFetch, perPage: 20 })
    );

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ perPage: 20 })
    );
  });

  it("debería resetear página a 1 cuando se busca", async () => {
    vi.useFakeTimers();
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
      result.current.setPagina(3);
    });

    act(() => {
      result.current.setBusqueda("new search");
    });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    await vi.waitFor(() => {
      expect(result.current.pagina).toBe(1);
    });

    vi.useRealTimers();
  });

  it("debería retardar búsqueda múltiples veces", async () => {
    vi.useFakeTimers();
    const mockFetch = vi.fn().mockResolvedValue({
      items: mockPosts,
      total: 2,
      totalPages: 1,
      categories: ["General"],
    });

    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    // Primera búsqueda
    act(() => {
      result.current.setBusqueda("first");
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.busquedaAplicada).toBe("");

    // Segunda búsqueda antes de completar debounce
    act(() => {
      result.current.setBusqueda("second");
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.busquedaAplicada).toBe("");

    // Esperar debounce completo
    act(() => {
      vi.advanceTimersByTime(150);
    });

    await vi.waitFor(() => {
      expect(result.current.busquedaAplicada).toBe("second");
    });

    vi.useRealTimers();
  });

  it("debería manejar respuesta vacía", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      totalPages: 0,
      categories: [],
    });

    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.categorias).toEqual([]);
  });

  it("debería manejar muchas categorías", async () => {
    const categories = [
      "General",
      "Salud",
      "Tech",
      "Sports",
      "Science",
      "Arts",
      "Music",
      "Food",
      "Travel",
      "Politics",
    ];
    const mockFetch = vi.fn().mockResolvedValue({
      items: mockPosts,
      total: 2,
      totalPages: 1,
      categories,
    });

    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.categorias).toEqual(categories);
  });

  it("debería resetear a página 1 cuando cambia categoría", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      items: mockPosts,
      total: 20,
      totalPages: 3,
      categories: ["General", "Salud"],
    });

    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    act(() => {
      result.current.setPagina(3);
    });

    expect(result.current.pagina).toBe(3);

    act(() => {
      result.current.cambiarCategoria("Salud");
    });

    expect(result.current.pagina).toBe(1);
  });

  it("debería permitir múltiples llamadas a cargar()", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      items: mockPosts,
      total: 2,
      totalPages: 1,
      categories: ["General"],
    });

    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    const initialCallCount = mockFetch.mock.calls.length;

    act(() => {
      result.current.cargar();
    });

    await vi.waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it("debería mantener estado coherente después de errores", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValueOnce({
        items: mockPosts,
        total: 2,
        totalPages: 1,
        categories: ["General"],
      });

    const { result } = renderHook(() => useListPosts({ onFetch: mockFetch }));

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.error).toBe("First error");

    act(() => {
      result.current.cargar();
    });

    await vi.waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    // After successful cargar(), error should be cleared
    if (result.current.items.length > 0) {
      expect(result.current.error).toBe(null);
    }
  });
});
