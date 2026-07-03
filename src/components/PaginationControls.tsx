interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="paginacion" data-testid="pagination-controls">
      <button
        type="button"
        className="pag-btn"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        data-testid="pagination-prev"
        aria-label="Página anterior"
      >
        ‹
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          type="button"
          className={"pag-btn" + (page === currentPage ? " pag-btn--activo" : "")}
          onClick={() => onPageChange(page)}
          data-testid={`pagination-page-${page}`}
          aria-current={page === currentPage ? "page" : undefined}
          aria-label={`Ir a página ${page}`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        className="pag-btn"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        data-testid="pagination-next"
        aria-label="Página siguiente"
      >
        ›
      </button>
    </div>
  );
}
