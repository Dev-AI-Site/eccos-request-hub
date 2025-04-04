
import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useToast } from "@/hooks/use-toast";
import { UserData, UserRole } from "@/lib/authService";
import { getAllUsers, updateUserRole } from "@/lib/userService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search } from "lucide-react";

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  
  const [confirmRoleChangeOpen, setConfirmRoleChangeOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState<UserRole | null>(null);
  
  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const allUsers = await getAllUsers();
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os usuários.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [toast]);
  
  // Apply filters
  useEffect(() => {
    let result = [...users];
    
    if (roleFilter) {
      result = result.filter((user) => user.role === roleFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.displayName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }
    
    setFilteredUsers(result);
  }, [users, roleFilter, searchQuery]);
  
  const handleRoleChange = (user: UserData, role: UserRole) => {
    if (user.email === "suporte@colegioeccos.com.br") {
      toast({
        title: "Operação não permitida",
        description: "Não é possível alterar o papel do usuário suporte@colegioeccos.com.br.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedUser(user);
    setNewRole(role);
    setConfirmRoleChangeOpen(true);
  };
  
  const confirmRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      await updateUserRole(selectedUser.uid, newRole);
      
      // Update local state
      const updatedUsers = users.map(user => 
        user.uid === selectedUser.uid 
          ? { ...user, role: newRole } 
          : user
      );
      
      setUsers(updatedUsers);
      
      setConfirmRoleChangeOpen(false);
      
      toast({
        title: "Papel atualizado",
        description: `O usuário ${selectedUser.displayName || selectedUser.email} agora é ${newRole === "admin" ? "Administrador" : newRole === "blocked" ? "Bloqueado" : "Usuário"}.`,
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o papel do usuário.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Administração de Usuários</h1>
            <p className="text-gray-500">
              Gerencie os usuários e seus níveis de acesso
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>
                  Lista de todos os usuários que acessaram a plataforma
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | "")}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filtrar por papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="user">Usuários</SelectItem>
                    <SelectItem value="blocked">Bloqueados</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar por nome ou email..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8">
                <LoadingSpinner />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum usuário encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">Nome</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Papel</th>
                      <th className="pb-2 font-medium">Último acesso</th>
                      <th className="pb-2 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((user) => (
                      <tr key={user.uid} className="hover:bg-gray-50">
                        <td className="py-3 flex items-center">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName}
                              className="w-8 h-8 rounded-full mr-2"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 mr-2" />
                          )}
                          {user.displayName || "Sem nome"}
                        </td>
                        <td className="py-3">{user.email}</td>
                        <td className="py-3">
                          <Badge role={user.role} />
                        </td>
                        <td className="py-3">
                          {format(user.lastLogin, "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </td>
                        <td className="py-3">
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user, value as UserRole)}
                            disabled={user.email === "suporte@colegioeccos.com.br"}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="blocked">Bloqueado</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Confirm Role Change Dialog */}
      <ConfirmationDialog
        open={confirmRoleChangeOpen}
        onOpenChange={setConfirmRoleChangeOpen}
        title="Alterar Papel do Usuário"
        description={`Deseja alterar o papel de ${selectedUser?.displayName || selectedUser?.email} para ${newRole === "admin" ? "Administrador" : newRole === "blocked" ? "Bloqueado" : "Usuário"}?${newRole === "blocked" ? " O usuário não conseguirá mais acessar a plataforma." : ""}`}
        confirmText="Sim, alterar"
        cancelText="Não, cancelar"
        onConfirm={confirmRoleChange}
      />
    </>
  );
};

// Component to display user role with appropriate color
const Badge = ({ role }: { role: UserRole }) => {
  let bgColor = "";
  let textColor = "";
  let label = "";
  
  switch (role) {
    case "admin":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      label = "Administrador";
      break;
    case "user":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      label = "Usuário";
      break;
    case "blocked":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      label = "Bloqueado";
      break;
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${bgColor} ${textColor}`}>
      {label}
    </span>
  );
};

export default AdminUsers;
