import { AuthProvider } from "../../htga-app/context/AuthContext";
import "../../htga-app/styles/htga.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HTGA - HalalTrip Gastronomy Award",
  description: "Evaluator App for HalalTrip Gastronomy Award",
};

export default function HTGALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="max-w-md mx-auto">{children}</div>
    </AuthProvider>
  );
}
