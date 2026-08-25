import { contactsContract } from "@email-campaign-v2/contracts";
import { initTsrReactQuery } from "@ts-rest/react-query/v5";

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export const tsr = initTsrReactQuery(contactsContract, {
  baseUrl: BACKEND_URL,
  baseHeaders: {},
});
