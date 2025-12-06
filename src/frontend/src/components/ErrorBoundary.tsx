// src/frontend/src/components/ErrorBoundary.tsx
import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: any) {
        console.error("ErrorBoundary caught:", error, info);
        // TODO: report to your logging backend
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6">
                    <h2 className="text-lg font-bold">Something went wrong.</h2>
                    <pre className="mt-3 text-sm bg-[#0b0b0b] p-3 rounded">
                        {String(this.state.error)}
                    </pre>
                    <button
                        className="mt-3 px-3 py-2 bg-purple-600 rounded text-white"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
