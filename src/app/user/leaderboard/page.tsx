"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { RankedEvaluatorStat } from "@/types/restaurant";
import { limitToLast, onValue, orderByChild, query, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MdArrowBack, MdEmojiEvents } from "react-icons/md";
import { MobileLayoutWrapper } from "../../layout-wrapper";

const MEDAL_LABELS = ["🥇", "🥈", "🥉"];

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 animate-pulse">
      <div className="w-8 h-5 bg-gray-200 rounded" />
      <div className="flex-1 h-4 bg-gray-200 rounded" />
      <div className="w-14 h-4 bg-gray-200 rounded" />
      <div className="w-10 h-4 bg-gray-200 rounded" />
    </div>
  );
}

function PodiumBlock({
  entry,
  height,
  isCurrentUser,
}: {
  entry: RankedEvaluatorStat;
  height: string;
  isCurrentUser: boolean;
}) {
  const colors = [
    "from-yellow-400 to-yellow-500",
    "from-gray-300 to-gray-400",
    "from-orange-300 to-orange-400",
  ];
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow ${isCurrentUser ? "ring-4 ring-[#FF6B00]" : ""} bg-gradient-to-b ${colors[entry.rank - 1]}`}
      >
        {MEDAL_LABELS[entry.rank - 1]}
      </div>
      <p className={`text-xs font-semibold text-center leading-tight ${isCurrentUser ? "text-[#FF6B00]" : "text-gray-700"}`}>
        {entry.name}
        {isCurrentUser && <span className="block text-[10px] text-[#FFA200]">you</span>}
      </p>
      <p className="text-xs text-gray-500">{entry.completedCount} done</p>
      <div
        className={`w-full rounded-t-lg bg-gradient-to-b ${colors[entry.rank - 1]} opacity-60`}
        style={{ height }}
      />
    </div>
  );
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, ndaSigned, loading: authLoading } = useAuth();
  const [allEntries, setAllEntries] = useState<RankedEvaluatorStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // NDA guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/"); return; }
    if (user.role === "evaluator" && !ndaSigned) { router.replace("/user/nda"); return; }
  }, [authLoading, ndaSigned, router, user]);

  useEffect(() => {
    const statsQuery = query(
      ref(db, "evaluatorStats"),
      orderByChild("completedCount"),
      limitToLast(50),
    );

    const unsubscribe = onValue(
      statsQuery,
      (snapshot) => {
        if (!snapshot.exists()) {
          setAllEntries([]);
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

        entries.reverse();
        entries.forEach((e, i) => { e.rank = i + 1; });

        setAllEntries(entries);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return () => unsubscribe();
  }, []);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#FFEDCC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FFA200] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user.role === "evaluator" && !ndaSigned) {
    return (
      <div className="min-h-screen bg-[#FFEDCC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FFA200] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const top3 = allEntries.slice(0, 3);
  const currentUserEntry = allEntries.find((e) => e.evaluatorId === user.id);
  const currentUserOutsideTop50 = !currentUserEntry;

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumHeightMap: Record<number, string> = { 1: "96px", 2: "64px", 3: "48px" };

  return (
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-[#FFEDCC]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white pt-12 pb-6 px-4 rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push("/user/dashboard")}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <MdArrowBack size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MdEmojiEvents size={28} />
                Leaderboard
              </h1>
              <p className="text-white/80 text-sm">Top evaluators this season</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-6 pb-24">
          {/* Podium */}
          {!isLoading && top3.length >= 2 && (
            <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">
              <div className="flex items-end justify-center gap-4">
                {podiumOrder.map((entry) => {
                  const isCurrentUser = entry.evaluatorId === user.id;
                  return (
                    <PodiumBlock
                      key={entry.evaluatorId}
                      entry={entry}
                      height={podiumHeightMap[entry.rank] || "48px"}
                      isCurrentUser={isCurrentUser}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* "Your Position" banner if outside top 50 */}
          {!isLoading && currentUserOutsideTop50 && (
            <div className="bg-orange-50 border border-[#FFA200] rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#FF6B00]">Your Position</span>
              <span className="text-sm text-gray-500">Outside top 50</span>
            </div>
          )}

          {/* Full List */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-4">
            {/* Column headers */}
            <div className="flex items-center gap-4 py-2 px-4 border-b border-gray-100 bg-gray-50">
              <span className="w-8 text-xs font-semibold text-gray-400">#</span>
              <span className="flex-1 text-xs font-semibold text-gray-400">Name</span>
              <span className="w-14 text-xs font-semibold text-gray-400 text-right">Done</span>
              <span className="w-16 text-xs font-semibold text-gray-400 text-right">Submitted</span>
            </div>

            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : allEntries.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
            ) : (
              allEntries.map((entry) => {
                const isCurrentUser = entry.evaluatorId === user.id;
                return (
                  <div
                    key={entry.evaluatorId}
                    className={`flex items-center gap-4 py-3 px-4 border-b border-gray-50 last:border-0 ${isCurrentUser ? "bg-orange-50" : ""}`}
                  >
                    <span className="w-8 text-xs font-bold text-gray-500">
                      {entry.rank <= 3 ? MEDAL_LABELS[entry.rank - 1] : `#${entry.rank}`}
                    </span>
                    <span className={`flex-1 text-sm font-semibold ${isCurrentUser ? "text-[#FF6B00]" : "text-gray-800"}`}>
                      {entry.name}
                      {isCurrentUser && (
                        <span className="ml-1 text-xs font-normal text-[#FFA200]">(you)</span>
                      )}
                    </span>
                    <span className="w-14 text-sm font-bold text-gray-700 text-right">
                      {entry.completedCount}
                    </span>
                    <span className="w-16 text-sm text-gray-400 text-right">
                      {entry.submittedCount}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </MobileLayoutWrapper>
  );
}
