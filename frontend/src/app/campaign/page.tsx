"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CampaignComposerModal, type ComposerFormValues } from "@/features/campaign/components/campaign-composer-modal";
import { CampaignDeleteDialog } from "@/features/campaign/components/campaign-delete-dialog";
import { CampaignEmptyState } from "@/features/campaign/components/campaign-empty-state";
import { CampaignSearchBar } from "@/features/campaign/components/campaign-search-bar";
import { CampaignTable } from "@/features/campaign/components/campaign-table";
import { CampaignTabs, type CampaignTabValue } from "@/features/campaign/components/campaign-tabs";
import type { Campaign, CampaignWithAudience } from "@/features/campaign/campaign.types";
import {
  useCampaignsQuery,
  useCreateCampaignMutation,
  useDeleteCampaignMutation,
  useScheduleCampaignMutation,
  useSendCampaignNowMutation,
  useUpdateCampaignMutation,
} from "@/features/campaign/use-campaigns";
import { useGroupsQuery } from "@/features/groups/use-groups";

export default function CampaignPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<CampaignTabValue>("ALL");
  const [composerOpen, setComposerOpen] = useState(false);
  const [composingCampaign, setComposingCampaign] = useState<Campaign | null>(null);
  const [campaignPendingDelete, setCampaignPendingDelete] = useState<Campaign | null>(null);

  const { showToast } = useToast();
  const campaignsQuery = useCampaignsQuery(search, tab === "ALL" ? undefined : tab);
  const groupsQuery = useGroupsQuery("");
  const createCampaignMutation = useCreateCampaignMutation();
  const updateCampaignMutation = useUpdateCampaignMutation();
  const scheduleCampaignMutation = useScheduleCampaignMutation();
  const sendCampaignNowMutation = useSendCampaignNowMutation();
  const deleteCampaignMutation = useDeleteCampaignMutation();

  const campaigns = campaignsQuery.data ?? [];
  const groups = groupsQuery.data?.body ?? [];

  const campaignsWithAudience: CampaignWithAudience[] = useMemo(
    () =>
      campaigns.map((campaign) => ({
        ...campaign,
        audienceLabel:
          campaign.groupIds
            .map((id) => groups.find((group) => group.id === id)?.name)
            .filter(Boolean)
            .join(", ") || "—",
      })),
    [campaigns, groups]
  );

  const openComposerForCreate = () => {
    setComposingCampaign(null);
    setComposerOpen(true);
  };

  const openComposerForEdit = (campaign: CampaignWithAudience) => {
    setComposingCampaign(campaign);
    setComposerOpen(true);
  };

  const persistDraft = async (id: string | null, values: ComposerFormValues): Promise<Campaign> => {
    if (id === null) {
      const created = await createCampaignMutation.mutateAsync(values);
      return created;
    }
    return updateCampaignMutation.mutateAsync({ id, input: values });
  };

  const handleSaveDraft = async (id: string | null, values: ComposerFormValues): Promise<Campaign> => {
    const saved = await persistDraft(id, values);
    showToast("Campaign saved as draft.");
    return saved;
  };

  const handleSchedule = async (
    id: string | null,
    values: ComposerFormValues,
    scheduledAt: string
  ): Promise<Campaign> => {
    const saved = await persistDraft(id, values);
    const scheduled = await scheduleCampaignMutation.mutateAsync({ id: saved.id, scheduledAt });
    showToast("Campaign scheduled successfully.");
    return scheduled;
  };

  const handleSendNow = async (id: string | null, values: ComposerFormValues): Promise<Campaign> => {
    const saved = await persistDraft(id, values);
    const sent = await sendCampaignNowMutation.mutateAsync(saved.id);
    showToast("Campaign sent successfully.");
    return sent;
  };

  const handleTrash = (campaign: Campaign) => {
    setCampaignPendingDelete(campaign);
  };

  const handleDeleteConfirm = async (campaign: Campaign) => {
    await deleteCampaignMutation.mutateAsync(campaign.id);
    showToast("Campaign deleted successfully.");
    setCampaignPendingDelete(null);
  };

  return (
    <main className="flex flex-col items-start bg-background p-10">
      <div className="flex w-full items-center justify-between pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-foreground-muted">{campaignsWithAudience.length} total campaigns found</p>
        </div>
        <Button type="button" onClick={openComposerForCreate}>
          + New Campaign
        </Button>
      </div>

      <div className="flex w-full flex-col gap-6 rounded-lg bg-white p-6">
        <div className="flex w-full items-center justify-between pb-3">
          <CampaignTabs value={tab} onChange={setTab} />
          <CampaignSearchBar value={search} onChange={setSearch} />
        </div>

        {campaignsWithAudience.length > 0 ? (
          <CampaignTable
            campaigns={campaignsWithAudience}
            onOpen={openComposerForEdit}
            onDelete={(campaign) => setCampaignPendingDelete(campaign)}
          />
        ) : (
          <CampaignEmptyState onCreateCampaign={openComposerForCreate} />
        )}
      </div>

      <CampaignComposerModal
        open={composerOpen}
        campaign={composingCampaign}
        onOpenChange={setComposerOpen}
        onSaveDraft={handleSaveDraft}
        onSchedule={handleSchedule}
        onSendNow={handleSendNow}
        onTrash={handleTrash}
      />

      <CampaignDeleteDialog
        campaign={campaignPendingDelete}
        onOpenChange={(open) => {
          if (!open) setCampaignPendingDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </main>
  );
}
