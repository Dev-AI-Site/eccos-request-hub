
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon, Filter, Laptop, Tablet, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Equipment, getAllEquipment, getEquipmentByType } from "@/lib/equipmentService";
import { getAvailableDates, isDateAvailable } from "@/lib/availabilityService";
import { EquipmentType, ReservationEquipment, ReservationRequest, createRequest } from "@/lib/requestService";

const locations = [
  'Recepção',
  'Secretaria',
  'Sala de atendimento',
  'Sala de atendimento (Laranja)',
  'Sala de auxiliar de coordenação fundamental 1',
  'Sala de oficinas',
  'Sala de música',
  'Sala de science',
  'Integral',
  '4º Ano',
  'Patio (Cantina)',
  'Refeitório',
  'Biblioteca (Inferior)',
  '3º Ano',
  '2º Ano',
  '1º Ano',
  'Sala dos professores',
  'Sala de Linguas',
  'Coordenação de linguas/Fundamental 2',
  'Sala de artes',
  'Coordenação Fundamental 1 / Coordenação de matemática',
  '8º ano',
  '7º Ano',
  'Apoio pedagógico',
  'Orientação educacional',
  'TI',
  'Sala de oficinas (Piso superior)',
  '5º Ano',
  '6º Ano',
  'Biblioteca (Superior)',
  'Sala de convivência',
  '9º Ano'
];

const ReservationForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<EquipmentType | "todos">("todos");
  const [equipmentNameFilter, setEquipmentNameFilter] = useState("");
  
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [purpose, setPurpose] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (!user) {
          throw new Error("Usuário não autenticado");
        }
        
        const [equipment, dates] = await Promise.all([
          getAllEquipment(),
          getAvailableDates(),
        ]);
        
        setEquipmentList(equipment);
        setFilteredEquipment(equipment);
        setAvailableDates(dates.map(d => d.date));
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados necessários. Por favor, faça login novamente.",
          variant: "destructive",
        });
        if (error instanceof Error && error.message.includes("autenticado")) {
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast, navigate, user]);
  
  useEffect(() => {
    let filtered = [...equipmentList];
    
    if (equipmentTypeFilter && equipmentTypeFilter !== "todos") {
      filtered = filtered.filter(eq => eq.type === equipmentTypeFilter);
    }
    
    if (equipmentNameFilter) {
      const query = equipmentNameFilter.toLowerCase();
      filtered = filtered.filter(eq => eq.name.toLowerCase().includes(query));
    }
    
    setFilteredEquipment(filtered);
  }, [equipmentList, equipmentTypeFilter, equipmentNameFilter]);
  
  const handleEquipmentSelect = (equipment: Equipment) => {
    if (selectedEquipments.some(eq => eq.id === equipment.id)) {
      // Se já estiver selecionado, remova
      setSelectedEquipments(selectedEquipments.filter(eq => eq.id !== equipment.id));
    } else {
      // Adicione à seleção
      setSelectedEquipments([...selectedEquipments, equipment]);
    }
  };
  
  const removeSelectedEquipment = (equipmentId: string) => {
    setSelectedEquipments(selectedEquipments.filter(eq => eq.id !== equipmentId));
  };
  
  const validateForm = () => {
    if (selectedEquipments.length === 0) {
      toast({
        title: "Equipamento não selecionado",
        description: "Por favor, selecione pelo menos um equipamento.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!selectedDate) {
      toast({
        title: "Data não selecionada",
        description: "Por favor, selecione uma data disponível.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!startTime || !endTime) {
      toast({
        title: "Horário incompleto",
        description: "Por favor, defina o horário de início e término.",
        variant: "destructive",
      });
      return false;
    }
    
    if (startTime >= endTime) {
      toast({
        title: "Horário inválido",
        description: "O horário de início deve ser anterior ao término.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!location) {
      toast({
        title: "Local não selecionado",
        description: "Por favor, selecione o local de uso.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!purpose) {
      toast({
        title: "Finalidade não informada",
        description: "Por favor, informe a finalidade da reserva.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm() || !user || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const dateAvailable = await isDateAvailable(selectedDate!);
      
      if (!dateAvailable) {
        toast({
          title: "Data indisponível",
          description: "A data selecionada não está mais disponível.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Prepare equipment array for the request
      const equipment: ReservationEquipment[] = selectedEquipments.map(eq => ({
        equipmentId: eq.id!,
        equipmentName: eq.name,
        equipmentType: eq.type,
      }));
      
      const reservationData: Omit<ReservationRequest, "id" | "createdAt" | "updatedAt" | "chat"> = {
        userId: user.uid,
        userName: user.displayName || user.email!,
        userEmail: user.email!,
        type: "Reserva",
        status: "Pendente",
        equipment, // Array de equipamentos
        date: selectedDate!,
        startTime,
        endTime,
        location,
        purpose
      };
      
      await createRequest(reservationData);
      
      toast({
        title: "Reserva enviada",
        description: "Sua solicitação de reserva foi enviada com sucesso!",
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a reserva. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1 text-eccos-blue">Nova Reserva</h1>
          <p className="text-gray-500 mb-6">
            Preencha os campos abaixo para solicitar a reserva de equipamentos da Tecnologia ECCOS
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <Card className="border-eccos-blue/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-eccos-blue">Selecione os Equipamentos</CardTitle>
                  <CardDescription>
                    Escolha um ou mais equipamentos disponíveis para reserva
                  </CardDescription>
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Select value={equipmentTypeFilter} onValueChange={(value) => setEquipmentTypeFilter(value as EquipmentType | "todos")}>
                      <SelectTrigger className="bg-white border-eccos-blue/20 hover:border-eccos-blue/50 transition-colors">
                        <Filter className="mr-2 h-4 w-4 text-eccos-blue" />
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os tipos</SelectItem>
                        <SelectItem value="Chromebook">Chromebook</SelectItem>
                        <SelectItem value="iPad">iPad</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      placeholder="Buscar por nome..."
                      value={equipmentNameFilter}
                      onChange={(e) => setEquipmentNameFilter(e.target.value)}
                      className="border-eccos-blue/20 focus-visible:ring-eccos-blue/30"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedEquipments.length > 0 && (
                    <div className="mb-4 p-3 bg-eccos-blue/5 rounded-md border border-eccos-blue/20">
                      <p className="font-medium text-sm mb-2 text-eccos-blue">Equipamentos selecionados:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEquipments.map(equipment => (
                          <Badge 
                            key={equipment.id} 
                            variant="outline" 
                            className="flex items-center gap-1 pl-2 bg-white border-eccos-blue/30 text-eccos-blue hover:bg-eccos-blue/10 transition-colors"
                          >
                            {equipment.type === "Chromebook" ? <Laptop className="h-3 w-3" /> : <Tablet className="h-3 w-3" />}
                            {equipment.name}
                            <button 
                              onClick={() => removeSelectedEquipment(equipment.id!)}
                              className="ml-1 rounded-full hover:bg-eccos-blue/20 p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {filteredEquipment.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Nenhum equipamento disponível com os filtros atuais.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                      {filteredEquipment.map((equipment) => (
                        <div
                          key={equipment.id}
                          className={cn(
                            "border rounded-md p-3 cursor-pointer transition-all hover:shadow-md",
                            selectedEquipments.some(eq => eq.id === equipment.id)
                              ? "border-eccos-blue bg-eccos-blue/5"
                              : "hover:border-eccos-blue/50"
                          )}
                          onClick={() => handleEquipmentSelect(equipment)}
                        >
                          <div className="flex items-center">
                            <Checkbox 
                              checked={selectedEquipments.some(eq => eq.id === equipment.id)}
                              className="mr-2 border-eccos-blue/50 data-[state=checked]:bg-eccos-blue" 
                              onCheckedChange={() => {}} // Handled by the parent div click
                            />
                            <div>
                              <div className="font-medium">{equipment.name}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                {equipment.type === "Chromebook" ? 
                                  <Laptop className="h-3 w-3 mr-1" /> : 
                                  <Tablet className="h-3 w-3 mr-1" />
                                }
                                {equipment.type}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-7">
              <Card className="border-eccos-blue/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-eccos-blue">Detalhes da Reserva</CardTitle>
                  <CardDescription>
                    Informe quando e onde você utilizará os equipamentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="date" className="text-eccos-blue">Data de Uso</Label>
                    <div className="mt-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal border-eccos-blue/20 hover:border-eccos-blue/50 transition-colors",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-eccos-blue" />
                            {selectedDate ? (
                              format(selectedDate, "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                              })
                            ) : (
                              <span>Selecione uma data disponível</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              
                              if (date < today) return true;
                              
                              return !availableDates.some(avDate => {
                                const avDay = new Date(avDate);
                                avDay.setHours(0, 0, 0, 0);
                                return avDay.getTime() === date.getTime();
                              });
                            }}
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime" className="text-eccos-blue">Hora Inicial</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-1 border-eccos-blue/20 focus-visible:ring-eccos-blue/30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime" className="text-eccos-blue">Hora Final</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-1 border-eccos-blue/20 focus-visible:ring-eccos-blue/30"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="location" className="text-eccos-blue">Local de Uso</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger 
                        id="location" 
                        className="mt-1 bg-white border-eccos-blue/20 hover:border-eccos-blue/50 transition-colors"
                      >
                        <SelectValue placeholder="Selecione o local" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="purpose" className="text-eccos-blue">Finalidade do Uso</Label>
                    <Textarea
                      id="purpose"
                      placeholder="Descreva a finalidade da reserva"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="mt-1 min-h-[100px] resize-none border-eccos-blue/20 focus-visible:ring-eccos-blue/30"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="border-eccos-blue/20 hover:border-eccos-blue/50 hover:bg-eccos-blue/5 transition-colors"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => setConfirmDialogOpen(true)} 
                    disabled={isSubmitting}
                    className="bg-eccos-blue hover:bg-eccos-darkBlue transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Enviando...
                      </>
                    ) : (
                      "Solicitar Reserva"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Confirmar Reserva"
        description="Deseja confirmar a solicitação de reserva? Um administrador precisará revisar e aprovar sua solicitação."
        confirmText="Sim, solicitar"
        cancelText="Não, revisar"
        onConfirm={handleSubmit}
      />
    </>
  );
};

export default ReservationForm;
