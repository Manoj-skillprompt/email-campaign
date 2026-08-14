import { contactsContract } from "@email-campaign-v2/contracts";
import { initQueryClient } from "@ts-rest/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const apiClient = initQueryClient(contactsContract, {
  baseUrl: API_BASE_URL,
  baseHeaders: {},
});
