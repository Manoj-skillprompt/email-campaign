import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CampaignStatus, CreateCampaignInput, UpdateCampaignInput } from "./campaign.types";
import {
  createCampaign,
  deleteCampaign,
  listCampaigns,
  scheduleCampaign,
  sendCampaignNow,
  updateCampaign,
} from "./campaigns.mock-api";

const campaignsQueryKey = (search?: string, status?: CampaignStatus) =>
  ["campaigns", { search: search ?? "", status: status ?? "" }] as const;

export function useCampaignsQuery(search: string, status?: CampaignStatus) {
  return useQuery({
    queryKey: campaignsQueryKey(search, status),
    queryFn: () => listCampaigns({ search, status }),
  });
}

export function useCreateCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCampaignInput) => createCampaign(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCampaignInput }) => updateCampaign(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useScheduleCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) => scheduleCampaign(id, scheduledAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useSendCampaignNowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendCampaignNow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useDeleteCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}
