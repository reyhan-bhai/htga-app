import { NextResponse } from "next/server";

export interface ApiErrorDetails {
  code: string;
  message: string;
  details?: string;
  field?: string;
  timestamp: string;
  path?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetails;
}

// Error codes for different types of errors
export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_ID: "INVALID_ID",

  // Database errors
  DATABASE_ERROR: "DATABASE_ERROR",
  DATABASE_CONNECTION_ERROR: "DATABASE_CONNECTION_ERROR",
  DATABASE_READ_ERROR: "DATABASE_READ_ERROR",
  DATABASE_WRITE_ERROR: "DATABASE_WRITE_ERROR",
  TRANSACTION_ERROR: "TRANSACTION_ERROR",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Authentication errors
  AUTH_ERROR: "AUTH_ERROR",
  FIREBASE_AUTH_ERROR: "FIREBASE_AUTH_ERROR",
  PERMISSION_DENIED: "PERMISSION_DENIED",

  // External service errors
  EMAIL_SERVICE_ERROR: "EMAIL_SERVICE_ERROR",
  NDA_SERVICE_ERROR: "NDA_SERVICE_ERROR",
  FCM_ERROR: "FCM_ERROR",

  // General errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Map Firebase error codes to friendly messages
const firebaseErrorMap: Record<string, { code: ErrorCode; message: string }> = {
  "auth/email-already-exists": {
    code: ErrorCodes.ALREADY_EXISTS,
    message: "An account with this email already exists in Firebase Auth",
  },
  "auth/invalid-email": {
    code: ErrorCodes.INVALID_FORMAT,
    message: "The email address format is invalid",
  },
  "auth/user-not-found": {
    code: ErrorCodes.NOT_FOUND,
    message: "No user found with this identifier",
  },
  "auth/weak-password": {
    code: ErrorCodes.VALIDATION_ERROR,
    message: "Password is too weak. It should be at least 6 characters",
  },
  "auth/invalid-password": {
    code: ErrorCodes.VALIDATION_ERROR,
    message: "Invalid password format",
  },
  PERMISSION_DENIED: {
    code: ErrorCodes.PERMISSION_DENIED,
    message: "You do not have permission to perform this action",
  },
  UNAVAILABLE: {
    code: ErrorCodes.DATABASE_CONNECTION_ERROR,
    message:
      "Database service is currently unavailable. Please try again later",
  },
};

// Parse and categorize error
function parseError(error: unknown): {
  code: ErrorCode;
  message: string;
  details?: string;
  originalError?: string;
} {
  if (error instanceof Error) {
    const errorMessage = error.message;
    const errorName = error.name;

    // Check for Firebase Auth errors
    if (errorMessage.includes("auth/") || errorName === "FirebaseAuthError") {
      const authCode = errorMessage.match(/auth\/[\w-]+/)?.[0];
      if (authCode && firebaseErrorMap[authCode]) {
        return {
          code: firebaseErrorMap[authCode].code,
          message: firebaseErrorMap[authCode].message,
          details: `Firebase Auth Error: ${authCode}`,
          originalError: errorMessage,
        };
      }
      return {
        code: ErrorCodes.FIREBASE_AUTH_ERROR,
        message: "Firebase authentication error occurred",
        details: errorMessage,
        originalError: errorMessage,
      };
    }

    // Check for Firebase Database errors
    if (
      errorMessage.includes("PERMISSION_DENIED") ||
      errorMessage.includes("permission_denied")
    ) {
      return {
        code: ErrorCodes.PERMISSION_DENIED,
        message: "Database permission denied. Check Firebase security rules",
        details: "The operation was rejected by database security rules",
        originalError: errorMessage,
      };
    }

    if (
      errorMessage.includes("UNAVAILABLE") ||
      errorMessage.includes("network") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      return {
        code: ErrorCodes.DATABASE_CONNECTION_ERROR,
        message: "Unable to connect to the database",
        details: "Network error or database service unavailable",
        originalError: errorMessage,
      };
    }

    // Check for JSON parse errors
    if (
      errorMessage.includes("JSON") ||
      errorMessage.includes("Unexpected token")
    ) {
      return {
        code: ErrorCodes.VALIDATION_ERROR,
        message: "Invalid JSON in request body",
        details: "The request body could not be parsed as valid JSON",
        originalError: errorMessage,
      };
    }

    // Check for bcrypt errors
    if (errorMessage.includes("bcrypt") || errorName === "BcryptError") {
      return {
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Password hashing failed",
        details: "Error occurred during password processing",
        originalError: errorMessage,
      };
    }

    // Check for email service errors
    if (
      errorMessage.includes("email") ||
      errorMessage.includes("SMTP") ||
      errorMessage.includes("nodemailer")
    ) {
      return {
        code: ErrorCodes.EMAIL_SERVICE_ERROR,
        message: "Email service error",
        details: "Failed to send email. Please check email configuration",
        originalError: errorMessage,
      };
    }

    // Check for FCM errors
    if (errorMessage.includes("messaging") || errorMessage.includes("FCM")) {
      return {
        code: ErrorCodes.FCM_ERROR,
        message: "Push notification service error",
        details: "Failed to send push notification",
        originalError: errorMessage,
      };
    }

    // Default error
    return {
      code: ErrorCodes.INTERNAL_ERROR,
      message: errorMessage || "An unexpected error occurred",
      originalError: errorMessage,
    };
  }

  // Handle non-Error objects
  if (typeof error === "string") {
    return {
      code: ErrorCodes.INTERNAL_ERROR,
      message: error,
    };
  }

  return {
    code: ErrorCodes.UNKNOWN_ERROR,
    message: "An unknown error occurred",
    details: JSON.stringify(error),
  };
}

