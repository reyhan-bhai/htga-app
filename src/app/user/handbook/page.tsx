"use client";

import { db } from "@/lib/firebase";
import { Spinner } from "@nextui-org/react";
import { onValue, ref } from "firebase/database";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MdArrowBack, MdMenuBook, MdOpenInNew } from "react-icons/md";
import { MobileLayoutWrapper } from "../../layout-wrapper";

interface HandbookDocument {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  uploadedAt: string;
  isActive: boolean;
  order: number;
}

export default function UserHandbookPage() {
  const [documents, setDocuments] = useState<HandbookDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getExternalUrl = (url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return "";

    if (/^https?:\/\//i.test(trimmedUrl)) {
      return trimmedUrl;
    }

    return `https://${trimmedUrl}`;
  };

  // Firebase real-time listener for active documents
  useEffect(() => {
    const handbooksRef = ref(db, "handbooks");

    const unsubscribe = onValue(handbooksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: HandbookDocument[] = Object.entries(data)
          .map(([id, val]: [string, any]) => ({
            id,
            ...val,
          }))
          // Filter only active documents
          .filter((doc) => doc.isActive)
          // Sort by order
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setDocuments(list);
      } else {
        setDocuments([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-[#FFEDCC]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white pt-12 pb-6 px-4 rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/user/dashboard"
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <MdArrowBack size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MdMenuBook size={28} />
                Evaluator Handbook
              </h1>
              <p className="text-white/80 text-sm mt-1">
                Documents and guidelines for evaluators
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" color="warning" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <MdMenuBook size={64} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">No documents available</p>
              <p className="text-sm text-center mt-2">
                Check back later for new documents
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={getExternalUrl(doc.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4 group active:scale-[0.98]"
                >
                  <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-colors">
                    <MdMenuBook className="text-[#FF6B00]" size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#FF6B00] transition-colors">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {doc.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 p-2 rounded-full text-gray-400 group-hover:text-[#FF6B00] group-hover:bg-orange-50 transition-colors">
                    <MdOpenInNew size={20} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayoutWrapper>
  );
}
