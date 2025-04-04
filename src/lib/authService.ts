
import { User } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export type UserRole = "user" | "admin" | "blocked";

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  lastLogin: Date;
}

export const getUserRole = async (user: User): Promise<UserRole> => {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data().role as UserRole;
    } else {
      // Create new user with default role
      const isDomainUser = user.email?.endsWith("@colegioeccos.com.br") || false;
      
      if (!isDomainUser) {
        throw new Error("Apenas usuários com email @colegioeccos.com.br são permitidos");
      }
      
      const isAdmin = user.email === "suporte@colegioeccos.com.br";
      const newUserData: UserData = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        role: isAdmin ? "admin" : "user",
        lastLogin: new Date(),
      };
      
      await setDoc(userDocRef, newUserData);
      return newUserData.role;
    }
  } catch (error) {
    console.error("Error getting user role:", error);
    throw error;
  }
};

export const updateUserLastLogin = async (userId: string): Promise<void> => {
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, {
    lastLogin: new Date(),
  });
};

export const isAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  try {
    const role = await getUserRole(user);
    return role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};
