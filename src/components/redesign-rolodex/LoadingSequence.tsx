import type { StreamPhase } from "../../lib/redesignRolodex/useAnalyzeStream";
import { useLoadingMessages } from "../../lib/redesignRolodex/useLoadingMessages";

interface Props {
  screenshotBase64?: string;
  phase?: StreamPhase;
}

export default function LoadingSequence({ screenshotBase64, phase = "screenshot" }: Props) {
  const message = useLoadingMessages(phase);

  return (
    <div className="rr-loading">
      {screenshotBase64 && (
        <div className="rr-loading-preview">
          <img
            src={`data:image/jpeg;base64,${screenshotBase64}`}
            alt="Site preview"
            className="rr-loading-screenshot"
          />
          <div className="rr-loading-preview-overlay" />
        </div>
      )}
      <div className="rr-loading-spinner">
        <div className="rr-spinner-card rr-sc-1" />
        <div className="rr-spinner-card rr-sc-2" />
        <div className="rr-spinner-card rr-sc-3" />
      </div>
      <p className="rr-loading-text" key={message}>
        {message}
      </p>
    </div>
  );
}
