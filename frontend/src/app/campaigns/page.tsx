"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { CampaignDetailView } from "@/components/campaigns/campaign-detail-view";
import { CampaignEditorModal } from "@/components/campaigns/campaign-editor-modal";
import { CampaignSearch } from "@/components/campaigns/campaign-search";
import { CampaignStatusTabs } from "@/components/campaigns/campaign-status-tabs";
import { CampaignTable } from "@/components/campaigns/campaign-table";
import { CampaignsEmptyState } from "@/components/campaigns/campaigns-empty-state";
import { ScheduleCampaignDialog } from "@/components/campaigns/schedule-campaign-dialog";
import { SendNowDialog } from "@/components/campaigns/send-now-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { campaignsApiClient, groupsApiClient } from "@/lib/api-client";
import { extractCampaignErrorMessage } from "@/lib/campaign-form-errors";
import { isEditable, matchesStatusTab, type CampaignStatusTab } from "@/lib/campaign-status";
import type { CampaignFormValues } from "@/lib/validation/campaign-schema";
import type { Campaign } from "@/types/campaign";

const CAMPAIGNS_QUERY_KEY = ["campaigns"];
const GROUPS_QUERY_KEY = ["groups"];

interface PendingAction {
  campaign?: Campaign;
  values: CampaignFormValues;
}

function matchesSearch(campaign: Campaign, term: string): boolean {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;
  return campaign.name.toLowerCase().includes(normalized);
}

