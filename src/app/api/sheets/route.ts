// src/app/api/sheets/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: "service_account",
        project_id: "eirene-5413a",
        private_key_id: "074887058c91682c30e4859583937f4cdaf1a1c6",
        // Menggunakan private key yang Anda berikan
        private_key:
          "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDQCmlHx/ffOR6m\nngLM0YimD10Fplvjr8I82ZNomucz31wUP9FRB8YXhcURmrDhAwygHgIRWKSC/K5B\n1Y8lVvJEqggymBwqpGfCEMHOsQo0sFA9wr/VQgv/zoDdQKTTUaSlgTsOmsIhsBiQ\nnSHG4Cc2iRNWiiJkt8xQ71zkdyWKuvS9w/3R8/PjvF8nytVhr/UKbtRaFMk47zuY\nzYKAx1+5C9cRD7DtFLrmaPaRfGFCvsWCiOUq7acqo0EjL1/zctnF+f6KtG6PaMbx\nPIYsosTFZy4bvTQrLdQr2j4MnsR/4tkKVSBIWUZ+4hHtKv9+VKeSrSk7LUD0n5s9\nDjKdzpCtAgMBAAECggEALc14/9+ADGKSQ7sqoSbpp6vevlFxzidiQ4zghimCiRpe\nNqwVPLqSK5gdOuK8mhGWjEMHEAQc1iTlBaQLy7wAg0sPGnqASwgeuux/Cu9R8Kc3\nx10y6HQN2cBAgVXL5CWHsxOIac77Ojj/s4kQyG0N3RUhT46Cg3uuzUvhvwAXYRsh\n2/6m8bKCTRHvIEKjzEnQgeYnPettWp8SDfHqc6BAZcaJLNioVSshPVG6MiJoUHOe\nOr61Dwg74gwTVEnVXE5SILwpPiiBjcbEVlz+4CKhz2Eq+5iqB7nqAcnBQVfuRCXd\nIAzUzHND+nlqxXZuA/OIZeZEi5TGPtbPZezxlJr5IQKBgQD1QysKN4NMY72oZk6v\nXmPW6hwSQKyBKgl3/86ZMpM/GX4ta5VJjgOegL0ccMGS6SzB618NzRvgiM6reM0V\nrFSR2x75u47nWRiVRohy5wmeZmgYhiFfQ2M+qiBojtRN2lFz1IGk4ASxlZjpXfew\nQZTyWKRoglUuge7SyA0JRnpGIQKBgQDZJhKbiGxsOvEmm+kqVHm5PUxR1Uzh5rrs\nCWBYZyZzvKE84QUfp8jX8G4vDdh3vjp3MXcjquwqK69PZRslJSAJ4VlxPGQGuvZ0\nog1z3QUt+3rdxWmyyfDZokB623QyvIrAHDzrLw6TeEp/gORfyeErEXRZDl/O/5lv\nL8f25zbhDQKBgQC76Dk6e6uhxC0Tr0aLv7KYfwcAyQIhd7aHdLqxzvjXeE2euPVI\nxIBrWNEK0CzOxM1gyVcrOMEp90b4QvZFq6GjmhESXquu/ikCfWafOfm5nVYVq/Y3\niWapJSjtUri/6QtMxjyJuISAFlBwQ2k4Zhaa0mUsGObwWeZDIbgzKgcWYQKBgCV0\nU7FQDqN8ZyvpqIYMnBI/aHKU//XW/lbIJz4YTKGZ35XImkGjhxj394lWMgg1X5A/\nj/Uu/h0n+80N+2ikxqntnKfTas1eYjQr33YkoUgVIFQwQNL90fU37zdBswEtVCFe\nvYMzUqhND0x+xuVexN/Q2uihehUSMTzkWPFVYDnhAoGAILziclsO7p3iGPSlmU3N\n7ljk24nZd07FBlkwm+sAt36uYdwEXQzQT3cPTpBcKkQEjoEXviTAmq7T45qvsCFi\na8Ei9POqsfBX2Y2v93HhP5owtf9BhAZP+kvN7EfEQZhE3lcn4U4M51kdnHW+sL0V\n3scQ5Ijl/rU/mY5aSxzAVms=\n-----END PRIVATE KEY-----\n",
        client_email: "htga-spreadsheet@eirene-5413a.iam.gserviceaccount.com",
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client as any });

    const spreadsheetId = "1THH_mVOFUAorNjVtGm37KJyBpE-ttsN5Z2Xa75O5YD0";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'List of Evaluators'!A1:Z1000",
    });

    const secondResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'List of Eating Establishments'!A1:Z1000",
    });

    // Gabungkan data dari kedua sheet
    response.data.values = [
      ...(response.data.values || []),
      ...(secondResponse.data.values || []),
    ];

    // Kembalikan data dalam format JSON
    return NextResponse.json({
      status: "success",
      data: response.data.values,
    });
  } catch (error: any) {
    console.error("Error fetching sheets:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
