import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/seed-leaderboard
 * One-time backfill: scans all existing assignments and evaluators,
 * computes stats, and writes to /evaluatorStats.
 * Call once from Postman / browser fetch after deploy.
 */
export async function POST(): Promise<NextResponse> {
  try {
    const [assignmentsSnap, evaluatorsSnap] = await Promise.all([
      db.ref("assignments").once("value"),
      db.ref("evaluators").once("value"),
    ]);

    if (!evaluatorsSnap.exists()) {
      return NextResponse.json({ message: "No evaluators found." });
    }

    const evaluators = evaluatorsSnap.val() as Record<string, any>;
    const allAssignments = assignmentsSnap.exists()
      ? (assignmentsSnap.val() as Record<string, any>)
      : {};

    // Build stats per evaluator by scanning all assignments
    const statsMap: Record<
      string,
      { name: string; completedCount: number; submittedCount: number; totalAssigned: number; lastUpdated: number }
    > = {};

    for (const [evalId, evalData] of Object.entries(evaluators)) {
      const fullName: string = evalData?.name || "";
      const firstName = fullName.split(" ")[0] || fullName;
      statsMap[evalId] = {
        name: firstName,
        completedCount: 0,
        submittedCount: 0,
        totalAssigned: 0,
        lastUpdated: Date.now(),
      };
    }

    for (const assignment of Object.values(allAssignments)) {
      const processSlot = (evalId: string, status: string) => {
        if (!evalId || !statsMap[evalId]) return;
        statsMap[evalId].totalAssigned++;
        if (status === "completed") {
          statsMap[evalId].completedCount++;
          statsMap[evalId].submittedCount++;
        } else if (status === "submitted") {
          statsMap[evalId].submittedCount++;
        }
      };

      processSlot(assignment.evaluator1Id, assignment.evaluator1Status);
      processSlot(assignment.evaluator2Id, assignment.evaluator2Status);
    }

    // Write all stats atomically via multi-path update
    const updates: Record<string, any> = {};
    for (const [evalId, stats] of Object.entries(statsMap)) {
      updates[`evaluatorStats/${evalId}`] = stats;
    }

    await db.ref().update(updates);

    const count = Object.keys(statsMap).length;
    return NextResponse.json({
      success: true,
      message: `Seeded stats for ${count} evaluators.`,
      seeded: count,
    });
  } catch (error: unknown) {
    console.error("[seed-leaderboard] Error:", error);
    return NextResponse.json(
      { error: "Failed to seed leaderboard stats." },
      { status: 500 },
    );
  }
}
