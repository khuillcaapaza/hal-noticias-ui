// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePostEditor } from "@/hooks/usePostEditor";
import type { Post } from "@/lib/types";

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

describe("Toggle Publicar (publicado field)", () => {
  describe("Toggle functionality independent from autoguardado", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("debería iniciar con publicado=true", async () => {
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

      expect(result.current.form.publicado).toBe(true);
    });

    it("debería cambiar publicado a false cuando se desactiva el toggle", async () => {
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
        result.current.set("publicado", false);
      });

      expect(result.current.form.publicado).toBe(false);
    });

    it("debería guardar el cambio de publicado inmediatamente sin esperar autoguardado", async () => {
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
        result.current.set("publicado", false);
      });

      act(() => {
        result.current.guardarAhora();
      });

      expect(result.current.autoEstado).toBe("guardando");
      expect(result.current.form.publicado).toBe(false);
    });

    it("debería permitir cambiar publicado sin afectar otros cambios sin guardar", async () => {
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

      // Hacer un cambio en el título (sin guardar)
      act(() => {
        result.current.set("titulo", "Nuevo Título");
      });

      // Cambiar publicado (debería guardarse inmediatamente)
      act(() => {
        result.current.set("publicado", false);
        result.current.guardarAhora();
      });

      // El título sigue sin guardar (pendiente)
      expect(result.current.form.titulo).toBe("Nuevo Título");
      expect(result.current.form.publicado).toBe(false);
    });

    it("debería poder cambiar publicado a true nuevamente", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ...mockPost,
        publicado: false,
      });
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

      expect(result.current.form.publicado).toBe(false);

      act(() => {
        result.current.set("publicado", true);
      });

      expect(result.current.form.publicado).toBe(true);
    });

    it("debería mantener publicado estado correcto después de autoguardado", async () => {
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

      // Cambiar publicado
      act(() => {
        result.current.set("publicado", false);
      });

      // Guardar inmediatamente
      act(() => {
        result.current.guardarAhora();
      });

      // Esperar a que se guarde
      act(() => {
        vi.runAllTimers();
      });

      await vi.waitFor(() => {
        expect(result.current.autoEstado).toBe("guardado");
      });

      // Publicado sigue siendo false
      expect(result.current.form.publicado).toBe(false);
    });
  });
});
