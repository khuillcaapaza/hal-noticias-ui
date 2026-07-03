"use client";

import { useState } from "react";
import ModalConfirmar, {
  type ConfirmacionState,
} from "@/components/ModalConfirmar";
import { eliminarImagen, subirYRegistrarImagen } from "@/lib/api";
import type { Mensaje, Post } from "@/lib/types";

function formatearBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}

export default function GestorPortada({
  post,
  onCambio,
}: {
  post: Post;
  onCambio: () => Promise<void> | void;
}) {
  const slug = post.slug;
  const uuid = post.uuid;
  const portada = post.imagenes.find((i) => i.isCover) ?? null;
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [mensaje, setMensaje] = useState<Mensaje>(null);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionState | null>(null);

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    setProgreso(0);
    setMensaje(null);
    try {
      await subirYRegistrarImagen(slug, uuid, file, {
        esPortada: true,
        onProgress: (p) => setProgreso(p),
      });
      setMensaje({ texto: "Portada actualizada.", tipo: "ok" });
      await onCambio();
    } catch (err) {
      setMensaje({ texto: (err as Error).message, tipo: "error" });
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  }

  function quitar() {
    if (!portada) return;
    setConfirmacion({
      titulo: "Quitar portada",
      mensaje: "¿Eliminar la imagen de portada de esta noticia?",
      etiquetaConfirmar: "Quitar",
      onConfirmar: async () => {
        try {
          await eliminarImagen(uuid, portada.id);
          setMensaje({ texto: "Portada eliminada.", tipo: "ok" });
          await onCambio();
        } catch (err) {
          setMensaje({ texto: (err as Error).message, tipo: "error" });
        }
      },
    });
  }

  return (
    <div className="panel-card" style={{ marginTop: "1rem" }}>
      <div className="seccion-head">
        <div>
          <h3>Imagen de portada</h3>
          <p className="seccion-sub">
            Se muestra en las tarjetas y la cabecera de la noticia (JPG, PNG, WEBP o GIF).
          </p>
        </div>
      </div>

      {mensaje && (
        <p className={"aviso" + (mensaje.tipo === "error" ? " aviso--error" : "")}>
          {mensaje.texto}
        </p>
      )}

      {portada ? (
        <div className="portada-actual">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="portada-actual__img" src={portada.url} alt="Portada" />
          <div className="portada-actual__meta">
            <span>{portada.name}</span>
            <span className="seccion-sub">{formatearBytes(portada.size)}</span>
            <button
              type="button"
              className="boton boton--peligro boton--sm"
              onClick={quitar}
            >
              Quitar portada
            </button>
          </div>
        </div>
      ) : (
        <p className="seccion-sub">Esta noticia aún no tiene portada.</p>
      )}

      <label className="campo" style={{ marginTop: "0.8rem" }}>
        <span>{portada ? "Reemplazar portada" : "Subir portada"}</span>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif"
          disabled={subiendo}
          onChange={subir}
        />
      </label>

      {subiendo && (
        <div className="subida-progreso">
          <div className="subida-progreso__cab">
            <span>Subiendo…</span>
            <span>{progreso}%</span>
          </div>
          <div className="barra-progreso">
            <div
              className={
                "barra-progreso__relleno" +
                (progreso >= 100 ? " barra-progreso__relleno--indeterminado" : "")
              }
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      <ModalConfirmar
        estado={confirmacion}
        onCerrar={() => setConfirmacion(null)}
      />
    </div>
  );
}
