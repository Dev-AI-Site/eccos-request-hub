import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useToast } from "@/hooks/use-toast";
import { PurchaseItem, createRequest, PurchaseRequest } from "@/lib/requestService";

const PurchaseForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [items, setItems] = useState<PurchaseItem[]>([
    { name: "", unitPrice: 0, quantity: 1 }
  ]);
  const [purpose, setPurpose] = useState("");
  const [purchaseLink, setPurchaseLink] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const handleAddItem = () => {
    setItems([...items, { name: "", unitPrice: 0, quantity: 1 }]);
  };
  
  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast({
        title: "Não é possível remover",
        description: "A solicitação deve ter pelo menos um item.",
        variant: "destructive",
      });
      return;
    }
    
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  
  const handleItemChange = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...items];
    
    if (field === "unitPrice" || field === "quantity") {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      newItems[index][field] = Math.max(0, isNaN(numValue) ? 0 : numValue);
    } else {
      newItems[index][field] = value as string;
    }
    
    setItems(newItems);
  };
  
  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  };
  
  const validateForm = () => {
    for (const item of items) {
      if (!item.name.trim()) {
        toast({
          title: "Item incompleto",
          description: "Preencha o nome de todos os itens.",
          variant: "destructive",
        });
        return false;
      }
      
      if (item.unitPrice <= 0) {
        toast({
          title: "Valor inválido",
          description: "O valor unitário deve ser maior que zero.",
          variant: "destructive",
        });
        return false;
      }
      
      if (item.quantity <= 0) {
        toast({
          title: "Quantidade inválida",
          description: "A quantidade deve ser maior que zero.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    if (!purpose.trim()) {
      toast({
        title: "Finalidade não informada",
        description: "Por favor, informe a finalidade da compra.",
        variant: "destructive",
      });
      return false;
    }
    
    if (purchaseLink.trim() && !isValidURL(purchaseLink)) {
      toast({
        title: "Link inválido",
        description: "O link de compra fornecido não é válido.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const isValidURL = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  const handleSubmit = async () => {
    if (!validateForm() || !user || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      await createRequest({
        userId: user.uid,
        userName: user.displayName || user.email!,
        userEmail: user.email!,
        type: "Compra",
        status: "Pendente",
        items: items,
        totalPrice: calculateTotal(),
        purpose,
        purchaseLink: purchaseLink.trim() || undefined,
      } as PurchaseRequest);
      
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de compra foi enviada com sucesso!",
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating purchase request:", error);
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Nova Solicitação de Compra</h1>
          <p className="text-gray-500 mb-6">
            Preencha os campos abaixo para solicitar uma compra
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>Itens de Compra</CardTitle>
              <CardDescription>
                Adicione os itens que deseja solicitar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4 p-4 border rounded-md bg-gray-50">
                    <div>
                      <Label htmlFor={`item-name-${index}`}>Nome do Item</Label>
                      <Input
                        id={`item-name-${index}`}
                        value={item.name}
                        onChange={(e) => handleItemChange(index, "name", e.target.value)}
                        placeholder="Ex: Notebook Dell Inspiron"
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`item-price-${index}`}>Valor Unitário (R$)</Label>
                        <Input
                          id={`item-price-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`item-quantity-${index}`}>Quantidade</Label>
                        <Input
                          id={`item-quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Total: R$ {(item.unitPrice * item.quantity).toFixed(2)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={handleAddItem}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-medium text-lg">
                  <span>Valor Total:</span>
                  <span>R$ {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="purpose">Finalidade da Compra</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Descreva a finalidade dos itens solicitados"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="purchaseLink">Link de Compra (opcional)</Label>
                  <Input
                    id="purchaseLink"
                    type="url"
                    placeholder="https://..."
                    value={purchaseLink}
                    onChange={(e) => setPurchaseLink(e.target.value)}
                    className="mt-1"
                  />
                </div>
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
                  "Solicitar Compra"
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
        description={`Deseja confirmar a solicitação de compra no valor total de R$ ${calculateTotal().toFixed(2)}? Um administrador precisará revisar e aprovar sua solicitação.`}
        confirmText="Sim, solicitar"
        cancelText="Não, revisar"
        onConfirm={handleSubmit}
      />
    </>
  );
};

export default PurchaseForm;
