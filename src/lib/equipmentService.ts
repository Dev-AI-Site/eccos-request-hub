
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
    // Verificar se o usuário está autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
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
    // Verificar se o usuário está autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
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

// Add new equipment
export const addEquipment = async (equipment: Omit<Equipment, "id">): Promise<string> => {
  try {
    // Verificar se o usuário está autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
    const docRef = await addDoc(collection(db, "equipment"), equipment);
    return docRef.id;
  } catch (error) {
    console.error("Error adding equipment:", error);
    throw error;
  }
};

// Delete equipment
export const deleteEquipment = async (equipmentId: string): Promise<void> => {
  try {
    // Verificar se o usuário está autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
    await deleteDoc(doc(db, "equipment", equipmentId));
  } catch (error) {
    console.error("Error deleting equipment:", error);
    throw error;
  }
};
