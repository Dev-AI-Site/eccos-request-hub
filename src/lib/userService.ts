
import { collection, doc, getDocs, query, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { UserData, UserRole } from "./authService";

// Get all users
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const usersQuery = query(collection(db, "users"));
    const querySnapshot = await getDocs(usersQuery);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      lastLogin: doc.data().lastLogin.toDate(),
    } as UserData));
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (
  userId: string,
  newRole: UserRole
): Promise<void> => {
  try {
    // Prevent changing role of main admin account
    const userDocRef = doc(db, "users", userId);
    const userDoc = await doc(db, "users", userId).get();
    
    if (userDoc.data()?.email === "suporte@colegioeccos.com.br") {
      throw new Error("Não é possível alterar o papel do usuário suporte@colegioeccos.com.br");
    }
    
    await updateDoc(userDocRef, {
      role: newRole,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};
