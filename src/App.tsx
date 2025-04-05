
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ReservationForm from "./pages/ReservationForm";
import PurchaseForm from "./pages/PurchaseForm";
import SupportForm from "./pages/SupportForm";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminAvailability from "./pages/admin/AdminAvailability";
import AdminEquipment from "./pages/admin/AdminEquipment";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReservation from "./pages/admin/AdminReservation";
import NotFound from "./pages/NotFound";
import LoadingSpinner from "./components/LoadingSpinner";
import "./App.css";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children, adminRequired = false }: { 
  children: React.ReactNode, 
  adminRequired?: boolean 
}) => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminRequired && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected User Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reserva" 
              element={
                <ProtectedRoute>
                  <ReservationForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/compra" 
              element={
                <ProtectedRoute>
                  <PurchaseForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/suporte" 
              element={
                <ProtectedRoute>
                  <SupportForm />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Admin Routes - Organizadas com as principais primeiro */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminRequired>
                  <Navigate to="/admin/equipamentos" replace />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/equipamentos" 
              element={
                <ProtectedRoute adminRequired>
                  <AdminEquipment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/disponibilidade" 
              element={
                <ProtectedRoute adminRequired>
                  <AdminAvailability />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/usuarios" 
              element={
                <ProtectedRoute adminRequired>
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            
            {/* Rotas admin secundárias */}
            <Route 
              path="/admin/solicitacoes" 
              element={
                <ProtectedRoute adminRequired>
                  <AdminRequests />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reserva" 
              element={
                <ProtectedRoute adminRequired>
                  <AdminReservation />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
