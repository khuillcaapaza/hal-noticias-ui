interface ListHeaderProps {
  title: string;
  subtitle?: string;
  onCreateNew: () => void;
  buttonLabel?: string;
}

export default function ListHeader({
  title,
  subtitle,
  onCreateNew,
  buttonLabel = "+ Nueva noticia",
}: ListHeaderProps) {
  return (
    <div className="seccion-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="seccion-sub">{subtitle}</p>}
      </div>
      <button
        type="button"
        className="boton boton--sm"
        onClick={onCreateNew}
        data-testid="create-button"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
