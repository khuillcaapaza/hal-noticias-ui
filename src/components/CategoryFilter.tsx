interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  categorias: string[];
  label?: string;
}

export default function CategoryFilter({
  value,
  onChange,
  categorias,
  label = "Todas las categorías",
}: CategoryFilterProps) {
  return (
    <select
      className="lista-filtro"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid="category-filter"
    >
      <option value="">{label}</option>
      {categorias.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
