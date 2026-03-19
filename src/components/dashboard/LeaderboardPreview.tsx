"use client";

import { db } from "@/lib/firebase";
import { RankedEvaluatorStat } from "@/types/restaurant";
import { limitToLast, onValue, orderByChild, query, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MdEmojiEvents } from "react-icons/md";

interface LeaderboardPreviewProps {
  currentUserId: string;
}

const MEDAL_LABELS = ["🥇", "🥈", "🥉"];

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="w-7 h-7 bg-gray-200 rounded-full" />
      <div className="flex-1 h-4 bg-gray-200 rounded" />
      <div className="w-12 h-4 bg-gray-200 rounded" />
    </div>
  );
}

export default function LeaderboardPreview({ currentUserId }: LeaderboardPreviewProps) {
  const router = useRouter();
  const [topThree, setTopThree] = useState<RankedEvaluatorStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const statsQuery = query(
        ref(db, "evaluatorStats"),
        orderByChild("completedCount"),
        limitToLast(3),
      );

      const unsubscribe = onValue(
        statsQuery,
        (snapshot) => {
          if (!snapshot.exists()) {
            setTopThree([]);
            setIsLoading(false);
            return;
          }

          const entries: RankedEvaluatorStat[] = [];
          snapshot.forEach((child) => {
            const data = child.val();
            entries.push({
              evaluatorId: child.key!,
              name: data.name || "—",
              completedCount: data.completedCount || 0,
              submittedCount: data.submittedCount || 0,
              totalAssigned: data.totalAssigned || 0,
              lastUpdated: data.lastUpdated || 0,
              rank: 0,
            });
          });

          // limitToLast returns ascending — reverse to get descending
          entries.reverse();

          // Assign ranks
          entries.forEach((e, i) => {
            e.rank = i + 1;
          });

          setTopThree(entries);
          setIsLoading(false);
        },
        () => {
          // On error: fail silently, don't crash dashboard
          setIsLoading(false);
        },
      );

      return () => unsubscribe();
    } catch {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <MdEmojiEvents size={22} className="text-[#FFA200]" />
        <h3 className="text-gray-900 text-lg font-bold">Leaderboard</h3>
      </div>

      <div className="divide-y divide-gray-50">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : topThree.length === 0 ? (
          <p className="text-sm text-gray-400 py-3 text-center">
            No data yet
          </p>
        ) : (
          topThree.map((entry) => {
            const isCurrentUser = entry.evaluatorId === currentUserId;
            return (
              <div
                key={entry.evaluatorId}
                className={`flex items-center gap-3 py-3 ${isCurrentUser ? "bg-orange-50 -mx-5 px-5 rounded-xl" : ""}`}
              >
                <span className="text-xl w-7 text-center">
                  {MEDAL_LABELS[entry.rank - 1] || `#${entry.rank}`}
                </span>
                <span
                  className={`flex-1 text-sm font-semibold ${isCurrentUser ? "text-[#FF6B00]" : "text-gray-800"}`}
                >
                  {entry.name}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs font-normal text-[#FFA200]">
                      (you)
                    </span>
                  )}
                </span>
                <span className="text-sm font-bold text-gray-700">
                  {entry.completedCount}
                  <span className="text-xs font-normal text-gray-400 ml-1">done</span>
                </span>
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={() => router.push("/user/leaderboard")}
        className="mt-4 w-full text-center text-sm font-semibold text-[#FF6B00] hover:text-[#e05a00] transition-colors"
      >
        See Full Leaderboard →
      </button>
    </div>
  );
}
