"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-red-50/80 border border-red-200 rounded-2xl text-center space-y-3 my-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-red-900">Something went wrong displaying this section</h3>
          <p className="text-xs text-red-700 max-w-md mx-auto">
            {this.state.error?.message || "An unexpected error occurred while rendering this component."}
          </p>
          <Button
            size="sm"
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold px-4 py-2"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
