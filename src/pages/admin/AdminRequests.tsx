import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import LoadingSpinner from "@/components/LoadingSpinner";
import RequestStatusBadge from "@/components/RequestStatusBadge";
import Chat from "@/components/Chat";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { Request, RequestStatus, RequestType, addChatMessage, deleteRequest, getAllRequests, updateRequestStatus } from "@/lib/requestService";
import { Check, Eye, Filter, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const AdminRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  
  const [typeFilter, setTypeFilter] = useState<RequestType | "todos">('todos');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "todos">('todos');
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [statusUpdateConfirmOpen, setStatusUpdateConfirmOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<RequestStatus | null>(null);
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const allRequests = await getAllRequests(showCompleted);
        setRequests(allRequests);
        setFilteredRequests(allRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as solicitações.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequests();
  }, [showCompleted, toast]);
  
  useEffect(() => {
    let result = [...requests];
    
    if (typeFilter !== 'todos') {
      result = result.filter((request) => request.type === typeFilter);
    }
    
    if (statusFilter !== 'todos') {
      result = result.filter((request) => request.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((request) => {
        if (
          request.userName.toLowerCase().includes(query) ||
          request.userEmail.toLowerCase().includes(query)
        ) {
          return true;
        }
        
        if (request.type === "Compra") {
          return (
            request.items.some((item) => item.name.toLowerCase().includes(query)) ||
            request.purpose.toLowerCase().includes(query)
          );
        } else if (request.type === "Suporte") {
          return (
            request.location.toLowerCase().includes(query) ||
            request.category.toLowerCase().includes(query) ||
            request.description.toLowerCase().includes(query)
          );
        } else if (request.type === "Reserva") {
          return (
            request.equipment.some(eq => eq.equipmentName.toLowerCase().includes(query)) ||
            request.location.toLowerCase().includes(query) ||
            request.purpose.toLowerCase().includes(query)
          );
        }
        return false;
      });
    }
    
    setFilteredRequests(result);
  }, [requests, typeFilter, statusFilter, searchQuery]);
  
  const handleOpenDetails = (request: Request) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };
  
  const handleStatusChange = (status: RequestStatus) => {
    if (!selectedRequest) return;
    
    setNewStatus(status);
    setStatusUpdateConfirmOpen(true);
  };
  
  const confirmStatusChange = async () => {
    if (!selectedRequest || !newStatus || !user) return;
    
    try {
      await updateRequestStatus(selectedRequest.id!, newStatus, user.email!);
      
      const updatedRequests = requests.map(req => 
        req.id === selectedRequest.id 
          ? { ...req, status: newStatus } 
          : req
      );
      
      if (!showCompleted && (newStatus === "Concluida" || newStatus === "Cancelado")) {
        setRequests(updatedRequests.filter(req => 
          req.id !== selectedRequest.id
        ));
      } else {
        setRequests(updatedRequests);
      }
      
      setSelectedRequest({
        ...selectedRequest,
        status: newStatus,
      });
      
      setStatusUpdateConfirmOpen(false);
      
      toast({
        title: "Status atualizado",
        description: `A solicitação foi atualizada para "${newStatus}".`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = async () => {
    if (!selectedRequest) return;
    
    try {
      await deleteRequest(selectedRequest.id!);
      
      setRequests(requests.filter(req => req.id !== selectedRequest.id));
      
      setIsDetailsOpen(false);
      setDeleteConfirmOpen(false);
      
      toast({
        title: "Solicitação excluída",
        description: "A solicitação foi excluída permanentemente.",
      });
    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a solicitação.",
        variant: "destructive",
      });
    }
  };
  
  const handleSendMessage = async (message: string) => {
    if (!selectedRequest || !user) return;
    
    try {
      await addChatMessage(
        selectedRequest.id!,
        user.uid,
        user.displayName || user.email!,
        message
      );
      
      const newMessage = {
        userId: user.uid,
        userName: user.displayName || user.email!,
        message,
        timestamp: new Date(),
      };
      
      const updatedRequest = {
        ...selectedRequest,
        chat: [...(selectedRequest.chat || []), newMessage],
      };
      
      setSelectedRequest(updatedRequest);
      
      const updatedRequests = requests.map(req => 
        req.id === selectedRequest.id ? updatedRequest : req
      );
      
      setRequests(updatedRequests);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    }
  };
  
  const renderRequestDetails = (request: Request) => {
    if (!request) return null;
    
    let detailsContent;
    
    if (request.type === "Compra") {
      detailsContent = (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Itens</h3>
            <div className="mt-2 border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-right">Valor Unitário</th>
                    <th className="px-4 py-2 text-right">Quantidade</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {request.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2 text-right">
                        R$ {item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">
                        R$ {(item.unitPrice * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium">
                      Total:
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      R$ {request.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium">Finalidade</h3>
            <p className="mt-1 text-gray-700">{request.purpose}</p>
          </div>
          
          {request.purchaseLink && (
            <div>
              <h3 className="font-medium">Link de Compra</h3>
              <a 
                href={request.purchaseLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-eccos-blue hover:underline block truncate"
              >
                {request.purchaseLink}
              </a>
            </div>
          )}
        </div>
      );
    } else if (request.type === "Suporte") {
      detailsContent = (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Unidade</h3>
              <p className="mt-1 text-gray-700">{request.unit}</p>
            </div>
            <div>
              <h3 className="font-medium">Local</h3>
              <p className="mt-1 text-gray-700">{request.location}</p>
            </div>
            <div>
              <h3 className="font-medium">Categoria</h3>
              <p className="mt-1 text-gray-700">{request.category}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium">Descrição</h3>
            <p className="mt-1 text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>
        </div>
      );
    } else if (request.type === "Reserva") {
      detailsContent = (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Equipamento</h3>
              <p className="mt-1 text-gray-700">
                {request.equipment.map((eq, index) => (
                  <span key={eq.equipmentId}>
                    {eq.equipmentName} ({eq.equipmentType})
                    {index < request.equipment.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            </div>
            <div>
              <h3 className="font-medium">Data</h3>
              <p className="mt-1 text-gray-700">
                {format(request.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div>
              <h3 className="font-medium">Horário</h3>
              <p className="mt-1 text-gray-700">
                {request.startTime} às {request.endTime}
              </p>
            </div>
            <div>
              <h3 className="font-medium">Local de Uso</h3>
              <p className="mt-1 text-gray-700">{request.location}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium">Finalidade</h3>
            <p className="mt-1 text-gray-700">{request.purpose}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold">Detalhes da Solicitação</h2>
            <p className="text-sm text-gray-500">
              Solicitado por {request.userName} ({request.userEmail})
            </p>
            <p className="text-sm text-gray-500">
              Criada em {format(request.createdAt, "dd/MM/yyyy 'às' HH:mm")}
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <Select 
              value={request.status} 
              onValueChange={(value) => handleStatusChange(value as RequestStatus)}
            >
              <SelectTrigger className="min-w-[180px]">
                <RequestStatusBadge status={request.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Reprovado">Reprovado</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluida">Concluída</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {detailsContent}
        
        <div className="border-t pt-4">
          <Chat
            messages={request.chat || []}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    );
  };
  
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Administração de Solicitações</h1>
            <p className="text-gray-500">
              Gerencie todas as solicitações dos usuários
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <CardTitle>Solicitações</CardTitle>
                <CardDescription>
                  Visualize e gerencie as solicitações
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as RequestType | "todos")}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="Compra">Compra</SelectItem>
                      <SelectItem value="Suporte">Suporte</SelectItem>
                      <SelectItem value="Reserva">Reserva</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequestStatus | "todos")}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Aprovado">Aprovado</SelectItem>
                      <SelectItem value="Reprovado">Reprovado</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Concluida">Concluída</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Pesquisar..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <Switch
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
              />
              <label htmlFor="show-completed" className="text-sm">
                Mostrar todas as solicitações (incluindo concluídas e canceladas)
              </label>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="lista" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="lista">Lista</TabsTrigger>
                <TabsTrigger value="cards">Cards</TabsTrigger>
              </TabsList>
              
              <TabsContent value="lista">
                {isLoading ? (
                  <div className="py-8">
                    <LoadingSpinner />
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma solicitação encontrada.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">Solicitante</th>
                          <th className="pb-2 font-medium">Tipo</th>
                          <th className="pb-2 font-medium">Data</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="py-3">{request.userName}</td>
                            <td className="py-3">{request.type}</td>
                            <td className="py-3">
                              {format(request.createdAt, "dd/MM/yyyy")}
                            </td>
                            <td className="py-3">
                              <RequestStatusBadge status={request.status} />
                            </td>
                            <td className="py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleOpenDetails(request)}>
                                    <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedRequest(request);
                                    setNewStatus("Aprovado");
                                    setStatusUpdateConfirmOpen(true);
                                  }}>
                                    <Check className="mr-2 h-4 w-4" /> Aprovar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setDeleteConfirmOpen(true);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="cards">
                {isLoading ? (
                  <div className="py-8">
                    <LoadingSpinner />
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma solicitação encontrada.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRequests.map((request) => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{request.type}</CardTitle>
                            <RequestStatusBadge status={request.status} />
                          </div>
                          <CardDescription>
                            {format(request.createdAt, "dd/MM/yyyy")} - {request.userName}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {request.type === "Compra" && (
                            <p className="truncate text-sm">
                              {request.items.length} {request.items.length === 1 ? "item" : "itens"} - 
                              R$ {request.totalPrice.toFixed(2)}
                            </p>
                          )}
                          {request.type === "Suporte" && (
                            <p className="truncate text-sm">
                              {request.category} - {request.location}
                            </p>
                          )}
                          {request.type === "Reserva" && (
                            <p className="truncate text-sm">
                              {request.equipment[0].equipmentName} {request.equipment.length > 1 ? `(+${request.equipment.length - 1})` : ''} - {format(request.date, "dd/MM/yyyy")}
                            </p>
                          )}
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleOpenDetails(request)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> Detalhes
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedRequest(request);
                                setNewStatus("Aprovado");
                                setStatusUpdateConfirmOpen(true);
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" /> Aprovar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      <AlertDialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && renderRequestDetails(selectedRequest)}
        </AlertDialogContent>
      </AlertDialog>
      
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir Solicitação"
        description="Tem certeza que deseja excluir esta solicitação permanentemente? Esta ação não poderá ser desfeita."
        confirmText="Sim, excluir"
        cancelText="Não, cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
      
      <ConfirmationDialog
        open={statusUpdateConfirmOpen}
        onOpenChange={setStatusUpdateConfirmOpen}
        title="Atualizar Status"
        description={`Deseja alterar o status da solicitação para "${newStatus}"?${newStatus === "Aprovado" || newStatus === "Reprovado" ? " O solicitante será notificado por email." : ""}`}
        confirmText="Sim, atualizar"
        cancelText="Não, cancelar"
        onConfirm={confirmStatusChange}
      />
    </>
  );
};

export default AdminRequests;
