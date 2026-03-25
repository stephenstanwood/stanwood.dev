import ErrorBoundary from "../ErrorBoundary";
import RedesignRolodex from "./RedesignRolodex";

/** Single Astro island entry — wraps RedesignRolodex with an error boundary. */
export default function RedesignRolodexPage() {
  return (
    <ErrorBoundary>
      <RedesignRolodex />
    </ErrorBoundary>
  );
}
