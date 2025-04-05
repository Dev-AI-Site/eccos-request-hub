
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UserRole, getUserRole, updateUserLastLogin } from "@/lib/authService";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  getHomePath: () => string; // Nova função para obter o caminho inicial com base no papel do usuário
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  isAdmin: false,
  getHomePath: () => "/dashboard", // Valor padrão
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Função para determinar o caminho inicial com base no papel do usuário
  const getHomePath = () => {
    if (userRole === "admin") {
      return "/admin/solicitacoes";
    }
    return "/dashboard";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Check if user's email is from the allowed domain
          if (!currentUser.email?.endsWith("@colegioeccos.com.br")) {
            await auth.signOut();
            toast({
              title: "Acesso Negado",
              description: "Apenas contas @colegioeccos.com.br são permitidas.",
              variant: "destructive",
            });
            setUser(null);
            setUserRole(null);
            setIsLoading(false);
            return;
          }

          // Get user role and update last login
          const role = await getUserRole(currentUser);
          
          if (role === "blocked") {
            await auth.signOut();
            toast({
              title: "Conta Bloqueada",
              description: "Sua conta está bloqueada. Entre em contato com o administrador.",
              variant: "destructive",
            });
            setUser(null);
            setUserRole(null);
          } else {
            setUser(currentUser);
            setUserRole(role);
            await updateUserLastLogin(currentUser.uid);
          }
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Auth error:", error);
        setUser(null);
        setUserRole(null);
        toast({
          title: "Erro de Autenticação",
          description: "Ocorreu um erro ao verificar sua conta.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [toast]);

  const value = {
    user,
    userRole,
    isLoading,
    isAdmin: userRole === "admin",
    getHomePath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
