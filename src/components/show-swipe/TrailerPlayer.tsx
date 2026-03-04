import { useState } from "react";

interface Props {
  youtubeKey: string;
  title: string;
}

export default function TrailerPlayer({ youtubeKey, title }: Props) {
  const [playing, setPlaying] = useState(false);

  const thumbnail = `https://img.youtube.com/vi/${youtubeKey}/hqdefault.jpg`;

  if (playing) {
    return (
      <div className="ss-trailer">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
          title={`${title} trailer`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="ss-trailer-iframe"
        />
      </div>
    );
  }

  return (
    <div className="ss-trailer" onClick={() => setPlaying(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPlaying(true); }}>
      <img
        src={thumbnail}
        alt={`${title} trailer thumbnail`}
        className="ss-trailer-thumb"
        loading="eager"
      />
      <div className="ss-play-btn" aria-label="Play trailer">
        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}
