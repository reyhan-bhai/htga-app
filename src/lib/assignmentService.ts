import { db } from "@/lib/firebase";
import { Establishment } from "@/types/restaurant";
import { get, off, onValue, ref } from "firebase/database";

export interface EvaluatorAssignment {
  id: string;
  establishmentId: string;
  status: "pending" | "completed";
  assignedAt: string;
  establishment: Establishment;
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

    // Process assignments
    const promises = Object.entries(allAssignments).map(
      async ([key, value]: [string, any]) => {
        const isEvaluator1 = value.evaluator1Id === evaluatorId;
        const isEvaluator2 = value.evaluator2Id === evaluatorId;

        if (isEvaluator1 || isEvaluator2) {
          // Fetch establishment details (one-time fetch is usually okay for static data,
          // but for truly live updates we might need to subscribe to establishments too.
          // For now, let's fetch fresh data on every assignment update)
          const establishmentRef = ref(
            db,
            `establishments/${value.establishmentId}`
          );
          const establishmentSnap = await get(establishmentRef);

          if (establishmentSnap.exists()) {
            const establishmentData = establishmentSnap.val();

            evaluatorAssignments.push({
              id: key,
              establishmentId: value.establishmentId,
              status: isEvaluator1
                ? value.evaluator1Status
                : value.evaluator2Status,
              assignedAt: value.assignedAt,
              establishment: {
                id: value.establishmentId,
                ...establishmentData,
              },
            });
          } else {
            evaluatorAssignments.push({
              id: key,
              establishmentId: value.establishmentId,
              status: isEvaluator1
                ? value.evaluator1Status
                : value.evaluator2Status,
              assignedAt: value.assignedAt,
              establishment: {
                id: value.establishmentId,
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

    // 2. Filter assignments for this evaluator and fetch establishment details
    const promises = Object.entries(allAssignments).map(
      async ([key, value]: [string, any]) => {
        // Check if this assignment belongs to the evaluator (either as evaluator1 or evaluator2)
        const isEvaluator1 = value.evaluator1Id === evaluatorId;
        const isEvaluator2 = value.evaluator2Id === evaluatorId;

        if (isEvaluator1 || isEvaluator2) {
          const establishmentRef = ref(
            db,
            `establishments/${value.establishmentId}`
          );
          const establishmentSnap = await get(establishmentRef);

          if (establishmentSnap.exists()) {
            const establishmentData = establishmentSnap.val();

            evaluatorAssignments.push({
              id: key,
              establishmentId: value.establishmentId,
              status: isEvaluator1
                ? value.evaluator1Status
                : value.evaluator2Status,
              assignedAt: value.assignedAt,
              establishment: {
                id: value.establishmentId,
                ...establishmentData,
              },
            });
          } else {
            // Handle case where establishment data is missing but assignment exists
            console.warn(
              `Establishment data missing for ID: ${value.establishmentId}`
            );
            evaluatorAssignments.push({
              id: key,
              establishmentId: value.establishmentId,
              status: isEvaluator1
                ? value.evaluator1Status
                : value.evaluator2Status,
              assignedAt: value.assignedAt,
              establishment: {
                id: value.establishmentId,
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
