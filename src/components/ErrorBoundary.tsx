import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /**
   * Rendered in place of `children` after a crash. Pass a function to get a
   * `retry` callback that clears the error and re-renders the subtree.
   */
  fallback?: ReactNode | ((retry: () => void) => ReactNode);
  /** Called when a descendant throws — use for logging. */
  onError?: (error: unknown) => void;
}

interface State {
  hasError: boolean;
}

/** Catches render errors in a subtree and shows a fallback instead of crashing the page. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error);
  }

  retry = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback } = this.props;
    if (typeof fallback === "function") return fallback(this.retry);

    return fallback ?? (
      <div style={{ padding: "16px", fontSize: "13px", color: "#666" }}>
        Something went wrong. Refresh to try again.
      </div>
    );
  }
}
