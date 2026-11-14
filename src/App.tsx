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
import { CourseEditor } from "./pages/admin/CourseEditor";
import { StudentsManager } from "./pages/admin/StudentsManager";
import { CourseGroup } from "./pages/admin/CourseGroup";
import { Accounting } from "./pages/admin/Accounting";
import { StudentCreate } from "./pages/admin/student/StudentCreate";
import { StudentDetail } from "./pages/admin/student/StudentDetail";

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
              <Route path="cursos/nuevo" element={<CourseEditor />} />
              <Route path="cursos/:courseId" element={<CourseEditor />} />
              <Route path="cursos/:courseId/grupo" element={<CourseGroup />} />
              <Route path="estudiantes" element={<StudentsManager />} />
              <Route path="estudiantes/nuevo" element={<StudentCreate />} />
              <Route path="estudiantes/:studentId" element={<StudentDetail />} />
              <Route path="contabilidad" element={<Accounting />} />
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