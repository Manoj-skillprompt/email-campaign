"use client";

import { useEffect, useRef, useState } from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useGroupsQuery } from "@/features/groups/use-groups";

import { ALLOWED_SENDERS, type Campaign } from "../campaign.types";

export interface ComposerFormValues {
  name: string;
  subject: string;
  senderEmail: string;
  groupIds: string[];
  content: string;
}

function toFormValues(campaign: Campaign | null): ComposerFormValues {
  if (!campaign) {
    return { name: "", subject: "", senderEmail: "", groupIds: [], content: "" };
  }
  return {
    name: campaign.name,
    subject: campaign.subject,
    senderEmail: campaign.senderEmail,
    groupIds: campaign.groupIds,
    content: campaign.content,
  };
}

function isFullyValid(values: ComposerFormValues): boolean {
  return (
    values.name.trim().length > 0 &&
    values.subject.trim().length > 0 &&
    values.senderEmail.trim().length > 0 &&
    values.groupIds.length > 0
  );
}

interface CampaignComposerModalProps {
  open: boolean;
  campaign: Campaign | null;
  onOpenChange: (open: boolean) => void;
  onSaveDraft: (id: string | null, values: ComposerFormValues) => Promise<Campaign>;
  onSchedule: (id: string | null, values: ComposerFormValues, scheduledAt: string) => Promise<Campaign>;
  onSendNow: (id: string | null, values: ComposerFormValues) => Promise<Campaign>;
  onTrash: (campaign: Campaign) => void;
}

