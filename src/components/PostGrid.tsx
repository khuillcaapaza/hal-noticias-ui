import PostCard from "@/components/PostCard";
import { type PostMeta } from "@/lib/types";

interface PostGridProps {
  items: PostMeta[];
  onEdit: (uuid: string) => void;
  onDelete: (uuid: string, title: string) => void;
  isLoading?: boolean;
  isEmpty?: boolean;
}

export default function PostGrid({
  items,
  onEdit,
  onDelete,
  isLoading = false,
  isEmpty = false,
}: PostGridProps) {
  if (isLoading) {
    return <p className="cargando" data-testid="loading-state">Cargando…</p>;
  }

  if (isEmpty) {
    return (
      <p className="cargando" data-testid="empty-state">
        No se encontraron noticias con esos criterios.
      </p>
    );
  }

  return (
    <div className="grid-cronogramas" data-testid="post-grid">
      {items.map((post) => (
        <PostCard
          key={post.uuid}
          post={post}
          onEditar={onEdit}
          onBorrar={onDelete}
        />
      ))}
    </div>
  );
}
