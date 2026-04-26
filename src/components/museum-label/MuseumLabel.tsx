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
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
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

  const downloadImage = async () => {
    if (!label || !preview || downloading) return;
    setDownloading(true);
    try {
      // Wait for the placard fonts (Cormorant Garamond, Space Mono) to be ready
      // so canvas text rendering picks them up instead of falling back to serif.
      if (document.fonts?.ready) await document.fonts.ready;

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = preview;
      });

      const W = 1080;
      const PHOTO_H = 540;
      const PADDING = 64;
      const innerW = W - PADDING * 2;

      const TITLE_FONT = '600 56px "Cormorant Garamond", Georgia, serif';
      const ARTIST_FONT = 'italic 30px "Cormorant Garamond", Georgia, serif';
      const META_FONT = '22px "Cormorant Garamond", Georgia, serif';
      const DESC_FONT = '26px "Cormorant Garamond", Georgia, serif';
      const ACC_FONT = 'bold 16px "Space Mono", monospace';
      const BRAND_FONT = 'bold 14px "Space Mono", monospace';

      const probe = document.createElement("canvas").getContext("2d")!;
      const wrap = (text: string, font: string, maxWidth: number): string[] => {
        probe.font = font;
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let line = "";
        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (probe.measureText(test).width <= maxWidth) {
            line = test;
          } else {
            if (line) lines.push(line);
            line = w;
          }
        }
        if (line) lines.push(line);
        return lines;
      };

      const titleLines = wrap(label.title, TITLE_FONT, innerW);
      const artistLines = wrap(label.artist, ARTIST_FONT, innerW);
      const metaLines = wrap(
        `${label.period}  ·  ${label.materials}  ·  ${label.dimensions}`,
        META_FONT,
        innerW,
      );
      const descLines = wrap(label.description, DESC_FONT, innerW);

      const TITLE_LH = 64;
      const ARTIST_LH = 38;
      const META_LH = 30;
      const DESC_LH = 38;

      const bodyH =
        PADDING +
        titleLines.length * TITLE_LH +
        12 +
        artistLines.length * ARTIST_LH +
        24 +
        metaLines.length * META_LH +
        28 +
        descLines.length * DESC_LH +
        36 +
        24 +
        PADDING;

      const H = PHOTO_H + bodyH;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.textBaseline = "alphabetic";

      ctx.fillStyle = "#FFFDF9";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#1a1612";
      ctx.fillRect(0, 0, W, PHOTO_H);

      const imgRatio = img.width / img.height;
      const stripRatio = W / PHOTO_H;
      let sx: number, sy: number, sw: number, sh: number;
      if (imgRatio > stripRatio) {
        sh = img.height;
        sw = img.height * stripRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = img.width / stripRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, PHOTO_H);

      let y = PHOTO_H + PADDING + 48;

      ctx.fillStyle = "#1A1612";
      ctx.font = TITLE_FONT;
      for (const line of titleLines) {
        ctx.fillText(line, PADDING, y);
        y += TITLE_LH;
      }
      y += 12 - 16;

      ctx.fillStyle = "#5E5244";
      ctx.font = ARTIST_FONT;
      for (const line of artistLines) {
        ctx.fillText(line, PADDING, y);
        y += ARTIST_LH;
      }
      y += 24;

      ctx.fillStyle = "#9C8E7E";
      ctx.font = META_FONT;
      for (const line of metaLines) {
        ctx.fillText(line, PADDING, y);
        y += META_LH;
      }
      y += 28;

      ctx.fillStyle = "#1A1612";
      ctx.font = DESC_FONT;
      for (const line of descLines) {
        ctx.fillText(line, PADDING, y);
        y += DESC_LH;
      }
      y += 36;

      ctx.fillStyle = "#9C8E7E";
      ctx.font = ACC_FONT;
      ctx.fillText(label.accession.toUpperCase(), PADDING, y);

      ctx.fillStyle = "#A8A29E";
      ctx.font = BRAND_FONT;
      ctx.textAlign = "right";
      ctx.fillText("stanwood.dev/museum-label", W - PADDING, H - 28);
      ctx.textAlign = "left";

      await new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve();
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const slug = label.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "placard";
          a.download = `${slug}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          resolve();
        }, "image/png");
      });

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save image");
    } finally {
      setDownloading(false);
    }
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
            <button onClick={copyText} className="ml-btn-secondary">
              {copied ? "Copied!" : "Copy Text"}
            </button>
            <button
              onClick={downloadImage}
              className="ml-btn-primary"
              disabled={downloading}
              aria-busy={downloading}
            >
              {downloading ? "Saving…" : downloaded ? "Saved!" : "Download Image"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
