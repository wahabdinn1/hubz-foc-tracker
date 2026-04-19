"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
    children: React.ReactNode;
    fallbackTitle?: string;
    fallbackDescription?: string;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    resetErrorTimeout?: number; // milliseconds
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    resetAttempts: number;
}

/**
 * Enhanced error boundary that catches render errors in child components
 * and displays a graceful fallback UI with recovery options.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null,
            resetAttempts: 0 
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { 
            hasError: true, 
            error,
            errorInfo: null 
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console
        console.error("[ErrorBoundary]", error, errorInfo);
        
        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
        
        // Show toast notification for user feedback
        toast.error('An error occurred', {
            description: 'We encountered an unexpected issue. Please try refreshing the page.',
            duration: 5000,
        });
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        // Auto-reset error after timeout if specified
        if (
            this.state.hasError && 
            this.props.resetErrorTimeout && 
            this.state.resetAttempts === 0
        ) {
            setTimeout(() => {
                this.resetError();
            }, this.props.resetErrorTimeout);
        }
    }

    resetError = () => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            resetAttempts: prevState.resetAttempts + 1,
        }));
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <AlertCircle className="w-9 h-9 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white transition-colors mb-2">
                            {this.props.fallbackTitle || "Something went wrong"}
                        </h2>
                        <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-xl mb-4">
                            {this.props.fallbackDescription || 
                            "We encountered an unexpected issue. Please try refreshing the page or contact support if the problem persists."}
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="default"
                                onClick={() => {
                                    this.resetError();
                                    window.location.reload();
                                }}
                                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Reload Page
                            </Button>
                            
                            <Button
                                variant="outline"
                                onClick={() => {
                                    // Navigate to home as fallback
                                    window.location.href = '/';
                                }}
                                className="w-full md:w-auto px-6 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <Info className="w-5 h-5" />
                                Go Home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Specialized error boundary for dashboard components
export const DashboardErrorBoundary = ({ 
    fallbackTitle, 
    fallbackDescription, 
    children 
}: Props & { 
    fallbackTitle: string; 
    fallbackDescription?: string 
}) => (
    <ErrorBoundary 
      fallbackTitle={fallbackTitle}
      fallbackDescription={fallbackDescription}
      resetErrorTimeout={30000} // 30 seconds
    >
      {children}
    </ErrorBoundary>
);

// Specialized error boundary for form components
export const FormErrorBoundary = ({ 
    fallbackTitle, 
    fallbackDescription, 
    children 
}: Props & { 
    fallbackTitle: string; 
    fallbackDescription?: string 
}) => (
    <ErrorBoundary 
      fallbackTitle={fallbackTitle}
      fallbackDescription={fallbackDescription}
      resetErrorTimeout={15000} // 15 seconds
    >
      {children}
    </ErrorBoundary>
);
