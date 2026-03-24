import ErrorBoundary from "./ErrorBoundary";
import MuseumLabel from "./MuseumLabel";

export default function MuseumLabelApp() {
  return (
    <ErrorBoundary>
      <MuseumLabel />
    </ErrorBoundary>
  );
}
