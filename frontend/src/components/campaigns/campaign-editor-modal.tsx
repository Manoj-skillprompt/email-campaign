"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { Group } from "@email-campaign-v2/contracts";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_CAMPAIGN_BODY, DEFAULT_CAMPAIGN_SENDER } from "@/lib/campaign-defaults";
import { toCampaignFieldError } from "@/lib/campaign-form-errors";
import { isEditable } from "@/lib/campaign-status";
import { campaignFormSchema, type CampaignFormValues } from "@/lib/validation/campaign-schema";
import type { Campaign } from "@/types/campaign";

interface CampaignEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  campaign?: Campaign;
  targetGroups: Group[];
  onSaveDraft: (values: CampaignFormValues) => Promise<void>;
  onRequestSchedule: (values: CampaignFormValues) => void;
  onRequestSendNow: (values: CampaignFormValues) => void;
}

function defaultValuesFor(campaign?: Campaign): CampaignFormValues {
  return {
    name: campaign?.name ?? "",
    subject: campaign?.subject ?? "",
    sender: campaign?.sender ?? DEFAULT_CAMPAIGN_SENDER,
    body: campaign?.body ?? DEFAULT_CAMPAIGN_BODY,
    targetGroupIds: campaign?.targetGroupIds ?? [],
  };
}

export function CampaignEditorModal({
  open,
  onOpenChange,
  mode,
  campaign,
  targetGroups,
  onSaveDraft,
  onRequestSchedule,
  onRequestSendNow,
}: CampaignEditorModalProps) {
  const readOnly = campaign ? !isEditable(campaign.status) : false;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: defaultValuesFor(campaign),
  });

  useEffect(() => {
    if (open) reset(defaultValuesFor(campaign));
  }, [open, campaign, reset]);

  const values = watch();
  const selectedGroupIds = values.targetGroupIds;

  const toggleGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setValue(
        "targetGroupIds",
        selectedGroupIds.filter((id) => id !== groupId),
        { shouldValidate: true }
      );
    } else {
      setValue("targetGroupIds", [...selectedGroupIds, groupId], { shouldValidate: true });
    }
  };

  const submitSaveDraft = handleSubmit(async (formValues) => {
    try {
      await onSaveDraft(formValues);
      onOpenChange(false);
    } catch (error) {
      const fieldError = toCampaignFieldError(error);
      if (fieldError) {
        setError(fieldError.field, { type: "server", message: fieldError.message });
      }
      // Non-field errors (e.g. immutability conflicts) are surfaced via a toast by the parent;
      // swallow here so the modal stays open with entered values.
    }
  });

  const submitSchedule = handleSubmit((formValues) => {
    onRequestSchedule(formValues);
  });

  const submitSendNow = handleSubmit((formValues) => {
    onRequestSendNow(formValues);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Campaign" : readOnly ? campaign?.name : "Edit Campaign"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(event) => event.preventDefault()} noValidate className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-name">Name</Label>
              <Input
                id="campaign-name"
                placeholder="e.g. Welcome Series - August"
                aria-invalid={!!errors.name}
                disabled={readOnly}
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-subject">Subject</Label>
              <Input
                id="campaign-subject"
                placeholder="e.g. Welcome to the team!"
                aria-invalid={!!errors.subject}
                disabled={readOnly}
                {...register("subject")}
              />
              {errors.subject && <p className="text-xs text-red-600">{errors.subject.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-sender">Sender</Label>
              <Input
                id="campaign-sender"
                type="email"
                aria-invalid={!!errors.sender}
                disabled={readOnly}
                {...register("sender")}
              />
              {errors.sender && <p className="text-xs text-red-600">{errors.sender.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Target Groups</Label>
                <span className="text-xs text-foreground-muted">{selectedGroupIds.length} selected</span>
              </div>
              <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-md border border-border p-2">
                {targetGroups.map((group) => (
                  <label key={group.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-background">
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(group.id)}
                      onChange={() => toggleGroup(group.id)}
                      disabled={readOnly}
                      className="size-4 accent-primary"
                    />
                    <span className="text-sm font-medium text-foreground">{group.name}</span>
                  </label>
                ))}
              </div>
              {errors.targetGroupIds && <p className="text-xs text-red-600">{errors.targetGroupIds.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-body">Body</Label>
              <textarea
                id="campaign-body"
                rows={8}
                aria-invalid={!!errors.body}
                disabled={readOnly}
                className="w-full whitespace-pre-wrap rounded-md border border-border bg-white px-4 py-[10px] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 aria-invalid:border-red-500"
                {...register("body")}
              />
              {errors.body && <p className="text-xs text-red-600">{errors.body.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg bg-background p-6">
            <p className="text-xs font-bold text-foreground-subtle">PREVIEW</p>
            <p className="text-xs text-foreground-muted">{values.subject || "Subject"}</p>
            <div className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-white p-6 text-sm text-foreground">
              {values.body || DEFAULT_CAMPAIGN_BODY}
            </div>
          </div>
        </form>

        <DialogFooter className="justify-between">
          <div className="flex items-center gap-3">
            {!readOnly && (
              <Button type="button" variant="secondary" onClick={submitSchedule} disabled={isSubmitting}>
                Schedule for later
              </Button>
            )}
            {!readOnly && (
              <Button type="button" onClick={submitSendNow} disabled={isSubmitting}>
                Send now
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {readOnly ? "Close" : "Cancel"}
            </Button>
            {!readOnly && (
              <Button type="button" variant="secondary" onClick={submitSaveDraft} disabled={isSubmitting}>
                Save draft
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
