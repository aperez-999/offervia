type AuthErrorContext = "login" | "signup" | "forgot-password" | "reset-password" | "oauth";

type SignUpResponseLike = {
  user?: {
    identities?: unknown[] | null;
  } | null;
  session?: unknown | null;
};

function normalizeMessage(error: unknown) {
  if (error instanceof Error) return error.message.toLowerCase();
  if (typeof error === "string") return error.toLowerCase();
  if (typeof error === "object" && error && "message" in error) {
    const value = (error as { message?: unknown }).message;
    return typeof value === "string" ? value.toLowerCase() : "";
  }
  return "";
}

export function getAuthErrorMessage(error: unknown, context: AuthErrorContext) {
  const message = normalizeMessage(error);

  if (context === "login") {
    if (
      message.includes("invalid login credentials") ||
      message.includes("invalid credentials") ||
      message.includes("email not confirmed")
    ) {
      return "We couldn't sign you in with those credentials.";
    }
    return "We couldn't sign you in. Please try again.";
  }

  if (context === "signup") {
    if (message.includes("already registered") || message.includes("user already registered")) {
      return "An account with that email already exists.";
    }
    return "We couldn't create your account. Please try again.";
  }

  if (context === "forgot-password") {
    return "We couldn't send a reset email right now. Please try again.";
  }

  if (context === "reset-password") {
    return "We couldn't update your password. Please try again.";
  }

  return "We couldn't continue the sign-in flow. Please try again.";
}

export function isObfuscatedExistingSignupResponse(data: SignUpResponseLike | null | undefined) {
  return !data?.session && Array.isArray(data?.user?.identities) && data.user.identities.length === 0;
}
