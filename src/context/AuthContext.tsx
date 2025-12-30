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
    rememberMe?: boolean
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

          const evaluatorsRef = ref(db, "evaluators");
          let targetRef: ReturnType<typeof ref> | null = null;
          let resolvedKey: string | null = null;

          try {
            // 1. Try direct lookup - but only if it has proper evaluator data (name field)
            const directRef = ref(db, `evaluators/${firebaseUser.uid}`);
            const directSnapshot = await get(directRef);

            if (directSnapshot.exists() && directSnapshot.val().name) {
              // This is a proper evaluator profile keyed by UID
              console.log(
                "AuthContext: Found user by direct UID with valid profile"
              );
              targetRef = directRef;
              resolvedKey = firebaseUser.uid;
            } else {
              // 2. Try lookup by firebaseUid (the standard way)
              console.log("AuthContext: Trying firebaseUid lookup...");
              let userQuery = query(
                evaluatorsRef,
                orderByChild("firebaseUid"),
                equalTo(firebaseUser.uid)
              );
              let querySnapshot = await get(userQuery);

              if (querySnapshot.exists()) {
                const val = querySnapshot.val();
                const key = Object.keys(val)[0];
                console.log(
                  "AuthContext: Found user by firebaseUid, key:",
                  key
                );
                targetRef = ref(db, `evaluators/${key}`);
                resolvedKey = key;
              } else if (firebaseUser.email) {
                // 3. Try lookup by email
                console.log(
                  "AuthContext: firebaseUid lookup failed, trying email..."
                );
                userQuery = query(
                  evaluatorsRef,
                  orderByChild("email"),
                  equalTo(firebaseUser.email)
                );
                querySnapshot = await get(userQuery);

                if (querySnapshot.exists()) {
                  const val = querySnapshot.val();
                  const key = Object.keys(val)[0];
                  console.log("AuthContext: Found user by email, key:", key);
                  targetRef = ref(db, `evaluators/${key}`);
                  resolvedKey = key;
                } else {
                  console.warn("AuthContext: User profile not found in DB");
                }
              }
            }

            if (!targetRef || !resolvedKey) {
              // No profile found, use basic auth info
              console.log(
                "AuthContext: No valid profile found, using basic auth info"
              );
              setUser({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || "Evaluator",
                email: firebaseUser.email || "",
                role: "evaluator",
              });
              setLoading(false);
              return;
            }

            // 4. Subscribe to the resolved node
            const finalKey = resolvedKey; // Capture for closure
            dataUnsubscribe = onValue(targetRef, (snapshot) => {
              if (snapshot.exists()) {
                const evaluatorData = snapshot.val();

                // Use the resolved key (JEVA01, etc.) as the user ID
                const userId = finalKey;
                console.log("AuthContext: Setting user with ID:", userId);

                setUser({
                  id: userId,
                  name:
                    evaluatorData.name ||
                    firebaseUser.displayName ||
                    "Evaluator",
                  email: firebaseUser.email || "",
                  role: "evaluator",
                });

                // Check NDA status from backend
                const isSigned =
                  evaluatorData.nda?.status === "signed" ||
                  evaluatorData.ndaSigned === true ||
                  evaluatorData.ndaSigned === "true";

                console.log("AuthContext: NDA status check:", {
                  ndaStatus: evaluatorData.nda?.status,
                  ndaSigned: evaluatorData.ndaSigned,
                  isSigned,
                });

                if (isSigned) {
                  setNdaSigned(true);
                  localStorage.setItem("htga_nda", "true");
                } else {
                  setNdaSigned(false);
                  localStorage.removeItem("htga_nda");
                }
              } else {
                // Fallback if data doesn't exist yet
                console.log(
                  "AuthContext: No data at target ref, using basic auth info"
                );
                setUser({
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || "Evaluator",
                  email: firebaseUser.email || "",
                  role: "evaluator",
                });
              }
              setLoading(false);
            });
          } catch (error) {
            console.error("AuthContext: Error resolving user profile", error);
            // Fallback on error
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "Evaluator",
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
      }
    );

    return () => {
      if (dataUnsubscribe) dataUnsubscribe();
      unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = true
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

          // Check NDA status from backend
          if (evaluatorData.ndaSigned) {
            setNdaSigned(true);
            localStorage.setItem("htga_nda", "true");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      // Set isLogged flag for keep login feature
      if (typeof window !== "undefined") {
        localStorage.setItem("htga_isLogged", "true");
        localStorage.setItem("htga_rememberMe", rememberMe.toString());
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
      // Get FCM token before logout
      const fcmToken = getStoredFCMToken();
      const userId = user?.id;

      // Remove FCM token from server if exists
      if (fcmToken && userId) {
        console.log("🗑️ Removing FCM token for user:", userId);
        await removeFCMTokenFromServer(fcmToken, userId);
        removeFCMToken(); // Remove from localStorage
        console.log("✅ FCM token removed successfully");
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
