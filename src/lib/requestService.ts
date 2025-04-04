
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "./firebase";
import { sendRequestNotification, sendStatusChangeNotification } from "./emailService";

export type RequestType = "Compra" | "Suporte" | "Reserva";
export type RequestStatus = "Pendente" | "Aprovado" | "Reprovado" | "Em Andamento" | "Concluida" | "Cancelado";

export interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

// Base request interface
export interface BaseRequest {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: RequestType;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  chat: ChatMessage[];
}

// Purchase request
export interface PurchaseItem {
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface PurchaseRequest extends BaseRequest {
  type: "Compra";
  items: PurchaseItem[];
  totalPrice: number;
  purpose: string;
  purchaseLink?: string;
}

// Support request
export type SupportCategory = "Internet" | "Notebook" | "Projetor" | "Som" | "Outros";
export type Unit = "Berçário e Educação Infantil" | "Fundamental" | "Anexo";

export interface SupportRequest extends BaseRequest {
  type: "Suporte";
  unit: Unit;
  location: string;
  category: SupportCategory;
  description: string;
}

// Reservation request
export type EquipmentType = "Chromebook" | "iPad";

export interface ReservationRequest extends BaseRequest {
  type: "Reserva";
  equipmentId: string;
  equipmentName: string;
  equipmentType: EquipmentType;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  purpose: string;
}

export type Request = PurchaseRequest | SupportRequest | ReservationRequest;

// Define a type for Firestore document data
interface FirestoreRequestData {
  userId: string;
  userName: string;
  userEmail: string;
  type: RequestType;
  status: RequestStatus;
  createdAt: { toDate: () => Date };
  updatedAt: { toDate: () => Date };
  chat: ChatMessage[];
  [key: string]: any; // For other properties specific to request types
}

// Get user requests
export const getUserRequests = async (userId: string): Promise<Request[]> => {
  try {
    // Correção para ordenar primeiro por status e depois por createdAt
    const requestsQuery = query(
      collection(db, "requests"),
      where("userId", "==", userId),
      where("status", "!=", "Cancelado"),
      orderBy("status"), // Primeiro ordenamos pelo campo com desigualdade
      orderBy("createdAt", "desc") // Depois podemos ordenar por createdAt
    );
    
    const querySnapshot = await getDocs(requestsQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreRequestData;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Request;
    });
  } catch (error) {
    console.error("Error getting user requests:", error);
    throw error;
  }
};

// Get all requests for admin
export const getAllRequests = async (includeCompleted: boolean = false): Promise<Request[]> => {
  try {
    let requestsQuery;
    
    if (!includeCompleted) {
      // Correção similar aqui, ordenando primeiro por status
      requestsQuery = query(
        collection(db, "requests"),
        where("status", "in", ["Pendente", "Aprovado", "Em Andamento"]),
        orderBy("status"), // Primeiro ordenamos pelo campo com condição
        orderBy("createdAt", "desc") // Depois ordenamos por data
      );
    } else {
      requestsQuery = query(
        collection(db, "requests"),
        orderBy("createdAt", "desc")
      );
    }
    
    const querySnapshot = await getDocs(requestsQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreRequestData;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Request;
    });
  } catch (error) {
    console.error("Error getting all requests:", error);
    throw error;
  }
};

// Create a new request
export const createRequest = async (request: Omit<Request, "id" | "createdAt" | "updatedAt" | "chat">): Promise<string> => {
  try {
    const now = new Date();
    const requestWithDates = {
      ...request,
      createdAt: now,
      updatedAt: now,
      chat: [],
    };
    
    const docRef = await addDoc(collection(db, "requests"), requestWithDates);
    
    // Send email notification to all admins
    await sendRequestNotification(requestWithDates as Request);
    
    return docRef.id;
  } catch (error) {
    console.error("Error creating request:", error);
    throw error;
  }
};

// Update request status
export const updateRequestStatus = async (
  requestId: string, 
  newStatus: RequestStatus,
  userEmail: string
): Promise<void> => {
  try {
    const requestRef = doc(db, "requests", requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (requestSnap.exists()) {
      const request = requestSnap.data() as FirestoreRequestData;
      const oldStatus = request.status;
      
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: new Date(),
      });
      
      // Send notification if status changed to Approved or Rejected
      if ((newStatus === "Aprovado" || newStatus === "Reprovado") && oldStatus !== newStatus) {
        await sendStatusChangeNotification(request as unknown as Request, newStatus, userEmail);
      }
    }
  } catch (error) {
    console.error("Error updating request status:", error);
    throw error;
  }
};

// Add chat message
export const addChatMessage = async (
  requestId: string,
  userId: string,
  userName: string,
  message: string
): Promise<void> => {
  try {
    const requestRef = doc(db, "requests", requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (requestSnap.exists()) {
      const request = requestSnap.data() as FirestoreRequestData;
      const chat = request.chat || [];
      
      const newMessage: ChatMessage = {
        userId,
        userName,
        message,
        timestamp: new Date(),
      };
      
      await updateDoc(requestRef, {
        chat: [...chat, newMessage],
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error adding chat message:", error);
    throw error;
  }
};

// Delete request (admin only)
export const deleteRequest = async (requestId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "requests", requestId));
  } catch (error) {
    console.error("Error deleting request:", error);
    throw error;
  }
};
