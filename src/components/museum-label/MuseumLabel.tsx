import { useState, useRef, useCallback } from "react";
import { MUSEUM_STYLES, type MuseumLabel as MuseumLabelType } from "../../lib/museumPrompt";

type Phase = "upload" | "loading" | "result";

// Resize to max 1200px before upload — reduces API cost on large photos without visible quality loss
function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = dataUrl;
  });
}

export default function MuseumLabel() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [style, setStyle] = useState("classic");
  const [preview, setPreview] = useState<string | null>(null);
  const [label, setLabel] = useState<MuseumLabelType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string);
      setPreview(compressed);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const generate = async (styleOverride?: string) => {
    if (!preview) return;
    const styleToUse = styleOverride ?? style;
    setPhase("loading");
    setError(null);
    setLabel(null);

    try {
      const res = await fetch("/api/museum-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview, style: styleToUse }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Error ${res.status}`);
      }
      const data: MuseumLabelType = await res.json();
      setLabel(data);
      setPhase("result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("upload");
    }
  };

  const reset = () => {
    setPhase("upload");
    setPreview(null);
    setLabel(null);
    setError(null);
    setCopied(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const copyText = () => {
    if (!label) return;
    const text = `${label.title}\n${label.artist}\n\n${label.period}\n${label.materials}\n${label.dimensions}\n\n${label.description}\n\n${label.accession}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ml-app">
      {/* Style selector */}
      <div className="ml-styles">
        {MUSEUM_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setStyle(s.id);
              if (phase === "result" && s.id !== style) generate(s.id);
            }}
            className={`ml-style-btn ${style === s.id ? "ml-style-btn--active" : ""}`}
            title={s.description}
          >
            <span className="ml-style-emoji">{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Upload phase */}
      {phase === "upload" && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`ml-dropzone ${dragOver ? "ml-dropzone--active" : ""} ${preview ? "ml-dropzone--has-preview" : ""}`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="ml-file-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {preview ? (
              <div className="ml-preview-wrap">
                <img src={preview} alt="Your upload" className="ml-preview-img" />
                <p className="ml-preview-hint">click or drop to replace</p>
              </div>
            ) : (
              <div className="ml-dropzone-empty">
                <span className="ml-dropzone-icon">🖼️</span>
                <p className="ml-dropzone-text">Drop a photo of any object</p>
                <p className="ml-dropzone-hint">or click to browse — JPG, PNG, WebP up to 10 MB</p>
              </div>
            )}
          </div>

          {error && <div className="ml-error"><p>{error}</p></div>}

          {preview && (
            <button onClick={() => generate()} className="ml-btn-primary">
              Generate Label
            </button>
          )}
        </>
      )}

      {/* Loading phase */}
      {phase === "loading" && (
        <div className="ml-loading">
          <div className="ml-spinner">🏺</div>
          <p className="ml-loading-text">The curator is examining your artifact...</p>
          <p className="ml-loading-hint">This takes a few seconds</p>
        </div>
      )}

      {/* Result phase */}
      {phase === "result" && label && (
        <div className="ml-result ml-fade-in">
          {/* The placard */}
          <div className="ml-placard">
            <h2 className="ml-placard-title">{label.title}</h2>
            <p className="ml-placard-artist">{label.artist}</p>
            <div className="ml-placard-meta">
              <p>{label.period}</p>
              <p>{label.materials}</p>
              <p>{label.dimensions}</p>
            </div>
            <p className="ml-placard-desc">{label.description}</p>
            <p className="ml-placard-accession">{label.accession}</p>
          </div>

          {preview && (
            <div className="ml-result-photo">
              <img src={preview} alt="The artifact" className="ml-result-img" />
            </div>
          )}

          <div className="ml-actions">
            <button onClick={reset} className="ml-btn-secondary">New Object</button>
            <button onClick={() => generate()} className="ml-btn-secondary">Regenerate</button>
            <button onClick={copyText} className="ml-btn-primary">
              {copied ? "Copied!" : "Copy Text"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
