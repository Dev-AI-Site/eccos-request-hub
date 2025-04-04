
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface AvailabilityDate {
  id?: string;
  date: Date;
  isAvailable: boolean;
}

// Get available dates
export const getAvailableDates = async (): Promise<AvailabilityDate[]> => {
  try {
    // Verificar se o usuário está autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
    const availabilityQuery = query(
      collection(db, "availability"),
      where("isAvailable", "==", true)
    );
    
    const querySnapshot = await getDocs(availabilityQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
    } as AvailabilityDate));
  } catch (error) {
    console.error("Error getting available dates:", error);
    throw error;
  }
};

// Add available date
export const addAvailableDate = async (date: Date): Promise<string> => {
  try {
    // Verificar se o usuário está autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
    const availabilityData = {
      date,
      isAvailable: true,
    };
    
    const docRef = await addDoc(collection(db, "availability"), availabilityData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding available date:", error);
    throw error;
  }
};

// Remove available date
export const removeAvailableDate = async (dateId: string): Promise<void> => {
  try {
    // Verificar se o usuário está autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
    await deleteDoc(doc(db, "availability", dateId));
  } catch (error) {
    console.error("Error removing available date:", error);
    throw error;
  }
};

// Check if date is available
export const isDateAvailable = async (date: Date): Promise<boolean> => {
  try {
    // Verificar se o usuário está autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
    // Convert to start of day for comparison
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const availabilityQuery = query(
      collection(db, "availability"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      where("isAvailable", "==", true)
    );
    
    const querySnapshot = await getDocs(availabilityQuery);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking date availability:", error);
    return false;
  }
};
