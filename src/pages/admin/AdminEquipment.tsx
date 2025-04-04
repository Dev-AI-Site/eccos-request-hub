
import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useToast } from "@/hooks/use-toast";
import { Equipment, EquipmentType, addEquipment, deleteEquipment, getAllEquipment } from "@/lib/equipmentService";
import { Filter, Plus, Search, Trash2 } from "lucide-react";

const AdminEquipment = () => {
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [newEquipmentType, setNewEquipmentType] = useState<EquipmentType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter state
  const [typeFilter, setTypeFilter] = useState<EquipmentType | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Confirm dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  
  // Fetch equipment
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setIsLoading(true);
        const allEquipment = await getAllEquipment();
        setEquipment(allEquipment);
        setFilteredEquipment(allEquipment);
      } catch (error) {
        console.error("Error fetching equipment:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os equipamentos.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEquipment();
  }, [toast]);
  
  // Apply filters
  useEffect(() => {
    let result = [...equipment];
    
    if (typeFilter) {
      result = result.filter((eq) => eq.type === typeFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((eq) => eq.name.toLowerCase().includes(query));
    }
    
    setFilteredEquipment(result);
  }, [equipment, typeFilter, searchQuery]);
  
  const handleAddEquipment = async () => {
    if (!newEquipmentName.trim() || !newEquipmentType) {
      toast({
        title: "Campos incompletos",
        description: "Preencha o nome e o tipo do equipamento.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const newEquipment: Omit<Equipment, "id"> = {
        name: newEquipmentName.trim(),
        type: newEquipmentType as EquipmentType,
        isAvailable: true,
      };
      
      const id = await addEquipment(newEquipment);
      
      // Update local state
      setEquipment([...equipment, { ...newEquipment, id }]);
      
      // Reset form
      setNewEquipmentName("");
      setNewEquipmentType("");
      
      toast({
        title: "Equipamento adicionado",
        description: "O equipamento foi adicionado com sucesso.",
      });
    } catch (error) {
      console.error("Error adding equipment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o equipamento.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteEquipment = async () => {
    if (!equipmentToDelete) return;
    
    try {
      await deleteEquipment(equipmentToDelete.id!);
      
      // Update local state
      setEquipment(equipment.filter(eq => eq.id !== equipmentToDelete.id));
      
      setDeleteConfirmOpen(false);
      setEquipmentToDelete(null);
      
      toast({
        title: "Equipamento excluído",
        description: "O equipamento foi excluído com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting equipment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o equipamento.",
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
            <h1 className="text-2xl font-bold">Administração de Equipamentos</h1>
            <p className="text-gray-500">
              Gerencie os equipamentos disponíveis para reserva
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Equipamento</CardTitle>
                <CardDescription>
                  Cadastre um novo equipamento para reserva
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="equipment-name">Nome do Equipamento</Label>
                  <Input
                    id="equipment-name"
                    placeholder="Ex: Chromebook 01"
                    value={newEquipmentName}
                    onChange={(e) => setNewEquipmentName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="equipment-type">Tipo de Equipamento</Label>
                  <Select 
                    value={newEquipmentType} 
                    onValueChange={(value) => setNewEquipmentType(value as EquipmentType)}
                  >
                    <SelectTrigger id="equipment-type" className="mt-1">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chromebook">Chromebook</SelectItem>
                      <SelectItem value="iPad">iPad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleAddEquipment}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Equipamento
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle>Equipamentos Cadastrados</CardTitle>
                    <CardDescription>
                      Lista de todos os equipamentos disponíveis
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as EquipmentType | "")}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os tipos</SelectItem>
                        <SelectItem value="Chromebook">Chromebook</SelectItem>
                        <SelectItem value="iPad">iPad</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="search"
                        placeholder="Buscar por nome..."
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
                ) : filteredEquipment.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum equipamento encontrado.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredEquipment.map((eq) => (
                      <div
                        key={eq.id}
                        className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                      >
                        <div>
                          <h3 className="font-medium">{eq.name}</h3>
                          <p className="text-sm text-gray-500">{eq.type}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEquipmentToDelete(eq);
                            setDeleteConfirmOpen(true);
                          }}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
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
      
      {/* Confirm Delete Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir Equipamento"
        description={`Tem certeza que deseja excluir o equipamento "${equipmentToDelete?.name}"? Esta ação não poderá ser desfeita.`}
        confirmText="Sim, excluir"
        cancelText="Não, cancelar"
        onConfirm={handleDeleteEquipment}
        variant="destructive"
      />
    </>
  );
};

export default AdminEquipment;
