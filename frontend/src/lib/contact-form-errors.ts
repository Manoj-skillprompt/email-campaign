import type { ContactFormValues } from "@/lib/validation/contact-schema";

const KNOWN_FIELDS: (keyof ContactFormValues)[] = ["name", "email", "branch"];

export class ContactFieldError extends Error {
  constructor(
    public readonly field: keyof ContactFormValues,
    message: string
  ) {
    super(message);
  }
}

interface ValidationIssue {
  path: (string | number)[];
  message: string;
}

interface KnownErrorBody {
  message?: unknown;
  issues?: ValidationIssue[];
}

function isTsRestErrorLike(value: unknown): value is { status: number; body: unknown } {
  return typeof value === "object" && value !== null && "status" in value && "body" in value;
}

export function toContactFieldError(error: unknown): ContactFieldError {
  const body: unknown = isTsRestErrorLike(error) ? error.body : error;
  const errorBody = (body && typeof body === "object" ? body : {}) as KnownErrorBody;

  const fieldIssue = errorBody.issues?.find((issue) => KNOWN_FIELDS.includes(issue.path[0] as keyof ContactFormValues));
  if (fieldIssue) {
    return new ContactFieldError(fieldIssue.path[0] as keyof ContactFormValues, fieldIssue.message);
  }

  const message = typeof errorBody.message === "string" ? errorBody.message : "Something went wrong. Please try again.";
  return new ContactFieldError("email", message);
}
