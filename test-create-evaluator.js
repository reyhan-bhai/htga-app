/**
 * Test script untuk Create Evaluator API
 *
 * Cara pakai:
 * 1. Pastikan dev server running: npm run dev
 * 2. Ganti email di testData dengan email target
 * 3. Jalankan: node test-create-evaluator.js
 * 4. Cek inbox email untuk menerima credentials
 * 5. Login di: https://localhost:3000/htga/login
 */

// Bypass SSL certificate validation untuk development (self-signed cert)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const API_URL = "https://localhost:3000/api/admin/create-evaluator";

async function testCreateEvaluator() {
  console.log("🚀 Testing Create Evaluator API...\n");

  try {
    const testData = {
      email: "reyhanmf.dev@gmail.com", // ⚠️ GANTI dengan email target
      displayName: "Test Evaluator",
      specialties: ["Indonesian Cuisine", "Fine Dining"],
      maxAssignments: 5,
    };

    console.log("📤 Sending request to:", API_URL);
    console.log("📋 Request data:", JSON.stringify(testData, null, 2));
    console.log("\n⏳ Please wait...\n");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    console.log("📥 Response Status:", response.status);
    console.log("📥 Response:", JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log("\n✅ SUCCESS! Evaluator created successfully!");
      if (result.data?.emailSent) {
        console.log("📧 Email sent to:", testData.email);
      }
      if (result.credentials) {
        console.log("\n🔐 Credentials (email failed to send):");
        console.log("   Email:", result.credentials.email);
        console.log("   Password:", result.credentials.password);
      }
    } else {
      console.log("\n❌ FAILED! Error creating evaluator");
    }
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("Stack:", error.stack);
  }
}

// Run test
testCreateEvaluator();
