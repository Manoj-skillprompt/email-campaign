import { useQueryClient } from "@tanstack/react-query";

import { tsrCampaigns } from "@/lib/api-client";

import type { CampaignStatus } from "./campaign.types";

export function useCampaignsQuery(search: string, status?: CampaignStatus) {
  return tsrCampaigns.listCampaigns.useQuery({
    queryKey: ["campaigns", { search, status: status ?? "" }],
    queryData: { query: { search: search || undefined, status } },
  });
}

export function useCreateCampaignMutation() {
  const queryClient = useQueryClient();
  return tsrCampaigns.createCampaign.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateCampaignMutation() {
  const queryClient = useQueryClient();
  return tsrCampaigns.updateCampaign.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useScheduleCampaignMutation() {
  const queryClient = useQueryClient();
  return tsrCampaigns.scheduleCampaign.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useSendCampaignNowMutation() {
  const queryClient = useQueryClient();
  return tsrCampaigns.sendCampaignNow.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useDeleteCampaignMutation() {
  const queryClient = useQueryClient();
  return tsrCampaigns.deleteCampaign.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}
