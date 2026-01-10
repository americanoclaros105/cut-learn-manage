import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Layouts
import { AdminLayout } from "./layouts/AdminLayout";
import { StudentLayout } from "./layouts/StudentLayout";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { LandingEditor } from "./pages/admin/LandingEditor";
import { CoursesManager } from "./pages/admin/CoursesManager";
import { StudentsManager } from "./pages/admin/StudentsManager";

// Student Pages
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { CourseViewer } from "./pages/student/CourseViewer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="superadmin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="landing" element={<LandingEditor />} />
              <Route path="cursos" element={<CoursesManager />} />
              <Route path="estudiantes" element={<StudentsManager />} />
            </Route>

            {/* Student Routes */}
            <Route
              path="/estudiante"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
            </Route>
            <Route
              path="/estudiante/curso/:courseId"
              element={
                <ProtectedRoute requiredRole="student">
                  <CourseViewer />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;