import jwt from "jsonwebtoken";
import dns from "node:dns";

// Force IPv4 for DNS resolution to avoid timeouts on some networks
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch {
  // Ignore if not supported
}

interface DocuSignTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export const getDocuSignAccessToken = async (): Promise<string> => {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY!;
  const userId = process.env.DOCUSIGN_USER_ID!;
  const privateKey = process.env.DOCUSIGN_PRIVATE_KEY!.replace(/\\n/g, "\n");
  // const basePath = process.env.DOCUSIGN_BASE_PATH!;

  // Create JWT assertion
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: integrationKey,
    sub: userId,
    aud: "account-d.docusign.com",
    iat: now,
    exp: now + 3600,
    scope: "signature impersonation",
  };

  const jwtToken = jwt.sign(jwtPayload, privateKey, {
    algorithm: "RS256",
  });

  // Request access token
  try {
    const response = await fetch("https://account-d.docusign.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwtToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DocuSign auth failed: ${errorText}`);
    }

    const data: DocuSignTokenResponse = await response.json();
    return data.access_token;
  } catch (error: any) {
    console.error("DocuSign JWT Auth Error:", error.message);
    if (error.cause) {
      console.error("Caused by:", error.cause);
    }
    throw new Error(
      "Failed to authenticate with DocuSign. Please check your credentials and ensure JWT consent is granted."
    );
  }
};

export const getAccountId = () => process.env.DOCUSIGN_ACCOUNT_ID!;
export const getBasePath = () => process.env.DOCUSIGN_BASE_PATH!;