export function CampaignComposerModal({
  open,
  campaign,
  onOpenChange,
  onSaveDraft,
  onSchedule,
  onSendNow,
  onTrash,
}: CampaignComposerModalProps) {
  const [values, setValues] = useState<ComposerFormValues>(() => toFormValues(campaign));
  const [persisted, setPersisted] = useState<Campaign | null>(campaign);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showScheduleInput, setShowScheduleInput] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const groupsQuery = useGroupsQuery("");
  const allGroups = groupsQuery.data?.body ?? [];

  useEffect(() => {
    if (open) {
      setValues(toFormValues(campaign));
      setPersisted(campaign);
      setError(null);
      setShowScheduleInput(false);
      setScheduledAt("");
    }
  }, [open, campaign]);

  const readOnly = persisted?.status === "SENT";

  const close = () => onOpenChange(false);

  const insertPersonalizationToken = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${values.content.slice(0, start)}{{name}}${values.content.slice(end)}`;
    setValues((current) => ({ ...current, content: next }));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 8, start + 8);
    });
  };

  const addGroup = (groupId: string) => {
    if (!groupId || values.groupIds.includes(groupId)) return;
    setValues((current) => ({ ...current, groupIds: [...current.groupIds, groupId] }));
  };

  const removeGroup = (groupId: string) => {
    setValues((current) => ({ ...current, groupIds: current.groupIds.filter((id) => id !== groupId) }));
  };

  const handleSaveDraft = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const saved = await onSaveDraft(persisted?.id ?? null, values);
      setPersisted(saved);
      close();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSchedule = async () => {
    if (!isFullyValid(values)) {
      setError("Name, subject, sender, and at least one group are required to schedule a campaign.");
      return;
    }
    if (!scheduledAt) {
      setError("Choose a date and time to schedule this campaign.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const saved = await onSchedule(persisted?.id ?? null, values, new Date(scheduledAt).toISOString());
      setPersisted(saved);
      close();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendNow = async () => {
    if (!isFullyValid(values)) {
      setError("Name, subject, sender, and at least one group are required to send a campaign.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const saved = await onSendNow(persisted?.id ?? null, values);
      setPersisted(saved);
      close();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrash = () => {
    if (persisted) {
      onTrash(persisted);
    }
    close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] w-[1296px] max-w-[95vw] flex-col gap-0 overflow-hidden p-0">
        <div className="flex w-full items-center justify-between bg-[#0040a5] p-6">
          <p className="text-[16px] font-bold text-white">
            {persisted ? persisted.name || "Campaign" : "New Campaign"}
          </p>
          <button type="button" onClick={close} aria-label="Close">
            <img src="/icons/campaign/close-white.svg" alt="" className="size-[18px]" />
          </button>
        </div>

        <div className="flex flex-1 items-stretch overflow-y-auto">
          <div className="flex w-[780px] shrink-0 flex-col gap-6 p-8">
            <input
              type="text"
              value={values.name}
              disabled={readOnly}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              placeholder="Campaign name"
              aria-label="Campaign name"
              className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none disabled:bg-background"
            />
            <input
              type="text"
              value={values.subject}
              disabled={readOnly}
              onChange={(event) => setValues((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Subject"
              aria-label="Subject"
              className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none disabled:bg-background"
            />
            <select
              value={values.senderEmail}
              disabled={readOnly}
              onChange={(event) => setValues((current) => ({ ...current, senderEmail: event.target.value }))}
              aria-label="Sender"
              className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm text-foreground focus:outline-none disabled:bg-background"
            >
              <option value="">Select a sender...</option>
              {ALLOWED_SENDERS.map((sender) => (
                <option key={sender.email} value={sender.email}>
                  {sender.label}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[#374151]">Groups:</span>
              {values.groupIds.map((groupId) => {
                const group = allGroups.find((item) => item.id === groupId);
                return (
                  <span
                    key={groupId}
                    className="flex items-center gap-1.5 rounded-full bg-[#e6f7ff] px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {group?.name ?? groupId}
                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() => removeGroup(groupId)}
                        aria-label={`Remove ${group?.name ?? "group"}`}
                      >
                        ×
                      </button>
                    ) : null}
                  </span>
                );
              })}
              {!readOnly ? (
                <select
                  value=""
                  onChange={(event) => addGroup(event.target.value)}
                  aria-label="Add group to audience"
                  className="rounded-md border-none bg-transparent text-[13px] font-medium text-primary focus:outline-none"
                >
                  <option value="">+ Add group</option>
                  {allGroups
                    .filter((group) => !values.groupIds.includes(group.id))
                    .map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                </select>
              ) : null}
              {!readOnly ? (
                <button
                  type="button"
                  onClick={insertPersonalizationToken}
                  className="text-[13px] font-medium text-primary"
                >
                  + Personalize
                </button>
              ) : null}
            </div>

            <textarea
              ref={contentRef}
              value={values.content}
              disabled={readOnly}
              onChange={(event) => setValues((current) => ({ ...current, content: event.target.value }))}
              placeholder={"Hi {{name}},\n\nWrite your email here...\n\nBest,\nThe Team"}
              rows={9}
              aria-label="Email body"
              className="w-full flex-1 resize-none rounded-md border border-border bg-white p-4 text-sm text-[#374151] placeholder:text-foreground-subtle focus:outline-none disabled:bg-background"
            />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            {!readOnly ? (
              <div className="flex flex-col gap-3 border-t border-border pt-6">
                {showScheduleInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(event) => setScheduledAt(event.target.value)}
                      aria-label="Scheduled date and time"
                      className="rounded-md border border-border px-3 py-2 text-sm text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmSchedule}
                      disabled={isSaving}
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                      Confirm Schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowScheduleInput(false)}
                      className="text-sm font-medium text-foreground-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowScheduleInput(true)}
                        className="flex items-center gap-1.5 rounded-md border border-[#d1d5db] px-3.5 py-2 text-[13px] font-medium text-foreground-muted"
                      >
                        <img src="/icons/campaign/clock.svg" alt="" className="size-3.5" />
                        Schedule for later
                      </button>
                      <button
                        type="button"
                        onClick={handleSendNow}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                      >
                        <img src="/icons/campaign/plane.svg" alt="" className="size-3.5" />
                        Send now
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="rounded-md border border-[#d1d5db] px-[18px] py-2.5 text-sm font-medium text-[#374151]"
                      >
                        Save draft
                      </button>
                      <button
                        type="button"
                        onClick={handleTrash}
                        className="flex items-center gap-1.5 rounded-md border border-[#d1d5db] px-[18px] py-2.5 text-sm font-medium text-[#374151]"
                      >
                        <img src="/icons/campaign/trash.svg" alt="" className="size-3.5" />
                        Trash
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col items-center gap-4 bg-background p-8">
            <div className="flex flex-col items-center gap-1 text-center text-xs">
              <p className="font-bold text-foreground-subtle">PREVIEW</p>
              <p className="text-foreground-muted">{values.subject || "Subject"}</p>
            </div>
            <div className="w-[380px] whitespace-pre-wrap rounded-xl border border-border bg-white p-6 text-sm text-[#374151]">
              {values.content || "Hi {{name}},\n\nWrite your email here...\n\nBest,\nThe Team"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
