import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-cream p-6 text-center">
          <h1 className="font-display text-xl text-navy mb-2">Something went wrong</h1>
          <p className="font-body text-sm text-floral-slate mb-4 max-w-md">
            {this.state.error.message}
          </p>
          <pre className="font-body text-[10px] text-parchment bg-navy/5 rounded-xl p-4 max-w-md overflow-auto text-left whitespace-pre-wrap">
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="mt-6 px-6 py-3 rounded-full bg-navy text-cream font-body text-sm font-medium"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
