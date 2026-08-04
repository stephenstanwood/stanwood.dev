import ErrorBoundary from "../ErrorBoundary";
import MuseumLabel from "./MuseumLabel";

export default function MuseumLabelApp() {
  return (
    <ErrorBoundary
      onError={(err) => console.error("MuseumLabel render error:", err)}
      fallback={(retry) => (
        <div className="ml-error">
          <p>
            Something went wrong. <button onClick={retry}>Try again</button>
          </p>
        </div>
      )}
    >
      <MuseumLabel />
    </ErrorBoundary>
  );
}
