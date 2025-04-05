import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import RequestStatusBadge from "@/components/RequestStatusBadge";
import Chat from "@/components/Chat";
import { Request, RequestStatus, RequestType, addChatMessage, getUserRequests, updateRequestStatus } from "@/lib/requestService";
import { FileText, Package, Filter, Search, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/Header";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<RequestType | "todos">('todos');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "todos">('todos');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const userRequests = await getUserRequests(user.uid);
        setRequests(userRequests);
        setFilteredRequests(userRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas solicitações.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [user, toast]);

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

  const handleCancelRequest = async () => {
    if (!selectedRequest || !user) return;

    try {
      await updateRequestStatus(selectedRequest.id!, "Cancelado", user.email!);
      
      const updatedRequests = requests.map(req => 
        req.id === selectedRequest.id 
          ? { ...req, status: "Cancelado" as RequestStatus } 
          : req
      );
      
      setRequests(updatedRequests.filter(req => req.status !== "Cancelado"));
      setIsDetailsOpen(false);
      setDeleteConfirmOpen(false);
      
      toast({
        title: "Solicitação cancelada",
        description: "Sua solicitação foi cancelada com sucesso.",
      });
    } catch (error) {
      console.error("Error canceling request:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a solicitação.",
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Detalhes da Solicitação</h2>
            <p className="text-sm text-gray-500">
              Criada em {format(request.createdAt, "dd/MM/yyyy 'às' HH:mm")}
            </p>
          </div>
          <RequestStatusBadge status={request.status} />
        </div>

        {detailsContent}

        <div className="border-t pt-4">
          <Chat
            messages={request.chat || []}
            onSendMessage={handleSendMessage}
          />
        </div>

        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={request.status === "Cancelado"}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Cancelar Solicitação
          </Button>
        </div>
      </div>
    );
  };

  const renderRequestTypeIcon = (type: RequestType) => {
    switch (type) {
      case "Compra":
        return <Package className="h-5 w-5 text-green-500" />;
      case "Suporte":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "Reserva":
        return <FileText className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500">
              Gerencie todas as suas solicitações
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Link to="/reserva">
              <Button>Nova Reserva</Button>
            </Link>
            <Link to="/compra">
              <Button>Nova Compra</Button>
            </Link>
            <Link to="/suporte">
              <Button>Novo Suporte</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <CardTitle>Minhas Solicitações</CardTitle>
                <CardDescription>
                  Visualize e gerencie suas solicitações
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
                          <th className="pb-2 font-medium">Tipo</th>
                          <th className="pb-2 font-medium">Data</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="py-3 flex items-center">
                              {renderRequestTypeIcon(request.type)}
                              <span className="ml-2">{request.type}</span>
                            </td>
                            <td className="py-3">
                              {format(request.createdAt, "dd/MM/yyyy")}
                            </td>
                            <td className="py-3">
                              <RequestStatusBadge status={request.status} />
                            </td>
                            <td className="py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDetails(request)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> Detalhes
                              </Button>
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
                            <div className="flex items-center">
                              {renderRequestTypeIcon(request.type)}
                              <CardTitle className="ml-2 text-lg">{request.type}</CardTitle>
                            </div>
                            <RequestStatusBadge status={request.status} />
                          </div>
                          <CardDescription>
                            {format(request.createdAt, "dd/MM/yyyy")}
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-4"
                            onClick={() => handleOpenDetails(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> Ver Detalhes
                          </Button>
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
        title="Cancelar Solicitação"
        description="Tem certeza que deseja cancelar esta solicitação? Esta ação não poderá ser desfeita."
        confirmText="Sim, cancelar"
        cancelText="Não, manter"
        onConfirm={handleCancelRequest}
        variant="destructive"
      />
    </>
  );
};

export default Dashboard;
