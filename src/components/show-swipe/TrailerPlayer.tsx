interface Props {
  youtubeKey: string;
  title: string;
}

export default function TrailerPlayer({ youtubeKey, title }: Props) {
  return (
    <div className="ss-trailer">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&controls=1`}
        title={`${title} trailer`}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="ss-trailer-iframe"
      />
    </div>
  );
}
