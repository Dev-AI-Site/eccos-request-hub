
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";

const Login = () => {
  const navigate = useNavigate();
  const { user, isLoading, getHomePath } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const redirectPath = getHomePath();
      navigate(redirectPath);
    }
  }, [user, navigate, getHomePath]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Check if the error is related to domain restriction
      if (error.code === "auth/popup-closed-by-user") {
        return; // User closed the popup, no need to show error
      }
      
      toast({
        title: "Erro ao fazer login",
        description: "Apenas contas do domínio @colegioeccos.com.br são permitidas.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-eccos-blue mb-2">ECCOS</h1>
          <h2 className="text-xl text-gray-600">RequestHub</h2>
          <p className="mt-4 text-gray-500">
            Plataforma de gerenciamento de solicitações do Colégio ECCOS
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={handleLogin}
            className="w-full bg-eccos-blue hover:bg-eccos-darkBlue py-6"
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Entrar com Google
          </Button>
          
          <div className="text-center text-sm text-gray-500 mt-4">
            <p>Apenas contas do domínio @colegioeccos.com.br são permitidas.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
