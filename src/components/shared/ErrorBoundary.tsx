"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: React.ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Generic error boundary that catches render errors in child components
 * and displays a graceful fallback UI instead of crashing the whole page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[ErrorBoundary]", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white transition-colors mb-1">
                            {this.props.fallbackTitle || "Something went wrong"}
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                            {this.state.error?.message || "An unexpected error occurred. Please try again."}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                        className="gap-2 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reload Page
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
