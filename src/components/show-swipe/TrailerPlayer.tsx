import { useEffect, useRef } from "react";

interface Props {
  youtubeKey: string;
  title: string;
  originalLanguage: string;
  onEnded?: () => void;
  onError?: () => void;
}

/* ── YouTube IFrame API loader (singleton) ────────────────────────── */

let apiLoaded = false;
let apiReady = false;
const readyQueue: (() => void)[] = [];

function ensureYTApi(cb: () => void) {
  if (apiReady) {
    cb();
    return;
  }
  readyQueue.push(cb);
  if (apiLoaded) return;
  apiLoaded = true;

  const prev = (window as any).onYouTubeIframeAPIReady;
  (window as any).onYouTubeIframeAPIReady = () => {
    apiReady = true;
    prev?.();
    readyQueue.forEach((fn) => fn());
    readyQueue.length = 0;
  };
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

/* ── Component ────────────────────────────────────────────────────── */

export default function TrailerPlayer({ youtubeKey, title, originalLanguage, onEnded, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const id = `yt-${youtubeKey}-${Math.random().toString(36).slice(2, 6)}`;

    ensureYTApi(() => {
      if (!containerRef.current) return;

      const el = document.createElement("div");
      el.id = id;
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(el);

      playerRef.current = new (window as any).YT.Player(id, {
        videoId: youtubeKey,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          controls: 1,
          ...(originalLanguage !== "en" && {
            cc_load_policy: 1,
            cc_lang_pref: "en",
          }),
        },
        events: {
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED === 0
            if (event.data === 0) {
              onEndedRef.current?.();
            }
          },
          onError: () => {
            // Fires for embedding disabled (101/150), removed (100), etc.
            onErrorRef.current?.();
          },
        },
      });
    });

    return () => {
      try {
        playerRef.current?.destroy?.();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, [youtubeKey]);

  return (
    <div className="ss-trailer" ref={containerRef} aria-label={`${title} trailer`} />
  );
}
