import { db } from "@/lib/firebase";
import { Establishment } from "@/types/restaurant";
import { get, off, onValue, ref } from "firebase/database";

export interface EvaluatorAssignment {
  id: string;
  establishmentId: string;
  status: "pending" | "completed";
  assignedAt: string;
  establishment: Establishment;
  uniqueId?: string;
  evaluatorId?: string;
  slot?: "JEVA_FIRST" | "JEVA_SECOND"; // Track which slot this evaluator is in
}

export function subscribeToEvaluatorAssignments(
  evaluatorId: string,
  callback: (assignments: EvaluatorAssignment[]) => void
) {
  console.log("🔍 Subscribing to assignments for evaluator:", evaluatorId);

  const assignmentsRef = ref(db, "assignments");

  const unsubscribe = onValue(assignmentsRef, async (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const allAssignments = snapshot.val();
    const evaluatorAssignments: EvaluatorAssignment[] = [];

    // Process assignments - FIXED SLOT STRUCTURE
    const promises = Object.entries(allAssignments).map(
      async ([key, value]: [string, any]) => {
        // Check JEVA_FIRST and JEVA_SECOND slots for this evaluator
        if (value.evaluators) {
          const jevaFirst = value.evaluators.JEVA_FIRST;
          const jevaSecond = value.evaluators.JEVA_SECOND;

          let evalData: any = null;
          let slot: "JEVA_FIRST" | "JEVA_SECOND" | null = null;

          if (jevaFirst && jevaFirst.evaluatorId === evaluatorId) {
            evalData = jevaFirst;
            slot = "JEVA_FIRST";
          } else if (jevaSecond && jevaSecond.evaluatorId === evaluatorId) {
            evalData = jevaSecond;
            slot = "JEVA_SECOND";
          }

          if (evalData && slot) {
            // Fetch establishment details using establishmentId from evaluator entry
            const establishmentRef = ref(
              db,
              `establishments/${evalData.establishmentId}`
            );
            const establishmentSnap = await get(establishmentRef);

            if (establishmentSnap.exists()) {
              const establishmentData = establishmentSnap.val();

              evaluatorAssignments.push({
                id: key,
                establishmentId: evalData.establishmentId,
                status:
                  evalData.status || evalData.evaluatorStatus || "pending",
                uniqueId: evalData.uniqueId,
                evaluatorId: evalData.evaluatorId || evaluatorId,
                assignedAt: evalData.assignedAt,
                slot,
                establishment: {
                  id: evalData.establishmentId,
                  ...establishmentData,
                },
              });
            } else {
              evaluatorAssignments.push({
                id: key,
                establishmentId: evalData.establishmentId,
                status:
                  evalData.status || evalData.evaluatorStatus || "pending",
                uniqueId: evalData.uniqueId,
                evaluatorId: evalData.evaluatorId || evaluatorId,
                assignedAt: evalData.assignedAt,
                slot,
                establishment: {
                  id: evalData.establishmentId,
                  name: "Unknown Establishment",
                  category: "Unknown",
                  address: "Unknown Address",
                  createdAt: "",
                  updatedAt: "",
                },
              });
            }
          }
        }
      }
    );

    await Promise.all(promises);

    // Sort by assignedAt desc
    evaluatorAssignments.sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
    );

    callback(evaluatorAssignments);
  });

  // Return unsubscribe function
  return () => off(assignmentsRef, "value", unsubscribe);
}

export async function getEvaluatorAssignments(
  evaluatorId: string
): Promise<EvaluatorAssignment[]> {
  try {
    console.log("🔍 Fetching assignments for evaluator:", evaluatorId);

    // 1. Fetch all assignments
    const assignmentsRef = ref(db, "assignments");
    const snapshot = await get(assignmentsRef);

    console.log("📦 Assignments snapshot exists:", snapshot.exists());

    if (!snapshot.exists()) {
      console.log("⚠️ No assignments found in database");
      return [];
    }

    const allAssignments = snapshot.val();
    console.log(
      "📊 Total assignments in DB:",
      Object.keys(allAssignments).length
    );

    const evaluatorAssignments: EvaluatorAssignment[] = [];

    // 2. Filter assignments for this evaluator - FIXED SLOT STRUCTURE
    const promises = Object.entries(allAssignments).map(
      async ([key, value]: [string, any]) => {
        // Check JEVA_FIRST and JEVA_SECOND slots
        if (value.evaluators) {
          const jevaFirst = value.evaluators.JEVA_FIRST;
          const jevaSecond = value.evaluators.JEVA_SECOND;

          let evalData: any = null;
          let slot: "JEVA_FIRST" | "JEVA_SECOND" | null = null;

          if (jevaFirst && jevaFirst.evaluatorId === evaluatorId) {
            evalData = jevaFirst;
            slot = "JEVA_FIRST";
          } else if (jevaSecond && jevaSecond.evaluatorId === evaluatorId) {
            evalData = jevaSecond;
            slot = "JEVA_SECOND";
          }

          if (evalData && slot) {
            const establishmentRef = ref(
              db,
              `establishments/${evalData.establishmentId}`
            );
            const establishmentSnap = await get(establishmentRef);

            if (establishmentSnap.exists()) {
              const establishmentData = establishmentSnap.val();

              evaluatorAssignments.push({
                id: key,
                establishmentId: evalData.establishmentId,
                status:
                  evalData.status || evalData.evaluatorStatus || "pending",
                uniqueId: evalData.uniqueId,
                evaluatorId: evalData.evaluatorId || evaluatorId,
                assignedAt: evalData.assignedAt,
                slot,
                establishment: {
                  id: evalData.establishmentId,
                  ...establishmentData,
                },
              });
            } else {
              // Handle case where establishment data is missing
              console.warn(
                `Establishment data missing for ID: ${evalData.establishmentId}`
              );
              evaluatorAssignments.push({
                id: key,
                establishmentId: evalData.establishmentId,
                status:
                  evalData.status || evalData.evaluatorStatus || "pending",
                uniqueId: evalData.uniqueId,
                evaluatorId: evalData.evaluatorId || evaluatorId,
                assignedAt: evalData.assignedAt,
                slot,
                establishment: {
                  id: evalData.establishmentId,
                  name: "Unknown Establishment",
                  category: "Unknown",
                  address: "Unknown Address",
                  createdAt: "",
                  updatedAt: "",
                },
              });
            }
          }
        }
      }
    );

    await Promise.all(promises);

    console.log(
      "✅ Filtered assignments for evaluator:",
      evaluatorAssignments.length
    );

    // Sort by assignedAt desc
    return evaluatorAssignments.sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
    );
  } catch (error) {
    console.error("❌ Error fetching assignments:", error);
    return [];
  }
}
