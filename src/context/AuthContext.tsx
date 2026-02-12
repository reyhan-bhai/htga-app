"use client";

import {
  getStoredFCMToken,
  removeFCMToken,
  removeFCMTokenFromServer,
} from "@/lib/fcmTokenHelper";
import { auth, db } from "@/lib/firebase";
import { User } from "@/types/htga";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  equalTo,
  get,
  onValue,
  orderByChild,
  query,
  ref,
} from "firebase/database";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  ndaSigned: boolean;
  signNDA: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AccountRole = "superadmin" | "admin" | "evaluator";

const resolveAccountRole = async (
  firebaseUser: FirebaseUser,
): Promise<{
  role: AccountRole;
  profileRef: ReturnType<typeof ref> | null;
  key: string | null;
}> => {
  // Priority: superadmin -> admin -> evaluator
  const uid = firebaseUser.uid;

  // 1) Superadmin direct lookup (key is uid per provided schema)
  const superadminRef = ref(db, `superadmins/${uid}`);
  const superadminSnap = await get(superadminRef);
  if (superadminSnap.exists()) {
    const data = superadminSnap.val();
    if (data?.isActive === false) {
      // inactive accounts behave like unauthenticated from an app-routing perspective
      throw new Error("Account is inactive");
    }
    return { role: "superadmin", profileRef: superadminRef, key: uid };
  }

  // 2) Admin direct lookup
  const adminRef = ref(db, `admins/${uid}`);
  const adminSnap = await get(adminRef);
  if (adminSnap.exists()) {
    const data = adminSnap.val();
    if (data?.isActive === false) {
      throw new Error("Account is inactive");
    }
    return { role: "admin", profileRef: adminRef, key: uid };
  }

  // 3) Evaluator lookup: uid node OR by firebaseUid OR email
  const evaluatorsRoot = ref(db, "evaluators");
  const directEvaluatorRef = ref(db, `evaluators/${uid}`);
  const directEvaluatorSnap = await get(directEvaluatorRef);
  if (directEvaluatorSnap.exists()) {
    return { role: "evaluator", profileRef: directEvaluatorRef, key: uid };
  }

  const byFirebaseUidQ = query(
    evaluatorsRoot,
    orderByChild("firebaseUid"),
    equalTo(uid),
  );
  const byFirebaseUidSnap = await get(byFirebaseUidQ);
  if (byFirebaseUidSnap.exists()) {
    const val = byFirebaseUidSnap.val();
    const key = Object.keys(val)[0];
    return { role: "evaluator", profileRef: ref(db, `evaluators/${key}`), key };
  }

  if (firebaseUser.email) {
    const byEmailQ = query(
      evaluatorsRoot,
      orderByChild("email"),
      equalTo(firebaseUser.email),
    );
    const byEmailSnap = await get(byEmailQ);
    if (byEmailSnap.exists()) {
      const val = byEmailSnap.val();
      const key = Object.keys(val)[0];
      return {
        role: "evaluator",
        profileRef: ref(db, `evaluators/${key}`),
        key,
      };
    }
  }

  return { role: "evaluator", profileRef: null, key: null };
};

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
    let dataUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        // Cleanup previous data listener
        if (dataUnsubscribe) {
          dataUnsubscribe();
          dataUnsubscribe = null;
        }

        if (firebaseUser) {
          console.log("AuthContext: User logged in", firebaseUser.uid);

          try {
            const resolved = await resolveAccountRole(firebaseUser);
            const { role, profileRef, key } = resolved;

            if (!profileRef || !key) {
              setUser({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || "User",
                email: firebaseUser.email || "",
                role: "evaluator",
              });
              setLoading(false);
              return;
            }

            dataUnsubscribe = onValue(profileRef, (snapshot) => {
              if (!snapshot.exists()) {
                setUser({
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || "User",
                  email: firebaseUser.email || "",
                  role,
                });
                setLoading(false);
                return;
              }

              const data = snapshot.val();

              if (data?.isActive === false) {
                // If the account is disabled in DB, treat as logged out for the UI.
                setUser(null);
                setNdaSigned(false);
                localStorage.removeItem("htga_nda");
                setLoading(false);
                return;
              }

              if (role === "evaluator") {
                setUser({
                  id: key,
                  name: data?.name || firebaseUser.displayName || "Evaluator",
                  email: firebaseUser.email || data?.email || "",
                  role: "evaluator",
                  phone: data?.phone || "",
                  company: data?.company || "",
                });

                const isSigned =
                  data?.nda?.status === "signed" ||
                  data?.ndaSigned === true ||
                  data?.ndaSigned === "true";

                if (isSigned) {
                  setNdaSigned(true);
                  localStorage.setItem("htga_nda", "true");
                } else {
                  setNdaSigned(false);
                  localStorage.removeItem("htga_nda");
                }
              } else {
                // admin/superadmin
                setUser({
                  id: key,
                  name: data?.name || firebaseUser.displayName || "Admin",
                  email: firebaseUser.email || data?.email || "",
                  role,
                });
                setNdaSigned(false);
                localStorage.removeItem("htga_nda");
              }

              setLoading(false);
            });
          } catch (error) {
            console.error("AuthContext: Error resolving user profile", error);
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "User",
              email: firebaseUser.email || "",
              role: "evaluator",
            });
            setLoading(false);
          }
        } else {
          setUser(null);
          setNdaSigned(false);
          localStorage.removeItem("htga_nda");
          setLoading(false);
        }
      },
    );

    return () => {
      if (dataUnsubscribe) dataUnsubscribe();
      unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = true,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);

      // Note: we rely on onAuthStateChanged + RTDB listeners to populate user/role.

      if (typeof window !== "undefined") {
        localStorage.setItem("htga_isLogged", "true");
        localStorage.setItem("htga_rememberMe", rememberMe.toString());
      }

      setLoading(false);
      return { success: true };
    } catch (error: unknown) {
      setLoading(false);
      return {
        success: false,
        error: `Login Error: ${(error as Error).message}`,
      };
    }
  };

  const logout = async () => {
    try {
      const fcmToken = getStoredFCMToken();
      const userId = user?.id;

      if (fcmToken && userId) {
        await removeFCMTokenFromServer(fcmToken, userId);
        removeFCMToken();
      }

      await signOut(auth);
      setUser(null);
      setNdaSigned(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("htga_nda");
        localStorage.removeItem("htga_isLogged");
        localStorage.removeItem("htga_rememberMe");
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