export default function CampaignsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaignsResponse, isLoading } = campaignsApiClient.getCampaigns.useQuery(CAMPAIGNS_QUERY_KEY, {
    query: {},
  });
  const campaigns = useMemo(() => campaignsResponse?.body ?? [], [campaignsResponse]);

  const groupsQuery = groupsApiClient.getGroups.useQuery(GROUPS_QUERY_KEY, { query: {} });
  const targetGroups = useMemo(() => groupsQuery.data?.body ?? [], [groupsQuery.data]);

  const createMutation = campaignsApiClient.createCampaign.useMutation();
  const updateMutation = campaignsApiClient.updateCampaign.useMutation();
  const scheduleMutation = campaignsApiClient.scheduleCampaign.useMutation();
  const sendNowMutation = campaignsApiClient.sendNow.useMutation();
  const duplicateMutation = campaignsApiClient.duplicateCampaign.useMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<CampaignStatusTab>("All");
  const [editorModal, setEditorModal] = useState<{ mode: "create" | "edit"; campaign?: Campaign } | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [scheduleRequest, setScheduleRequest] = useState<PendingAction | null>(null);
  const [sendNowRequest, setSendNowRequest] = useState<PendingAction | null>(null);

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter(
        (campaign) => matchesStatusTab(campaign.status, activeTab) && matchesSearch(campaign, searchTerm)
      ),
    [campaigns, activeTab, searchTerm]
  );

  const openCampaign = (campaign: Campaign) => {
    if (isEditable(campaign.status)) {
      setEditorModal({ mode: "edit", campaign });
    } else {
      setDetailCampaign(campaign);
    }
  };

  const invalidateCampaigns = () => queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });

  const upsertCampaign = async (values: CampaignFormValues, campaign?: Campaign): Promise<Campaign> => {
    if (campaign) {
      const response = await updateMutation.mutateAsync({ params: { id: campaign.id }, body: values });
      return response.body;
    }
    const response = await createMutation.mutateAsync({ body: values });
    return response.body;
  };

  const handleSaveDraft = async (values: CampaignFormValues) => {
    try {
      await upsertCampaign(values, editorModal?.campaign);
      await invalidateCampaigns();
      showToast("Campaign saved as draft.");
    } catch (error) {
      showToast(extractCampaignErrorMessage(error), "error");
      throw error;
    }
  };

  const handleRequestSchedule = (values: CampaignFormValues) => {
    setScheduleRequest({ campaign: editorModal?.campaign, values });
  };

  const handleRequestSendNow = (values: CampaignFormValues) => {
    setSendNowRequest({ campaign: editorModal?.campaign, values });
    void groupsQuery.refetch();
  };

  const handleConfirmSchedule = async (scheduledAt: string) => {
    if (!scheduleRequest) return;
    try {
      const campaign = await upsertCampaign(scheduleRequest.values, scheduleRequest.campaign);
      await scheduleMutation.mutateAsync({ params: { id: campaign.id }, body: { scheduledAt } });
      await invalidateCampaigns();
      setScheduleRequest(null);
      setEditorModal(null);
      showToast("Campaign scheduled successfully.");
    } catch (error) {
      showToast(extractCampaignErrorMessage(error), "error");
    }
  };

  const handleConfirmSendNow = async () => {
    if (!sendNowRequest) return;
    try {
      const campaign = await upsertCampaign(sendNowRequest.values, sendNowRequest.campaign);
      await sendNowMutation.mutateAsync({ params: { id: campaign.id } });
      await invalidateCampaigns();
      setSendNowRequest(null);
      setEditorModal(null);
      showToast("Campaign sent successfully.");
    } catch (error) {
      showToast(extractCampaignErrorMessage(error), "error");
    }
  };

  const handleDuplicate = async (campaign: Campaign) => {
    try {
      await duplicateMutation.mutateAsync({ params: { id: campaign.id } });
      await invalidateCampaigns();
      showToast("Campaign duplicated successfully.");
    } catch (error) {
      showToast(extractCampaignErrorMessage(error), "error");
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background p-10">
      <div className="mb-8 flex w-full items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-foreground-muted">{campaigns.length} total campaigns found</p>
        </div>
        <Button onClick={() => setEditorModal({ mode: "create" })}>+ New Campaign</Button>
      </div>

      <div className="flex w-full flex-col gap-6 rounded-lg bg-white p-6">
        <div className="flex w-full items-center justify-between pb-3">
          <CampaignStatusTabs value={activeTab} onChange={setActiveTab} />
          <CampaignSearch value={searchTerm} onChange={setSearchTerm} />
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-foreground-muted">Loading campaigns...</p>
        ) : filteredCampaigns.length > 0 ? (
          <CampaignTable
            campaigns={filteredCampaigns}
            targetGroups={targetGroups}
            onOpen={openCampaign}
            onDuplicate={handleDuplicate}
          />
        ) : (
          <CampaignsEmptyState onCreateCampaign={() => setEditorModal({ mode: "create" })} />
        )}
      </div>

      <CampaignEditorModal
        open={editorModal !== null}
        onOpenChange={(open) => {
          if (!open) setEditorModal(null);
        }}
        mode={editorModal?.mode ?? "create"}
        campaign={editorModal?.campaign}
        targetGroups={targetGroups}
        onSaveDraft={handleSaveDraft}
        onRequestSchedule={handleRequestSchedule}
        onRequestSendNow={handleRequestSendNow}
      />

      <CampaignDetailView
        campaign={detailCampaign}
        targetGroups={targetGroups}
        onOpenChange={(open) => {
          if (!open) setDetailCampaign(null);
        }}
      />

      <ScheduleCampaignDialog
        open={scheduleRequest !== null}
        campaignName={scheduleRequest?.values.name ?? ""}
        onOpenChange={(open) => {
          if (!open) setScheduleRequest(null);
        }}
        onConfirm={handleConfirmSchedule}
      />

      <SendNowDialog
        open={sendNowRequest !== null}
        campaignName={sendNowRequest?.values.name ?? ""}
        targetGroupIds={sendNowRequest?.values.targetGroupIds ?? []}
        targetGroups={targetGroups}
        onOpenChange={(open) => {
          if (!open) setSendNowRequest(null);
        }}
        onConfirm={handleConfirmSendNow}
      />
    </main>
  );
}
