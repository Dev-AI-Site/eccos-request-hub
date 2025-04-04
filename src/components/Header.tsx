
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { LogOut, Menu, User, Settings, BarChart3, Package, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? "text-eccos-blue font-medium" : "";
  };
  
  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <h1 className="text-2xl font-bold text-eccos-blue">
            <span>ECCOS</span>
            <span className="text-gray-600 font-normal"> RequestHub</span>
          </h1>
        </Link>
        
        {user && (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <Link to="/dashboard" className={`nav-link ${isActive("/dashboard")}`}>
                Dashboard
              </Link>
              <Link to="/reserva" className={`nav-link ${isActive("/reserva")}`}>
                Reserva
              </Link>
              <Link to="/compra" className={`nav-link ${isActive("/compra")}`}>
                Compra
              </Link>
              <Link to="/suporte" className={`nav-link ${isActive("/suporte")}`}>
                Suporte
              </Link>
              
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="nav-link">
                      Admin <Settings className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Administração</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/solicitacoes">
                        <FileText className="mr-2 h-4 w-4" /> Solicitações
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/disponibilidade">
                        <BarChart3 className="mr-2 h-4 w-4" /> Disponibilidade
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/equipamentos">
                        <Package className="mr-2 h-4 w-4" /> Equipamentos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/usuarios">
                        <User className="mr-2 h-4 w-4" /> Usuários
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>
            
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <nav className="flex flex-col space-y-4 mt-8">
                    <Link to="/dashboard" className="text-lg">
                      Dashboard
                    </Link>
                    <Link to="/reserva" className="text-lg">
                      Reserva
                    </Link>
                    <Link to="/compra" className="text-lg">
                      Compra
                    </Link>
                    <Link to="/suporte" className="text-lg">
                      Suporte
                    </Link>
                    
                    {isAdmin && (
                      <>
                        <div className="text-lg font-medium text-gray-500 pt-2">
                          Administração
                        </div>
                        <Link to="/admin/solicitacoes" className="text-lg flex items-center">
                          <FileText className="mr-2 h-4 w-4" /> Solicitações
                        </Link>
                        <Link to="/admin/disponibilidade" className="text-lg flex items-center">
                          <BarChart3 className="mr-2 h-4 w-4" /> Disponibilidade
                        </Link>
                        <Link to="/admin/equipamentos" className="text-lg flex items-center">
                          <Package className="mr-2 h-4 w-4" /> Equipamentos
                        </Link>
                        <Link to="/admin/usuarios" className="text-lg flex items-center">
                          <User className="mr-2 h-4 w-4" /> Usuários
                        </Link>
                      </>
                    )}
                    <Button 
                      variant="destructive" 
                      onClick={handleSignOut}
                      className="flex items-center justify-center mt-4"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sair
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* User Dropdown (Desktop) */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || "User"} 
                        className="h-8 w-8 rounded-full mr-2"
                      />
                    ) : (
                      <User className="h-5 w-5 mr-2" />
                    )}
                    {user.displayName}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
