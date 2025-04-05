
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import ReservationForm from "../ReservationForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const AdminReservation = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirecionar para o dashboard se não for admin
  React.useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, navigate]);

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <Alert variant="default" className="mb-8 bg-amber-50 text-amber-800 border-amber-200 shadow-md hover:shadow-lg transition-all duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">Modo Administrador</AlertTitle>
          <AlertDescription>
            Como administrador da Tecnologia ECCOS, você pode fazer reservas sem restrições de disponibilidade. 
            Utilize essa funcionalidade com responsabilidade.
          </AlertDescription>
        </Alert>
        
        <ReservationForm />
      </div>
    </>
  );
};

export default AdminReservation;
