import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";

// Lazy imports
const Index = lazy(() => import("./pages/Index"));
const Register = lazy(() => import("./pages/Register"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Status = lazy(() => import("./pages/Status"));
const Gallery = lazy(() => import("./pages/Gallery"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminExport = lazy(() => import("./pages/admin/AdminExport"));
const AdminScanner = lazy(() => import("./pages/admin/AdminScanner"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery"));
const AdminLeaderboard = lazy(() => import("./pages/admin/AdminLeaderboard"));
const GameHub = lazy(() => import("./pages/GameHub"));
const FlappyJU = lazy(() => import("./pages/FlappyJU"));
const MemoryMatch = lazy(() => import("./pages/MemoryMatch"));
const TicTacToe = lazy(() => import("./pages/TicTacToe"));
const DinoRun = lazy(() => import("./pages/DinoRun"));
const LudoGame = lazy(() => import("./pages/LudoGame"));
const Confessions = lazy(() => import("./pages/Confessions"));
const AdminConfessions = lazy(() => import("./pages/admin/AdminConfessions"));
const AdminTimeline = lazy(() => import("./pages/admin/AdminTimeline"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingFallback = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-background relative overflow-hidden">
    {/* Animated background rings */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="w-32 h-32 sm:w-40 sm:h-40 bg-primary/10 rounded-full animate-ping [animation-duration:3s]"></div>
    </div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="w-48 h-48 sm:w-64 sm:h-64 bg-primary/5 rounded-full animate-ping [animation-duration:3s] [animation-delay:1.5s]"></div>
    </div>
    
    <div className="relative z-10 flex flex-col items-center gap-8">
       {/* Bouncing Logo Box */}
       <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary to-[#600000] rounded-3xl shadow-2xl shadow-primary/30 animate-bounce">
         <span className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-widest drop-shadow-md">JU</span>
         {/* Glassmet shine */}
         <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-3xl bg-gradient-to-b from-white/30 to-transparent"></div>
       </div>
       
       {/* Text Area */}
       <div className="flex flex-col items-center gap-3">
         <div className="flex items-center gap-1">
           <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">52nd Batch Day</span>
         </div>
         <div className="flex items-center gap-2 bg-muted/60 px-5 py-2 rounded-full border border-border/50">
           <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">লোড হচ্ছে</span>
           <span className="flex items-center gap-1 pt-1">
             <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
             <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
             <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
           </span>
         </div>
       </div>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="ju52-ui-theme">
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public routes with Navbar */}
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <Index />
                </>
              }
            />
            <Route
              path="/register"
              element={
                <>
                  <Navbar />
                  <Register />
                </>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <>
                  <Navbar />
                  <Leaderboard />
                </>
              }
            />
            <Route
              path="/status"
              element={
                <>
                  <Navbar />
                  <Status />
                </>
              }
            />
            <Route
              path="/gallery"
              element={
                <>
                  <Navbar />
                  <Gallery />
                </>
              }
            />
            <Route
              path="/game"
              element={
                <>
                  <Navbar />
                  <GameHub />
                </>
              }
            />
            <Route
              path="/game/flappy"
              element={
                <>
                  <Navbar />
                  <FlappyJU />
                </>
              }
            />
            <Route
              path="/game/memory"
              element={
                <>
                  <Navbar />
                  <MemoryMatch />
                </>
              }
            />
            <Route
              path="/game/tictactoe"
              element={
                <>
                  <Navbar />
                  <TicTacToe />
                </>
              }
            />
            <Route
              path="/game/dinorun"
              element={
                <>
                  <Navbar />
                  <DinoRun />
                </>
              }
            />
            <Route
              path="/game/ludo"
              element={<LudoGame />}
            />



            <Route
              path="/confessions"
              element={
                <>
                  <Navbar />
                  <Confessions />
                </>
              }
            />

            {/* Admin login (public) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin routes (protected) */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="export" element={<AdminExport />} />
              <Route path="scanner" element={<AdminScanner />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="leaderboard" element={<AdminLeaderboard />} />
              <Route path="confessions" element={<AdminConfessions />} />
              <Route path="timeline" element={<AdminTimeline />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
