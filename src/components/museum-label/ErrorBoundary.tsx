import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  crashed: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(err: unknown) {
    console.error("MuseumLabel render error:", err);
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="ml-error">
          <p>
            Something went wrong.{" "}
            <button onClick={() => this.setState({ crashed: false })}>
              Try again
            </button>
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
