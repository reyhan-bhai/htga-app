import { db } from "@/lib/firebase-admin";

/**
 * Recomputes and saves evaluatorStats for a given evaluator.
 * Scans all assignments to get accurate counts — called after any status change.
 * Must only run server-side (Admin SDK).
 */
export async function updateEvaluatorStats(evaluatorId: string): Promise<void> {
  const [assignmentsSnap, evaluatorSnap] = await Promise.all([
    db.ref("assignments").once("value"),
    db.ref(`evaluators/${evaluatorId}`).once("value"),
  ]);

  const evaluatorData = evaluatorSnap.val();
  const fullName: string = evaluatorData?.name || "";
  const firstName = fullName.split(" ")[0] || fullName;

  let completedCount = 0;
  let submittedCount = 0;
  let totalAssigned = 0;

  if (assignmentsSnap.exists()) {
    const allAssignments = assignmentsSnap.val() as Record<string, any>;

    for (const assignment of Object.values(allAssignments)) {
      const isEval1 = assignment.evaluator1Id === evaluatorId;
      const isEval2 = assignment.evaluator2Id === evaluatorId;

      if (!isEval1 && !isEval2) continue;

      totalAssigned++;
      const status = isEval1
        ? assignment.evaluator1Status
        : assignment.evaluator2Status;

      if (status === "completed") {
        completedCount++;
        submittedCount++;
      } else if (status === "submitted") {
        submittedCount++;
      }
    }
  }

  await db.ref(`evaluatorStats/${evaluatorId}`).update({
    name: firstName,
    completedCount,
    submittedCount,
    totalAssigned,
    lastUpdated: Date.now(),
  });
}
