
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Trash2, Plus, CalendarRange } from "lucide-react";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AvailabilityDate, addAvailableDates, getAvailableDates, removeAvailableDate } from "@/lib/availabilityService";

const AdminAvailability = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState<AvailabilityDate[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<AvailabilityDate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    // Verificar se é admin
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    
    const fetchDates = async () => {
      try {
        setIsLoading(true);
        const dates = await getAvailableDates();
        setAvailableDates(dates);
      } catch (error) {
        console.error("Error fetching dates:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as datas disponíveis.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDates();
  }, [navigate, isAdmin, toast]);
  
  const handleAddDates = async () => {
    if (!selectedDates || selectedDates.length === 0) {
      toast({
        title: "Seleção necessária",
        description: "Por favor, selecione pelo menos uma data.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Verificar por datas que já estão disponíveis
      const existingDates = availableDates.map(d => d.date.setHours(0, 0, 0, 0));
      const newDates = selectedDates.filter(d => !existingDates.includes(new Date(d).setHours(0, 0, 0, 0)));
      
      if (newDates.length === 0) {
        toast({
          title: "Datas já disponíveis",
          description: "Todas as datas selecionadas já estão disponíveis.",
          variant: "warning",
        });
        setIsSubmitting(false);
        return;
      }
      
      await addAvailableDates(newDates);
      
      // Atualizar a lista
      const updatedDates = await getAvailableDates();
      setAvailableDates(updatedDates);
      
      toast({
        title: "Datas adicionadas",
        description: `${newDates.length} nova(s) data(s) adicionada(s) com sucesso.`,
      });
      
      setSelectedDates([]); // Limpar seleção
    } catch (error) {
      console.error("Error adding dates:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar as datas.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!dateToDelete) return;
    
    try {
      setIsSubmitting(true);
      await removeAvailableDate(dateToDelete.id!);
      
      // Atualizar a lista
      setAvailableDates(availableDates.filter(d => d.id !== dateToDelete.id));
      
      toast({
        title: "Data removida",
        description: "A data foi removida da disponibilidade com sucesso.",
      });
    } catch (error) {
      console.error("Error removing date:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a data.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setConfirmDeleteOpen(false);
      setDateToDelete(null);
    }
  };
  
  const handleDeleteDate = (date: AvailabilityDate) => {
    setDateToDelete(date);
    setConfirmDeleteOpen(true);
  };
  
  const sortedDates = [...availableDates].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }
  
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-eccos-blue">Gerenciar Disponibilidade</h1>
            <p className="text-gray-500">Controle as datas disponíveis para reserva de equipamentos da Tecnologia ECCOS</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button
              onClick={() => navigate("/admin/equipamentos")}
              variant="outline"
              className="border-eccos-blue/20 hover:border-eccos-blue/50 hover:bg-eccos-blue/5 transition-colors"
            >
              Gerenciar Equipamentos
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <Card className="border-eccos-blue/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-eccos-blue flex items-center gap-2">
                  <CalendarRange className="h-5 w-5" />
                  Adicionar Datas Disponíveis
                </CardTitle>
                <CardDescription>
                  Selecione uma ou mais datas para disponibilizar para reservas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={setSelectedDates}
                  className="rounded-md border shadow p-3"
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleAddDates} 
                  disabled={isSubmitting || !selectedDates || selectedDates.length === 0}
                  className="w-full bg-eccos-blue hover:bg-eccos-darkBlue transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar {selectedDates && selectedDates.length > 0 ? `(${selectedDates.length})` : ""} Data{selectedDates && selectedDates.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="lg:col-span-7">
            <Card className="border-eccos-blue/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-eccos-blue">Datas Disponíveis</CardTitle>
                <CardDescription>
                  {sortedDates.length} data{sortedDates.length !== 1 ? "s" : ""} disponíve{sortedDates.length !== 1 ? "is" : "l"} para reserva
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="list" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="list" className="data-[state=active]:bg-eccos-blue data-[state=active]:text-white">Lista</TabsTrigger>
                    <TabsTrigger value="calendar" className="data-[state=active]:bg-eccos-blue data-[state=active]:text-white">Calendário</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="list" className="animate-slide-in">
                    {sortedDates.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Nenhuma data disponível.</p>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedDates.map((date) => (
                              <TableRow key={date.id} className="hover:bg-eccos-blue/5 transition-colors">
                                <TableCell className="font-medium">
                                  {format(date.date, "dd 'de' MMMM 'de' yyyy", {
                                    locale: ptBR,
                                  })}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "bg-emerald-50 text-emerald-700 border-emerald-200",
                                      !date.isAvailable && "bg-red-50 text-red-700 border-red-200"
                                    )}
                                  >
                                    {date.isAvailable ? "Disponível" : "Indisponível"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteDate(date)}
                                    className="hover:bg-red-50 hover:text-red-700 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="calendar" className="animate-slide-in">
                    <div className="rounded-md border p-4">
                      <Calendar
                        mode="single"
                        onSelect={() => {}}
                        selected={undefined}
                        modifiers={{
                          available: sortedDates.map(d => d.date),
                        }}
                        modifiersStyles={{
                          available: {
                            backgroundColor: "rgba(62, 123, 246, 0.1)",
                            color: "#0046AD",
                            fontWeight: "bold",
                            border: "1px solid rgba(62, 123, 246, 0.5)",
                            borderRadius: "4px",
                          },
                        }}
                        className="w-full"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <ConfirmationDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Remover Data"
        description={
          dateToDelete
            ? `Tem certeza que deseja remover o dia ${format(
                dateToDelete.date,
                "dd/MM/yyyy"
              )} da disponibilidade? Esta ação não pode ser desfeita.`
            : "Tem certeza que deseja remover esta data?"
        }
        confirmText="Sim, remover"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default AdminAvailability;
