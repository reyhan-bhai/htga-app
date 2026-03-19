"use client";

import { db } from "@/lib/firebase";
import { RankedEvaluatorStat } from "@/types/restaurant";
import { onValue, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MdArrowBack, MdEmojiEvents, MdSearch } from "react-icons/md";

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-3 px-4"><div className="w-6 h-4 bg-gray-200 rounded" /></td>
      <td className="py-3 px-4"><div className="w-32 h-4 bg-gray-200 rounded" /></td>
      <td className="py-3 px-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
      <td className="py-3 px-4"><div className="w-12 h-4 bg-gray-200 rounded" /></td>
      <td className="py-3 px-4"><div className="w-12 h-4 bg-gray-200 rounded" /></td>
      <td className="py-3 px-4"><div className="w-12 h-4 bg-gray-200 rounded" /></td>
    </tr>
  );
}

export default function AdminLeaderboardPage() {
  const router = useRouter();
  const [allEntries, setAllEntries] = useState<RankedEvaluatorStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = onValue(
      ref(db, "evaluatorStats"),
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

        // Sort by completedCount DESC, tiebreaker submittedCount DESC
        entries.sort((a, b) =>
          b.completedCount !== a.completedCount
            ? b.completedCount - a.completedCount
            : b.submittedCount - a.submittedCount,
        );
        entries.forEach((e, i) => { e.rank = i + 1; });

        setAllEntries(entries);
        setLastUpdated(new Date());
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return allEntries;
    const q = search.toLowerCase();
    return allEntries.filter((e) => e.name.toLowerCase().includes(q));
  }, [allEntries, search]);

  const completionRate = (entry: RankedEvaluatorStat) => {
    if (!entry.totalAssigned) return "—";
    return `${((entry.submittedCount / entry.totalAssigned) * 100).toFixed(0)}%`;
  };

  const MEDAL_LABELS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/admin")}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <MdArrowBack size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MdEmojiEvents size={28} className="text-[#FFA200]" />
            Evaluator Leaderboard
          </h1>
          <p className="text-sm text-gray-500">
            {isLoading ? "Loading..." : `${allEntries.length} evaluators`}
            {lastUpdated && (
              <span className="ml-2 text-gray-400">
                · Live
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full ml-1 animate-pulse" />
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FFA200] focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs w-12">#</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs">Name</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs">Evaluator ID</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-500 text-xs">Completed</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-500 text-xs">Submitted</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-500 text-xs">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    {search ? "No results found" : "No data yet"}
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr
                    key={entry.evaluatorId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-gray-400 text-xs">
                      {MEDAL_LABELS[entry.rank] || `#${entry.rank}`}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {entry.name}
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                      {entry.evaluatorId}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-gray-800">{entry.completedCount}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500">
                      {entry.submittedCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          entry.totalAssigned === 0
                            ? "bg-gray-100 text-gray-400"
                            : parseInt(completionRate(entry)) >= 80
                              ? "bg-green-100 text-green-700"
                              : parseInt(completionRate(entry)) >= 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-600"
                        }`}
                      >
                        {completionRate(entry)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
