export default function ScatosLogo({ large = false }: { large?: boolean }) {
  return <span className={`sc-logo${large ? ' large' : ''}`} aria-label="ScatosSwipe">
    <span aria-hidden="true">Scato<span className="sc-joined-s"><span>S</span><span>S</span></span>wipe<span className="sc-logo-dot">✦</span></span>
  </span>;
}
