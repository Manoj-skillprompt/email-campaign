"use client";

import { useMemo, useState } from "react";

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
import { MOCK_CAMPAIGNS, MOCK_TARGET_GROUPS } from "@/lib/campaign-mock-data";
import { isEditable, matchesStatusTab, type CampaignStatusTab } from "@/lib/campaign-status";
import type { CampaignFormValues } from "@/lib/validation/campaign-schema";
import type { Campaign } from "@/types/campaign";

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

  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
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

  const upsertCampaign = (
    values: CampaignFormValues,
    campaign: Campaign | undefined,
    overrides: Partial<Campaign> = {}
  ): Campaign => {
    const now = new Date().toISOString();
    const saved: Campaign = campaign
      ? { ...campaign, ...values, updatedAt: now, ...overrides }
      : {
          id: crypto.randomUUID(),
          ...values,
          status: "Draft",
          scheduledAt: null,
          sentAt: null,
          createdAt: now,
          updatedAt: now,
          ...overrides,
        };

    setCampaigns((current) =>
      campaign ? current.map((existing) => (existing.id === campaign.id ? saved : existing)) : [saved, ...current]
    );

    return saved;
  };

  const handleSaveDraft = async (values: CampaignFormValues) => {
    upsertCampaign(values, editorModal?.campaign);
    showToast("Campaign saved as draft.");
  };

  const handleRequestSchedule = (values: CampaignFormValues) => {
    setScheduleRequest({ campaign: editorModal?.campaign, values });
  };

  const handleRequestSendNow = (values: CampaignFormValues) => {
    setSendNowRequest({ campaign: editorModal?.campaign, values });
  };

  const handleConfirmSchedule = (scheduledAt: string) => {
    if (!scheduleRequest) return;
    upsertCampaign(scheduleRequest.values, scheduleRequest.campaign, { status: "Scheduled", scheduledAt });
    setScheduleRequest(null);
    setEditorModal(null);
    showToast("Campaign scheduled successfully.");
  };

  const handleConfirmSendNow = () => {
    if (!sendNowRequest) return;
    const saved = upsertCampaign(sendNowRequest.values, sendNowRequest.campaign, { status: "Sending" });
    setCampaigns((current) =>
      current.map((existing) =>
        existing.id === saved.id ? { ...existing, status: "Sent", sentAt: new Date().toISOString() } : existing
      )
    );
    setSendNowRequest(null);
    setEditorModal(null);
    showToast("Campaign sent successfully.");
  };

  const handleDuplicate = (campaign: Campaign) => {
    const now = new Date().toISOString();
    const duplicate: Campaign = {
      id: crypto.randomUUID(),
      name: campaign.name,
      subject: campaign.subject,
      sender: campaign.sender,
      body: campaign.body,
      targetGroupIds: campaign.targetGroupIds,
      status: "Draft",
      scheduledAt: null,
      sentAt: null,
      createdAt: now,
      updatedAt: now,
    };
    setCampaigns((current) => [duplicate, ...current]);
    showToast("Campaign duplicated successfully.");
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

        {filteredCampaigns.length > 0 ? (
          <CampaignTable
            campaigns={filteredCampaigns}
            targetGroups={MOCK_TARGET_GROUPS}
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
        targetGroups={MOCK_TARGET_GROUPS}
        onSaveDraft={handleSaveDraft}
        onRequestSchedule={handleRequestSchedule}
        onRequestSendNow={handleRequestSendNow}
      />

      <CampaignDetailView
        campaign={detailCampaign}
        targetGroups={MOCK_TARGET_GROUPS}
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
        targetGroups={MOCK_TARGET_GROUPS}
        onOpenChange={(open) => {
          if (!open) setSendNowRequest(null);
        }}
        onConfirm={handleConfirmSendNow}
      />
    </main>
  );
}
