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
const Confessions = lazy(() => import("./pages/Confessions"));
const AdminConfessions = lazy(() => import("./pages/admin/AdminConfessions"));
const AdminTimeline = lazy(() => import("./pages/admin/AdminTimeline"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center p-4">
    <div className="flex flex-col items-center gap-3">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="font-display font-medium text-muted-foreground animate-pulse">লোড হচ্ছে...</p>
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
