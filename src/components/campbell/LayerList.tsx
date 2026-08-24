interface Layer {
  label: string;
  status: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
}

interface Props {
  layers: Layer[];
  /** Class prefix for the section's palette, e.g. `cb-property` or `cb-safety`. */
  prefix: string;
}

/**
 * The linked "layer" cards shared by the real estate and safety sections.
 * Markup is identical between them; only the status palette differs, which
 * campbell.astro keys off the class prefix.
 */
export default function LayerList({ layers, prefix }: Props) {
  return (
    <div className={`${prefix}-layer-list`}>
      {layers.map((layer) => (
        <a
          key={layer.label}
          href={layer.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${prefix}-layer`}
        >
          <div className={`${prefix}-layer-top`}>
            <h4>{layer.label}</h4>
            <span className={`${prefix}-status ${prefix}-status--${layer.status.toLowerCase()}`}>
              {layer.status}
            </span>
          </div>
          <p>{layer.body}</p>
          <em>{layer.sourceLabel}</em>
        </a>
      ))}
    </div>
  );
}
