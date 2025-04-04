
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useToast } from "@/hooks/use-toast";
import { SupportCategory, Unit, createRequest } from "@/lib/requestService";

// Locations by unit
const locationsByUnit: Record<Unit, string[]> = {
  'Berçário e Educação Infantil': [
    'Recepção',
    'Sala de reuniões',
    'Cozinha',
    'Pátio',
    'Sala de música',
    'Sala de science',
    'Berçário 2',
    'Berçário 3',
    'Refeitório',
    'Sala de movimento',
    'Pátio integral',
    'Infantil 1',
    'Infantil 2'
  ],
  'Fundamental': [
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
  ],
  'Anexo': [
    'Sala de manutenção',
    'Sala de reuniões',
    'Refeitório',
    'Cozinha',
    'Nutrição',
    'Controladoria',
    'Financeiro',
    'Operacional',
    'Mantenedoria'
  ]
};

const supportCategories: SupportCategory[] = [
  'Internet',
  'Notebook',
  'Projetor',
  'Som',
  'Outros'
];

const SupportForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [unit, setUnit] = useState<Unit | "">("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<SupportCategory | "">("");
  const [description, setDescription] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const validateForm = () => {
    if (!unit) {
      toast({
        title: "Unidade não selecionada",
        description: "Por favor, selecione a unidade.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!location) {
      toast({
        title: "Local não selecionado",
        description: "Por favor, selecione o local.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!category) {
      toast({
        title: "Categoria não selecionada",
        description: "Por favor, selecione a categoria da solicitação.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!description.trim()) {
      toast({
        title: "Descrição não informada",
        description: "Por favor, descreva o problema ou solicitação.",
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
      
      await createRequest({
        userId: user.uid,
        userName: user.displayName || user.email!,
        userEmail: user.email!,
        type: "Suporte",
        status: "Pendente",
        unit: unit as Unit,
        location,
        category: category as SupportCategory,
        description,
      });
      
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de suporte foi enviada com sucesso!",
      });
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating support request:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Nova Solicitação de Suporte</h1>
          <p className="text-gray-500 mb-6">
            Preencha os campos abaixo para solicitar suporte técnico
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Solicitação</CardTitle>
              <CardDescription>
                Informe a localização e o tipo de suporte necessário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="unit">Unidade</Label>
                <Select value={unit} onValueChange={(value) => {
                  setUnit(value as Unit);
                  setLocation(""); // Reset location when unit changes
                }}>
                  <SelectTrigger id="unit" className="mt-1">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Berçário e Educação Infantil">Berçário e Educação Infantil</SelectItem>
                    <SelectItem value="Fundamental">Fundamental</SelectItem>
                    <SelectItem value="Anexo">Anexo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="location">Local</Label>
                <Select 
                  value={location} 
                  onValueChange={setLocation}
                  disabled={!unit}
                >
                  <SelectTrigger id="location" className="mt-1">
                    <SelectValue placeholder={unit ? "Selecione o local" : "Selecione a unidade primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {unit && locationsByUnit[unit as Unit].map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as SupportCategory)}>
                  <SelectTrigger id="category" className="mt-1">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição da Solicitação</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente o problema ou a solicitação de suporte"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  rows={5}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Cancelar
              </Button>
              <Button onClick={() => setConfirmDialogOpen(true)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Solicitação"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Confirmar Solicitação"
        description="Deseja confirmar a solicitação de suporte? Um administrador precisará revisar e responder à sua solicitação."
        confirmText="Sim, enviar"
        cancelText="Não, revisar"
        onConfirm={handleSubmit}
      />
    </>
  );
};

export default SupportForm;
