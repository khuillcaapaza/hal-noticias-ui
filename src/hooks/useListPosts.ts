import { useCallback, useEffect, useRef, useState } from "react";
import { type PostMeta } from "@/lib/types";

interface UseListPostsOptions {
  onFetch: (params: {
    q: string;
    category: string;
    page: number;
    perPage: number;
  }) => Promise<{
    items: PostMeta[];
    total: number;
    totalPages: number;
    categories: string[];
  }>;
  perPage?: number;
}

/**
 * Hook para manejar la lógica de lista de posts con búsqueda, filtrado y paginación.
 * Incluye debounce automático en la búsqueda.
 */
export function useListPosts({
  onFetch,
  perPage = 9,
}: UseListPostsOptions) {
  const [items, setItems] = useState<PostMeta[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [categoria, setCategoria] = useState("");
  const [pagina, setPagina] = useState(1);

  // Debounce de búsqueda: aplica 350ms después de dejar de escribir
  useEffect(() => {
    const t = setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await onFetch({
        q: busquedaAplicada,
        category: categoria,
        page: pagina,
        perPage,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPaginas(res.totalPages);
      setCategorias(res.categories);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }, [busquedaAplicada, categoria, pagina, perPage, onFetch]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Ajustar página si quedan menos resultados que los de la página actual
  useEffect(() => {
    if (pagina > totalPaginas && totalPaginas > 0) {
      setPagina(totalPaginas);
    }
  }, [totalPaginas, pagina]);

  const hayFiltro = busquedaAplicada !== "" || categoria !== "";

  function cambiarCategoria(valor: string) {
    setCategoria(valor);
    setPagina(1);
  }

  return {
    // Estado de datos
    items,
    total,
    totalPaginas,
    cargando,
    error,
    categorias,

    // Estado de filtros
    busqueda,
    busquedaAplicada,
    categoria,
    pagina,
    hayFiltro,

    // Acciones
    setBusqueda,
    cambiarCategoria,
    setPagina,
    cargar,
  };
}
