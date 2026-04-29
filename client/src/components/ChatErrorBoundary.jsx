import React from "react";

class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Chat pane crashed:", error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center px-6 bg-background">
          <div className="max-w-md text-center rounded-3xl border border-border bg-card/80 backdrop-blur-xl px-8 py-7 shadow-xl">
            <h2 className="text-lg font-bold text-foreground mb-2">Unable to open this chat</h2>
            <p className="text-sm text-muted-foreground mb-5">
              We hit an unexpected message format. Try reopening the chat or refreshing your chats list.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;
