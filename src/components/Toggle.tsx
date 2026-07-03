interface ToggleProps {
  id?: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  ariaLabel?: string;
}

export default function Toggle({
  id = "toggle",
  label,
  checked = false,
  disabled = false,
  onChange,
  className = "",
  ariaLabel,
}: ToggleProps) {
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={`toggle-wrapper ${className}`}>
      <label htmlFor={id} className="toggle-label">
        <input
          id={id}
          type="checkbox"
          className="toggle-input"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel || label}
        />
        <span className="toggle-track">
          <span className="toggle-thumb" />
        </span>
        <span className="toggle-text">{label}</span>
      </label>
    </div>
  );
}
