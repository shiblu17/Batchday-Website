import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-3xl shadow-card border border-border text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-2xl -ml-10 -mb-10" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-destructive/20">
            <AlertTriangle className="h-10 w-10" />
          </div>
          
          <h1 className="font-display text-2xl font-bold mb-3">কিছু একটা সমস্যা হয়েছে!</h1>
          
          <p className="text-sm text-muted-foreground mb-6">
            দুঃখিত, পেজটি লোড করার সময় একটি অনাকাঙ্ক্ষিত ত্রুটি দেখা দিয়েছে। দয়া করে আবার চেষ্টা করুন।
          </p>

          <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3 w-full text-left mb-8 max-h-32 overflow-y-auto">
            <p className="text-xs font-mono text-destructive/80 break-words">{error.message}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={resetErrorBoundary}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-xl transition-all hover:bg-primary/90 active:scale-95 shadow-md"
            >
              <RefreshCcw className="h-4 w-4" />
              আবার চেষ্টা করুন
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 flex items-center justify-center gap-2 bg-muted text-muted-foreground font-semibold py-3 rounded-xl transition-all hover:bg-muted/80 active:scale-95"
            >
              <Home className="h-4 w-4" />
              হোম পেজ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
