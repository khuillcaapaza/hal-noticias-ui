import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "@/hooks/useAutoSave";

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debería inicializar con estado idle y sin cambios", () => {
    const { result } = renderHook(() => useAutoSave({}));

    expect(result.current.autoEstado).toBe("idle");
    expect(result.current.hayChanges).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("debería marcar cambios después de registrarCambio", () => {
    const { result } = renderHook(() => useAutoSave({}));

    act(() => {
      result.current.saltarAutosave.current = false;
      result.current.registrarCambio();
    });

    expect(result.current.hayChanges).toBe(true);
  });

  it("debería guardar datos después del debounce", async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({
        debounceMs: 100,
        onSave: mockSave,
        isValid: () => true,
      })
    );

    act(() => {
      result.current.saltarAutosave.current = false;
      result.current.iniciarAutosave({ titulo: "Test" });
    });

    expect(result.current.autoEstado).toBe("pendiente");

    act(() => {
      vi.runAllTimers();
    });

    await vi.waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith({ titulo: "Test" });
    });
  });

  it("debería cambiar estado a guardado después de guardar exitosamente", async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({
        debounceMs: 100,
        onSave: mockSave,
        isValid: () => true,
      })
    );

    act(() => {
      result.current.saltarAutosave.current = false;
      result.current.iniciarAutosave({ titulo: "Test" });
    });

    act(() => {
      vi.runAllTimers();
    });

    await vi.waitFor(() => {
      expect(result.current.autoEstado).toBe("guardado");
      expect(result.current.hayChanges).toBe(false);
    });
  });

  it("debería manejar errores de guardado", async () => {
    const errorMsg = "Error al guardar";
    const mockSave = vi.fn().mockRejectedValue(new Error(errorMsg));
    const { result } = renderHook(() =>
      useAutoSave({
        debounceMs: 100,
        onSave: mockSave,
        isValid: () => true,
      })
    );

    act(() => {
      result.current.saltarAutosave.current = false;
      result.current.iniciarAutosave({ titulo: "Test" });
    });

    act(() => {
      vi.runAllTimers();
    });

    await vi.waitFor(() => {
      expect(result.current.autoEstado).toBe("error");
      expect(result.current.error).toBe(errorMsg);
    });
  });

  it("debería respetar isValid", () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({
        debounceMs: 100,
        onSave: mockSave,
        isValid: () => false,
      })
    );

    act(() => {
      result.current.saltarAutosave.current = false;
      result.current.iniciarAutosave({ titulo: "" });
    });

    expect(result.current.autoEstado).toBe("idle");
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("debería resetear el estado con resetearAutosave", () => {
    const { result } = renderHook(() => useAutoSave({}));

    act(() => {
      result.current.registrarCambio();
      result.current.resetearAutosave();
    });

    expect(result.current.autoEstado).toBe("idle");
    expect(result.current.hayChanges).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.saltarAutosave.current).toBe(true);
  });

  it("debería guardar inmediatamente con guardarAhora", async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({
        onSave: mockSave,
        isValid: () => true,
      })
    );

    act(() => {
      result.current.guardarAhora({ titulo: "Test Ahora" });
    });

    act(() => {
      vi.runAllTimers();
    });

    await vi.waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith({ titulo: "Test Ahora" });
      expect(result.current.autoEstado).toBe("guardado");
    });
  });

  it("debería cancelar el debounce si se resetea el autosave", () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({
        debounceMs: 100,
        onSave: mockSave,
      })
    );

    act(() => {
      result.current.saltarAutosave.current = false;
      result.current.iniciarAutosave({ titulo: "Test" });
    });

    act(() => {
      vi.advanceTimersByTime(50);
      result.current.resetearAutosave();
      vi.advanceTimersByTime(100);
    });

    expect(mockSave).not.toHaveBeenCalled();
  });
});
