
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "./firebase";

export type EquipmentType = "Chromebook" | "iPad";

export interface Equipment {
  id?: string;
  type: EquipmentType;
  name: string;
  isAvailable: boolean;
}

// Get all equipment
export const getAllEquipment = async (): Promise<Equipment[]> => {
  try {
    const currentUser = auth.currentUser;
    
    // Verificar se o usuário está autenticado
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
    // As regras do Firebase garantirão que apenas usuários autenticados possam ler
    const equipmentQuery = query(collection(db, "equipment"));
    const querySnapshot = await getDocs(equipmentQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Equipment));
  } catch (error) {
    console.error("Error getting equipment:", error);
    throw error;
  }
};

// Get equipment by type
export const getEquipmentByType = async (type: EquipmentType): Promise<Equipment[]> => {
  try {
    const currentUser = auth.currentUser;
    
    // Verificar se o usuário está autenticado
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
    // As regras do Firebase garantirão que apenas usuários autenticados possam ler
    const equipmentQuery = query(
      collection(db, "equipment"),
      where("type", "==", type)
    );
    
    const querySnapshot = await getDocs(equipmentQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Equipment));
  } catch (error) {
    console.error("Error getting equipment by type:", error);
    throw error;
  }
};

// Add new equipment (apenas admin pode adicionar equipamentos)
export const addEquipment = async (equipment: Omit<Equipment, "id">): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    
    // Verificar se o usuário está autenticado
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
    // As regras do Firebase garantirão que apenas admins possam criar equipamentos
    const docRef = await addDoc(collection(db, "equipment"), equipment);
    return docRef.id;
  } catch (error) {
    console.error("Error adding equipment:", error);
    throw error;
  }
};

// Delete equipment (apenas admin pode excluir equipamentos)
export const deleteEquipment = async (equipmentId: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    // Verificar se o usuário está autenticado
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
    // As regras do Firebase garantirão que apenas admins possam excluir equipamentos
    await deleteDoc(doc(db, "equipment", equipmentId));
  } catch (error) {
    console.error("Error deleting equipment:", error);
    throw error;
  }
};
