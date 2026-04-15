/**
 * Inline SVG logos for AI model providers.
 * Simple, recognizable at 20–40px. Each accepts size + color props.
 */

interface LogoProps {
  size?: number;
  color?: string;
  className?: string;
}

/** Anthropic – simplified Claude "spark" mark */
export function ClaudeLogo({ size = 24, color = "currentColor", className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M16.98 9.01L12 2 7.02 9.01 2 12l5.02 2.99L12 22l4.98-7.01L22 12l-5.02-2.99z" fill={color} />
    </svg>
  );
}

/** OpenAI – hexagonal "O" mark */
export function OpenAILogo({ size = 24, color = "currentColor", className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22.28 9.37a6.22 6.22 0 00-.54-5.12A6.3 6.3 0 0015 1.26a6.24 6.24 0 00-4.72.98A6.22 6.22 0 006 .98a6.3 6.3 0 00-4.2 3.06 6.24 6.24 0 00.76 7.33 6.22 6.22 0 00.54 5.12A6.3 6.3 0 009.84 19.5a6.22 6.22 0 003.88 3.24 6.3 6.3 0 006.76-1.06 6.22 6.22 0 002.34-4.96 6.24 6.24 0 00-1.72-4.6 6.22 6.22 0 001.18-2.75zM13.72 21.2a4.73 4.73 0 01-3.04-.56l.15-.08 5.04-2.91a.82.82 0 00.42-.72v-7.1l2.13 1.23a.08.08 0 01.04.06v5.88a4.76 4.76 0 01-4.74 4.2zM3.88 17.37a4.73 4.73 0 01-.56-3.18l.15.09 5.04 2.91a.82.82 0 00.82 0l6.16-3.56v2.46a.08.08 0 01-.03.07l-5.1 2.94a4.76 4.76 0 01-6.48-1.73zM2.5 7.87a4.73 4.73 0 012.48-2.62v5.98a.82.82 0 00.42.72l6.16 3.56-2.13 1.23a.08.08 0 01-.07 0l-5.1-2.94A4.76 4.76 0 012.5 7.87zm16.62 3.87l-6.16-3.56 2.13-1.23a.08.08 0 01.07 0l5.1 2.94a4.76 4.76 0 01-.74 8.55v-5.98a.82.82 0 00-.4-.72zm2.12-3.2l-.15-.09-5.04-2.91a.82.82 0 00-.82 0l-6.16 3.56V6.64a.08.08 0 01.03-.07l5.1-2.94a4.76 4.76 0 017.04 4.91zM8.68 13.33L6.55 12.1a.08.08 0 01-.04-.06V6.16a4.76 4.76 0 017.78-3.64l-.15.08-5.04 2.91a.82.82 0 00-.42.72v7.1zm1.16-2.5L12 9.5l2.16 1.25v2.5L12 14.5l-2.16-1.25v-2.5z" fill={color} />
    </svg>
  );
}

/** Google Gemini – 4-pointed sparkle star */
export function GeminiLogo({ size = 24, color = "currentColor", className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C12 2 14.5 8.5 12 12C9.5 8.5 12 2 12 2Z" fill={color} opacity="0.8" />
      <path d="M12 22C12 22 9.5 15.5 12 12C14.5 15.5 12 22 12 22Z" fill={color} opacity="0.8" />
      <path d="M2 12C2 12 8.5 9.5 12 12C8.5 14.5 2 12 2 12Z" fill={color} opacity="0.6" />
      <path d="M22 12C22 12 15.5 14.5 12 12C15.5 9.5 22 12 22 12Z" fill={color} opacity="0.6" />
    </svg>
  );
}

