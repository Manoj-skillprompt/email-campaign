import type { GroupFormValues } from "@/lib/validation/group-schema";

const KNOWN_FIELDS: (keyof GroupFormValues)[] = ["name"];

export class GroupFieldError extends Error {
  constructor(
    public readonly field: keyof GroupFormValues,
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

export function toGroupFieldError(error: unknown): GroupFieldError {
  const body: unknown = isTsRestErrorLike(error) ? error.body : error;
  const errorBody = (body && typeof body === "object" ? body : {}) as KnownErrorBody;

  const fieldIssue = errorBody.issues?.find((issue) => KNOWN_FIELDS.includes(issue.path[0] as keyof GroupFormValues));
  if (fieldIssue) {
    return new GroupFieldError(fieldIssue.path[0] as keyof GroupFormValues, fieldIssue.message);
  }

  const message = typeof errorBody.message === "string" ? errorBody.message : "Something went wrong. Please try again.";
  return new GroupFieldError("name", message);
}
