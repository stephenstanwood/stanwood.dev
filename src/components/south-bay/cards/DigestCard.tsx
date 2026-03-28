interface DigestData {
  city: string;
  cityName: string;
  body: string;
  meetingDate: string;
  title: string;
  summary: string;
  keyTopics: string[];
  nextMeeting: string | null;
  schedule: string;
  sourceUrl: string;
}

interface Props {
  digest: DigestData;
}

export default function DigestCard({ digest }: Props) {
  return (
    <div className="sb-digest-card">
      <div className="sb-digest-header">
        <div className="sb-digest-city">{digest.cityName}</div>
        <div className="sb-digest-body">{digest.body}</div>
      </div>
      <div className="sb-digest-date">{digest.meetingDate}</div>
      <p className="sb-digest-summary">{digest.summary}</p>
      {digest.keyTopics.length > 0 && (
        <ul className="sb-digest-topics">
          {digest.keyTopics.map((topic, i) => (
            <li key={i}>{topic}</li>
          ))}
        </ul>
      )}
      <div className="sb-digest-footer">
        {digest.nextMeeting && (
          <span className="sb-digest-next">
            Next meeting: {digest.nextMeeting}
          </span>
        )}
        <a
          href={digest.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sb-digest-source"
        >
          View agenda
        </a>
      </div>
    </div>
  );
}

export type { DigestData };