/** Meta – infinity-style "M" mark */
export function MetaLogo({ size = 24, color = "currentColor", className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6.92 6C4.84 6 3.2 7.84 2.4 9.84c-1 2.48-1.2 5.28.6 7.08C3.84 17.76 4.8 18 5.76 18c1.52 0 2.84-.88 3.96-2.16L12 13.2l2.28 2.64C15.4 17.12 16.72 18 18.24 18c.96 0 1.92-.24 2.76-1.08 1.8-1.8 1.6-4.6.6-7.08C20.8 7.84 19.16 6 17.08 6c-1.72 0-3.2 1.2-4.32 2.76L12 9.84l-.76-1.08C10.12 7.2 8.64 6 6.92 6zm0 2.4c.88 0 1.72.72 2.56 1.8L12 13.2l-2.52 3c-.84 1.08-1.68 1.8-2.56 1.8-.48 0-.84-.12-1.2-.48-.84-.84-.84-2.64-.12-4.44.6-1.44 1.44-2.88 2.32-4.68zm10.16 0c.88 1.8 1.72 3.24 2.32 4.68.72 1.8.72 3.6-.12 4.44-.36.36-.72.48-1.2.48-.88 0-1.72-.72-2.56-1.8L12 13.2l2.52-3c.84-1.08 1.68-1.8 2.56-1.8z" fill={color} />
    </svg>
  );
}

/** Mistral – "Le Chat" style wind/stacked bars mark */
export function MistralLogo({ size = 24, color = "currentColor", className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="5" height="5" rx="0.5" fill={color} />
      <rect x="16" y="3" width="5" height="5" rx="0.5" fill={color} />
      <rect x="3" y="9.5" width="5" height="5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="16" y="9.5" width="5" height="5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="3" y="16" width="5" height="5" rx="0.5" fill={color} />
      <rect x="9.5" y="16" width="5" height="5" rx="0.5" fill={color} />
      <rect x="16" y="16" width="5" height="5" rx="0.5" fill={color} />
    </svg>
  );
}

/** Midjourney – boat/sail abstract mark */
export function MidjourneyLogo({ size = 24, color = "currentColor", className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C8.5 7 6 11 5.5 14c-.5 3 1 5.5 3.5 6.5 2 .8 4.2.4 6-.8 1.8 1.2 4 1.6 6 .8 2.5-1 4-3.5 3.5-6.5-.5-3-3-7-6.5-12z" fill={color} />
    </svg>
  );
}

/** DeepSeek – stylized whale/wave mark */
export function DeepSeekLogo({ size = 24, color = "currentColor", className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm0 2c3.9 0 7 3.1 7 7s-3.1 7-7 7-7-3.1-7-7 3.1-7 7-7z" fill={color} opacity="0.4" />
      <path d="M5 13.5c1.5-1 3.5-2 7-2s5.5 1 7 2c-.5-4-3.2-7-7-7s-6.5 3-7 7z" fill={color} />
      <circle cx="9" cy="10" r="1" fill={color} opacity="0.6" />
      <circle cx="15" cy="10" r="1" fill={color} opacity="0.6" />
    </svg>
  );
}

/** Black Forest Labs (Flux) – abstract angular mark */
export function FluxLogo({ size = 24, color = "currentColor", className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 4h7l-3.5 7H4V4z" fill={color} />
      <path d="M20 20h-7l3.5-7H20v7z" fill={color} />
      <path d="M11 4l6.5 8L11 20V4z" fill={color} opacity="0.7" />
    </svg>
  );
}

/** Logo lookup by org name */
export const LOGO_COMPONENTS: Record<string, React.FC<LogoProps>> = {
  Anthropic: ClaudeLogo,
  OpenAI: OpenAILogo,
  Google: GeminiLogo,
  Meta: MetaLogo,
  Mistral: MistralLogo,
  Midjourney: MidjourneyLogo,
  "Black Forest Labs": FluxLogo,
  DeepSeek: DeepSeekLogo,
};

export function ModelLogo({ org, size = 24, color = "currentColor", className }: LogoProps & { org: string }) {
  const Logo = LOGO_COMPONENTS[org];
  if (!Logo) return <span style={{ fontSize: size * 0.8 }}>?</span>;
  return <Logo size={size} color={color} className={className} />;
}
