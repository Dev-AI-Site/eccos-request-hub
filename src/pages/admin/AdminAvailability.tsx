
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useToast } from "@/hooks/use-toast";
import { AvailabilityDate, addAvailableDate, getAvailableDates, removeAvailableDate } from "@/lib/availabilityService";
import { CalendarX2, Check } from "lucide-react";

const AdminAvailability = () => {
  const { toast } = useToast();
  const [availableDates, setAvailableDates] = useState<AvailabilityDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [dateToRemove, setDateToRemove] = useState<AvailabilityDate | null>(null);
  
  // Fetch available dates
  useEffect(() => {
    const fetchDates = async () => {
      try {
        setIsLoading(true);
        const dates = await getAvailableDates();
        setAvailableDates(dates);
      } catch (error) {
        console.error("Error fetching available dates:", error);
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
  }, [toast]);
  
  const handleAddDate = async () => {
    if (!selectedDate) return;
    
    try {
      // Check if date already exists
      const dateExists = availableDates.some(d => {
        const existingDate = new Date(d.date);
        existingDate.setHours(0, 0, 0, 0);
        
        const newDate = new Date(selectedDate);
        newDate.setHours(0, 0, 0, 0);
        
        return existingDate.getTime() === newDate.getTime();
      });
      
      if (dateExists) {
        toast({
          title: "Data já disponível",
          description: "Esta data já está marcada como disponível.",
          variant: "destructive",
        });
        return;
      }
      
      const id = await addAvailableDate(selectedDate);
      
      // Update local state
      setAvailableDates([...availableDates, { id, date: selectedDate, isAvailable: true }]);
      
      setConfirmAddOpen(false);
      
      toast({
        title: "Data adicionada",
        description: "A data foi marcada como disponível com sucesso.",
      });
    } catch (error) {
      console.error("Error adding available date:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a data.",
        variant: "destructive",
      });
    }
  };
  
  const handleRemoveDate = async () => {
    if (!dateToRemove) return;
    
    try {
      await removeAvailableDate(dateToRemove.id!);
      
      // Update local state
      setAvailableDates(availableDates.filter(d => d.id !== dateToRemove.id));
      
      setConfirmRemoveOpen(false);
      setDateToRemove(null);
      
      toast({
        title: "Data removida",
        description: "A data foi removida com sucesso.",
      });
    } catch (error) {
      console.error("Error removing available date:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a data.",
        variant: "destructive",
      });
    }
  };
  
  // Transform dates for calendar
  const availableDatesArray = availableDates.map(d => new Date(d.date));
  
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Administração de Disponibilidade</h1>
            <p className="text-gray-500">
              Gerencie as datas disponíveis para reservas
            </p>
          </div>
          
          <Button
            onClick={() => {
              if (selectedDate) {
                setConfirmAddOpen(true);
              } else {
                toast({
                  title: "Data não selecionada",
                  description: "Selecione uma data no calendário primeiro.",
                  variant: "destructive",
                });
              }
            }}
          >
            <Check className="mr-2 h-4 w-4" />
            Marcar Data como Disponível
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle>Calendário</CardTitle>
                <CardDescription>
                  Selecione as datas para marcar como disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{
                      available: availableDatesArray,
                    }}
                    modifiersStyles={{
                      available: {
                        backgroundColor: "#e6f7ff",
                        color: "#0046AD",
                        fontWeight: "bold",
                      },
                    }}
                    className="p-0"
                    disabled={(date) => {
                      // Disable past dates
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle>Datas Disponíveis</CardTitle>
                <CardDescription>
                  Datas marcadas como disponíveis para reserva
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8">
                    <LoadingSpinner />
                  </div>
                ) : availableDates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Nenhuma data disponível. Selecione uma data no calendário e clique em "Marcar Data como Disponível".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {[...availableDates]
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((availableDate) => (
                        <div
                          key={availableDate.id}
                          className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                        >
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-blue-50 text-eccos-blue">
                              Disponível
                            </Badge>
                            <span className="ml-3">
                              {format(new Date(availableDate.date), "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDateToRemove(availableDate);
                              setConfirmRemoveOpen(true);
                            }}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <CalendarX2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Confirm Add Dialog */}
      <ConfirmationDialog
        open={confirmAddOpen}
        onOpenChange={setConfirmAddOpen}
        title="Marcar Data como Disponível"
        description={`Deseja marcar ${selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""} como disponível para reservas?`}
        confirmText="Sim, marcar"
        cancelText="Não, cancelar"
        onConfirm={handleAddDate}
      />
      
      {/* Confirm Remove Dialog */}
      <ConfirmationDialog
        open={confirmRemoveOpen}
        onOpenChange={setConfirmRemoveOpen}
        title="Remover Data Disponível"
        description={`Deseja remover ${dateToRemove ? format(new Date(dateToRemove.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""} da lista de datas disponíveis?`}
        confirmText="Sim, remover"
        cancelText="Não, cancelar"
        onConfirm={handleRemoveDate}
        variant="destructive"
      />
    </>
  );
};

export default AdminAvailability;
