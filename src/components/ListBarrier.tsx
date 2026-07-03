import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";

interface ListBarrierProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  categoryValue: string;
  onCategoryChange: (value: string) => void;
  categorias: string[];
  total: number;
  show?: boolean;
}

export default function ListBarrier({
  searchValue,
  onSearchChange,
  categoryValue,
  onCategoryChange,
  categorias,
  total,
  show = true,
}: ListBarrierProps) {
  if (!show) return null;

  return (
    <div className="lista-barra" data-testid="list-barrier">
      <SearchBar value={searchValue} onChange={onSearchChange} />
      <CategoryFilter
        value={categoryValue}
        onChange={onCategoryChange}
        categorias={categorias}
      />
      <span className="lista-conteo" data-testid="item-count">
        {total} noticia{total === 1 ? "" : "s"}
      </span>
    </div>
  );
}
