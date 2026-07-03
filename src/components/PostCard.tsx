"use client";

import type { PostMeta } from "@/lib/types";

interface Props {
  post: PostMeta;
  onEditar?: (uuid: string) => void;
  onBorrar?: (uuid: string, titulo: string) => void;
  /** Modo solo lectura para vista previa: oculta los botones de acción. */
  preview?: boolean;
}

export default function PostCard({
  post,
  onEditar,
  onBorrar,
  preview = false,
}: Props) {
  return (
    <article className="cron-card">
      {post.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="post-card__cover" src={post.cover} alt="" />
      ) : (
        <div
          className="post-card__cover post-card__cover--placeholder"
          aria-hidden="true"
        />
      )}
      <div className="cron-card__top">
        <span className="cron-card__mes">{post.date}</span>
        <span className="chip chip--ok">{post.category}</span>
      </div>
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <div className="cron-card__top" style={{ marginBottom: "0.6rem" }}>
        <span className="dia-pill">{post.author}</span>
        {!post.publicado && <span className="chip chip--off">Oculta</span>}
      </div>
      {!preview && (
        <div className="cron-card__acciones">
          <button
            type="button"
            className="boton boton--ghost boton--sm"
            onClick={() => onEditar?.(post.uuid)}
          >
            Editar
          </button>
          <button
            type="button"
            className="boton boton--peligro boton--sm"
            onClick={() => onBorrar?.(post.uuid, post.title)}
          >
            Eliminar
          </button>
        </div>
      )}
    </article>
  );
}