// Create error response
export function createErrorResponse(
  error: unknown,
  context: {
    operation: string;
    resourceType?: string;
    resourceId?: string;
    path?: string;
  },
  statusCode: number = 500,
): NextResponse<ApiErrorResponse> {
  const parsed = parseError(error);

  // Log detailed error for debugging
  console.error(`\n❌ ============================================`);
  console.error(`❌ API Error in ${context.operation}`);
  console.error(`❌ Timestamp: ${new Date().toISOString()}`);
  console.error(
    `❌ Resource: ${context.resourceType || "N/A"} ${context.resourceId || ""}`,
  );
  console.error(`❌ Error Code: ${parsed.code}`);
  console.error(`❌ Message: ${parsed.message}`);
  if (parsed.details) console.error(`❌ Details: ${parsed.details}`);
  if (parsed.originalError)
    console.error(`❌ Original Error: ${parsed.originalError}`);
  if (error instanceof Error && error.stack) {
    console.error(`❌ Stack Trace: ${error.stack}`);
  }
  console.error(`❌ ============================================\n`);

  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: parsed.code,
      message: parsed.message,
      details: parsed.details,
      timestamp: new Date().toISOString(),
      path: context.path,
    },
  };

  return NextResponse.json(errorResponse, { status: statusCode });
}

// Validation error helper
export function createValidationError(
  field: string,
  message: string,
  path?: string,
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: ErrorCodes.MISSING_REQUIRED_FIELD,
      message,
      field,
      timestamp: new Date().toISOString(),
      path,
    },
  };

  console.error(`\n⚠️ Validation Error: ${message} (field: ${field})\n`);

  return NextResponse.json(errorResponse, { status: 400 });
}

// Not found error helper
export function createNotFoundError(
  resourceType: string,
  resourceId: string,
  path?: string,
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: ErrorCodes.NOT_FOUND,
      message: `${resourceType} with ID '${resourceId}' not found`,
      timestamp: new Date().toISOString(),
      path,
    },
  };

  console.error(`\n🔍 Not Found: ${resourceType} '${resourceId}'\n`);

  return NextResponse.json(errorResponse, { status: 404 });
}

// Conflict error helper
export function createConflictError(
  message: string,
  details?: string,
  path?: string,
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: ErrorCodes.CONFLICT,
      message,
      details,
      timestamp: new Date().toISOString(),
      path,
    },
  };

  console.error(`\n⚠️ Conflict: ${message}\n`);

  return NextResponse.json(errorResponse, { status: 409 });
}
