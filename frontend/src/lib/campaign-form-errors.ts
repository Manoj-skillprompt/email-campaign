import type { CampaignFormValues } from "@/lib/validation/campaign-schema";

const KNOWN_FIELDS: (keyof CampaignFormValues)[] = ["name", "subject", "sender", "body", "targetGroupIds"];

export class CampaignFieldError extends Error {
  constructor(
    public readonly field: keyof CampaignFormValues,
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

function errorBodyOf(error: unknown): KnownErrorBody {
  const body: unknown = isTsRestErrorLike(error) ? error.body : error;
  return (body && typeof body === "object" ? body : {}) as KnownErrorBody;
}

export function toCampaignFieldError(error: unknown): CampaignFieldError | null {
  const errorBody = errorBodyOf(error);

  const fieldIssue = errorBody.issues?.find((issue) =>
    KNOWN_FIELDS.includes(issue.path[0] as keyof CampaignFormValues)
  );
  if (!fieldIssue) return null;

  return new CampaignFieldError(fieldIssue.path[0] as keyof CampaignFormValues, fieldIssue.message);
}

export function extractCampaignErrorMessage(error: unknown): string {
  const errorBody = errorBodyOf(error);
  return typeof errorBody.message === "string" ? errorBody.message : "Something went wrong. Please try again.";
}
