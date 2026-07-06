"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import DOMPurify from "dompurify";
import { fetchPost } from "@/lib/api";
import {
  PREVIEW_STORAGE_PREFIX,
  type PostPreviewData,
} from "@/lib/types";

const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// Gradientes equivalentes a los tokens Tailwind de cover_color.
const GRADIENTES: Record<string, [string, string]> = {
  "from-green-100 to-green-200": ["#dcfce7", "#bbf7d0"],
  "from-blue-100 to-blue-200": ["#dbeafe", "#bfdbfe"],
  "from-rose-100 to-rose-200": ["#ffe4e6", "#fecdd3"],
  "from-amber-100 to-amber-200": ["#fef3c7", "#fde68a"],
  "from-purple-100 to-purple-200": ["#f3e8ff", "#e9d5ff"],
};

function fechaLarga(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  const fecha = new Date(anio, mes - 1, dia);
  if (Number.isNaN(fecha.getTime())) return iso;
  return `${DIAS[fecha.getDay()]} ${dia} de ${MESES[mes - 1]} del ${anio}`;
}

function gradiente(coverColor: string): string {
  const par = GRADIENTES[coverColor] ?? ["#e0f2fe", "#dbeafe"];
  return `linear-gradient(135deg, ${par[0]} 0%, ${par[1]} 100%)`;
}

function VistaPrevia() {
  const searchParams = useSearchParams();
  const uuid = searchParams.get("uuid") ?? searchParams.get("slug") ?? "";

  const [datos, setDatos] = useState<PostPreviewData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) {
      setError("No se indicó la noticia a previsualizar.");
      setCargando(false);
      return;
    }

    // 1) Datos en vivo escritos por el editor (refleja cambios sin guardar).
    const clave = PREVIEW_STORAGE_PREFIX + uuid;
    const guardado = window.localStorage.getItem(clave);
    if (guardado) {
      window.localStorage.removeItem(clave);
      try {
        setDatos(JSON.parse(guardado) as PostPreviewData);
        setCargando(false);
        return;
      } catch {
        // Si el JSON está corrupto, caemos al fetch de la API.
      }
    }

    // 2) Fallback: cargar la versión guardada desde la API (requiere sesión).
    (async () => {
      try {
        const p = await fetchPost(uuid);
        setDatos({
          title: p.title,
          excerpt: p.excerpt,
          category: p.category,
          date: p.date,
          author: p.author,
          coverColor: p.coverColor,
          cover: p.cover,
          cuerpo: p.cuerpo ?? "",
          publicado: p.publicado,
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setCargando(false);
      }
    })();
  }, [uuid]);

  const cuerpoSeguro = useMemo(
    () => (datos ? DOMPurify.sanitize(datos.cuerpo) : ""),
    [datos]
  );

  if (cargando) {
    return (
      <div className="preview-estado">
        <p>Cargando vista previa…</p>
      </div>
    );
  }

  if (error || !datos) {
    return (
      <div className="preview-estado">
        <h1>No se pudo mostrar la vista previa</h1>
        <p>{error ?? "Noticia no encontrada."}</p>
        <p className="preview-estado__pista">
          Abre la vista previa desde el panel con la sesión iniciada.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="preview-aviso">
        <span className="preview-aviso__texto">
          Vista previa
          {!datos.publicado && (
            <span className="preview-aviso__chip">Borrador · no publicada</span>
          )}
        </span>
        <button
          type="button"
          className="preview-aviso__cerrar"
          onClick={() => window.close()}
        >
          Cerrar
        </button>
      </div>

      {/* Banner full-width fuera del contenedor del artículo, igual que hal-site */}
      <section
        className={`preview-header${datos.cover ? " preview-header--foto" : ""}`}
        style={datos.cover ? undefined : { background: gradiente(datos.coverColor) }}
      >
        {datos.cover && (
          <div
            className="preview-header-bg"
            style={{ backgroundImage: `url(${datos.cover})` }}
          />
        )}
        {datos.cover && <div className="preview-header-overlay" />}
        <div className="preview-header-content">
          <div className="preview-meta">
            <span className="preview-categoria">{datos.category}</span>
            <span className={`preview-fecha${datos.cover ? " preview-fecha--foto" : ""}`}>{fechaLarga(datos.date)}</span>
          </div>
          <h1 className={`preview-titulo${datos.cover ? " preview-titulo--foto" : ""}`}>{datos.title || "(Sin título)"}</h1>
          {datos.author && <p className={`preview-autor${datos.cover ? " preview-autor--foto" : ""}`}>Por {datos.author}</p>}
        </div>
      </section>

      <article className="preview-articulo">
        {datos.excerpt && <p className="preview-lead">{datos.excerpt}</p>}

        <div className="preview-body-wrap">
          {cuerpoSeguro ? (
            <div
              className="preview-body prose-article"
              dangerouslySetInnerHTML={{ __html: cuerpoSeguro }}
            />
          ) : (
            <p className="preview-body preview-body--vacio">
              Esta noticia aún no tiene contenido.
            </p>
          )}
        </div>
      </article>
    </>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="preview-estado">
          <p>Cargando vista previa…</p>
        </div>
      }
    >
      <VistaPrevia />
    </Suspense>
  );
}
