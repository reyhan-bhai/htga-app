"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "../types";
import { dummyUser } from "../data/dummyData";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  ndaSigned: boolean;
  signNDA: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ndaSigned, setNdaSigned] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load auth state from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const storedAuth = localStorage.getItem("htga_auth");
      const storedNDA = localStorage.getItem("htga_nda");
      
      if (storedAuth === "true") {
        setUser(dummyUser);
      }
      
      if (storedNDA === "true") {
        setNdaSigned(true);
      }
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === "evaluator" && password === "123456") {
      setUser(dummyUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem("htga_auth", "true");
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setNdaSigned(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem("htga_auth");
      localStorage.removeItem("htga_nda");
    }
  };

  const signNDA = () => {
    setNdaSigned(true);
    if (typeof window !== 'undefined') {
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
