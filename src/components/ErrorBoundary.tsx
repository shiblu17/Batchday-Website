import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-lg"
          >
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <h1 className="font-display text-2xl font-bold text-foreground mb-3">
              উফ! কিছু একটা ভুল হয়েছে
            </h1>
            
            <p className="text-muted-foreground text-sm mb-8">
              আমরা আন্তরিকভাবে দুঃখিত। সাইটটিতে কোনো একটি প্রযুক্তিগত সমস্যা হয়েছে। অনুগ্রহ করে পেজটি রিলোড করার চেষ্টা করুন।
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-6 rounded-xl font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCcw className="h-4 w-4" />
              পেজটি রিলোড করুন
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 text-left bg-muted p-4 rounded-xl overflow-auto text-xs text-muted-foreground font-mono">
                <p className="font-bold text-destructive mb-2">{this.state.error.toString()}</p>
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
