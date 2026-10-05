interface FilterOption<T extends string> {
  id: T;
  label: string;
}

interface FilterButtonsProps<T extends string> {
  className: string;
  ariaLabel: string;
  options: readonly FilterOption<T>[];
  active: T;
  onSelect: (id: T) => void;
}

/** Single-select toggle row; `aria-pressed` + `role="group"` so screen readers announce the selection. */
export default function FilterButtons<T extends string>({
  className,
  ariaLabel,
  options,
  active,
  onSelect,
}: FilterButtonsProps<T>) {
  return (
    <div className={className} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={active === option.id ? "is-active" : ""}
          aria-pressed={active === option.id}
          onClick={() => onSelect(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
