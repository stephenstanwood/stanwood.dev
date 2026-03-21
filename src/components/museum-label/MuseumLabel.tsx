import { useState, useCallback, useRef } from "react";
import { LABEL_STYLES, type MuseumLabel as MuseumLabelType, type LabelStyle } from "../../lib/museumPrompt";

type AppState = "idle" | "loading" | "result" | "error";

export default function MuseumLabel() {
  const [state, setState] = useState<AppState>("idle");
  const [style, setStyle] = useState<LabelStyle>("museum");

  const [imageData, setImageData] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<MuseumLabelType | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const placardRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large. Please use a photo under 10MB.");
      return;
    }
    setError("");
    setPreviewUrl(URL.createObjectURL(file));
    setMediaType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Strip the data:image/...;base64, prefix
      const base64 = dataUrl.split(",")[1];
      setImageData(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleGenerate = useCallback(async (styleOverride?: LabelStyle) => {
    if (!imageData) return;
    const useStyle = styleOverride ?? style;
    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/museum-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData, mediaType, style: useStyle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setState("error");
        return;
      }
      setResult(data);
      setState("result");
    } catch {
      setError("Network error. Please try again.");
      setState("error");
    }
  }, [imageData, mediaType, style]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = [
      result.title,
      result.period + (result.date ? `, ${result.date}` : ""),
      result.materials,
      "",
      result.description,
    ].join("\n");
    await navigator.clipboard.writeText(text);
  }, [result]);

  const handleReset = useCallback(() => {
    setState("idle");
    setResult(null);
    setImageData(null);
    setPreviewUrl(null);
    setMediaType("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // --- Render ---

  if (state === "loading") {
    return (
      <div className="ml-loading">
        <div className="ml-loading-icon">
          <div className="ml-magnifier" />
        </div>
        <p className="ml-loading-text">The curator is examining your artifact...</p>
      </div>
    );
  }

  if ((state === "result" || state === "error") && result) {
    return (
      <div className="ml-result">
        <div className="ml-result-layout">
          {previewUrl && (
            <div className="ml-photo-frame">
              <img src={previewUrl} alt="Uploaded object" className="ml-photo" />
            </div>
          )}
          <div className="ml-placard" ref={placardRef}>
            <div className="ml-placard-inner">
              <h2 className="ml-placard-title">{result.title}</h2>
              <p className="ml-placard-period">
                {result.period}, {result.date}
              </p>
              <p className="ml-placard-materials">{result.materials}</p>
              <div className="ml-placard-divider" />
              <p className="ml-placard-description">{result.description}</p>
              <p className="ml-placard-credit">stanwood.dev/museum-label</p>
            </div>
          </div>
        </div>

        <div className="ml-actions">
          <button className="ml-btn-secondary" onClick={handleCopy}>
            Copy text
          </button>
          <button className="ml-btn-secondary" onClick={() => handleGenerate()}>
            Regenerate
          </button>
          <button className="ml-btn-secondary" onClick={() => {
            const next: LabelStyle = style === "grandiose" ? "museum" :
              style === "museum" ? "archaeology" :
              style === "archaeology" ? "modern-art" :
              style === "modern-art" ? "auction" : "grandiose";
            setStyle(next);
            handleGenerate(next);
          }}>
            More pompous
          </button>
        </div>

        <button className="ml-btn-reset" onClick={handleReset}>
          Label another object
        </button>
      </div>
    );
  }

  // idle / error without result
  return (
    <div className="ml-form-container">
      <h1 className="ml-title">Tiny Museum Label</h1>
      <p className="ml-subtitle">upload an ordinary object. receive an absurdly serious placard.</p>

      <div
        className={`ml-upload-zone ${imageData ? "ml-upload-zone--has-image" : ""}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="ml-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="ml-upload-preview" />
        ) : (
          <div className="ml-upload-placeholder">
            <span className="ml-upload-icon">+</span>
            <span className="ml-upload-text">Drop a photo here or tap to upload</span>
          </div>
        )}
      </div>

      <div className="ml-options">
        <div className="ml-style-selector">
          <label className="ml-label">Label style</label>
          <div className="ml-style-pills">
            {LABEL_STYLES.map((s) => (
              <button
                key={s.id}
                className={`ml-style-pill ${style === s.id ? "ml-style-pill--active" : ""}`}
                onClick={() => setStyle(s.id)}
                title={s.description}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

      </div>

      {error && (
        <div className="ml-error">
          <p>{error}</p>
        </div>
      )}

      <button
        className="ml-btn-primary"
        disabled={!imageData}
        onClick={handleGenerate}
      >
        Generate label
      </button>
    </div>
  );
}
