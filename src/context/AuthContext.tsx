"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { User } from "@/types/htga";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  ndaSigned: boolean;
  signNDA: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ndaSigned, setNdaSigned] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage and Firebase on mount
  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      const storedNDA = localStorage.getItem("htga_nda");
      if (storedNDA === "true") {
        setNdaSigned(true);
      }
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          // Fetch user data from Realtime Database
          try {
            const response = await fetch(
              `/api/evaluators?id=${firebaseUser.uid}`
            );
            if (response.ok) {
              const data = await response.json();
              const evaluatorData = data.evaluator;

              setUser({
                id: evaluatorData.id || firebaseUser.uid,
                name:
                  evaluatorData.name || firebaseUser.displayName || "Evaluator",
                email: firebaseUser.email || "",
                role: "evaluator",
              });
            } else {
              // Fallback if API fails
              setUser({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || "Evaluator",
                email: firebaseUser.email || "",
                role: "evaluator",
              });
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            // Fallback
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "Evaluator",
              email: firebaseUser.email || "",
              role: "evaluator",
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Fetch user data from Realtime Database
      try {
        const response = await fetch(
          `/api/evaluators?id=${userCredential.user.uid}`
        );
        if (response.ok) {
          const data = await response.json();
          const evaluatorData = data.evaluator;

          setUser({
            id: evaluatorData.id || userCredential.user.uid,
            name:
              evaluatorData.name ||
              userCredential.user.displayName ||
              "Evaluator",
            email: userCredential.user.email || "",
            role: "evaluator",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      setLoading(false);
      return { success: true };
    } catch (error: unknown) {
      setLoading(false);
      console.error("Login error:", error);

      let errorMessage = "Invalid email or password";
      const firebaseError = error as { code?: string };
      if (firebaseError.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (firebaseError.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (firebaseError.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      } else if (firebaseError.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later";
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setNdaSigned(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("htga_nda");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const signNDA = () => {
    setNdaSigned(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("htga_nda", "true");
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        ndaSigned,
        signNDA,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}