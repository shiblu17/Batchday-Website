import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Leaderboard from "./pages/Leaderboard";
import Status from "./pages/Status";
import Gallery from "./pages/Gallery";
import IdCardGenerator from "./pages/IdCardGenerator";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminExport from "./pages/admin/AdminExport";
import AdminScanner from "./pages/admin/AdminScanner";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminLeaderboard from "./pages/admin/AdminLeaderboard";
import GameHub from "./pages/GameHub";
import FlappyJU from "./pages/FlappyJU";
import MemoryMatch from "./pages/MemoryMatch";
import TicTacToe from "./pages/TicTacToe";
import DinoRun from "./pages/DinoRun";
import Confessions from "./pages/Confessions";
import AdminConfessions from "./pages/admin/AdminConfessions";
import AdminTimeline from "./pages/admin/AdminTimeline";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="ju52-ui-theme">
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            path="/id-card"
            element={
              <>
                <Navbar />
                <IdCardGenerator />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
