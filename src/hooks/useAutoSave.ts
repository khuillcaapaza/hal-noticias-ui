import { useCallback, useEffect, useRef, useState } from "react";

type AutoEstado = "idle" | "pendiente" | "guardando" | "guardado" | "error";

interface UseAutoSaveOptions {
  debounceMs?: number;
  onSave?: (data: any) => Promise<void>;
  isValid?: () => boolean;
}

/**
 * Hook para manejar autoguardado con debounce.
 * Detecta cambios y guarda automáticamente después del tiempo de debounce.
 */
export function useAutoSave({
  debounceMs = 900,
  onSave,
  isValid,
}: UseAutoSaveOptions) {
  const [autoEstado, setAutoEstado] = useState<AutoEstado>("idle");
  const [hayChanges, setHayChanges] = useState(false);
  const saltarAutosave = useRef(true);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const registrarCambio = useCallback(() => {
    setHayChanges(true);
  }, []);

  const guardarAhora = useCallback(
    async (data: any) => {
      if (!onSave) return;
      if (isValid && !isValid()) {
        setAutoEstado("idle");
        return;
      }

      setAutoEstado("guardando");
      setError(null);
      try {
        await onSave(data);
        setHayChanges(false);
        setAutoEstado("guardado");
      } catch (err) {
        setAutoEstado("error");
        setError((err as Error).message);
      }
    },
    [onSave, isValid]
  );

  const iniciarAutosave = useCallback(
    (data: any) => {
      if (!onSave) return;
      
      // Ignora la primera actualización tras cargar desde la API.
      if (saltarAutosave.current) {
        saltarAutosave.current = false;
        return;
      }

      // No autoguardar con datos inválidos
      if (isValid && !isValid()) {
        setAutoEstado("idle");
        return;
      }

      // Cancela cualquier timeout anterior
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }

      setAutoEstado("pendiente");
      timeoutId.current = setTimeout(() => {
        guardarAhora(data);
        timeoutId.current = null;
      }, debounceMs);

      return () => {
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
          timeoutId.current = null;
        }
      };
    },
    [onSave, isValid, debounceMs, guardarAhora]
  );

  const resetearAutosave = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    saltarAutosave.current = true;
    setAutoEstado("idle");
    setHayChanges(false);
    setError(null);
  }, []);

  return {
    autoEstado,
    hayChanges,
    error,
    registrarCambio,
    guardarAhora,
    iniciarAutosave,
    resetearAutosave,
    saltarAutosave,
  };
}
