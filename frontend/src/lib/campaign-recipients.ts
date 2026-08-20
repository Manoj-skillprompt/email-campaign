import type { CampaignTargetGroup } from "@/types/campaign-target-group";

export function resolveRecipientCount(targetGroupIds: string[], targetGroups: CampaignTargetGroup[]): number {
  const groupsById = new Map(targetGroups.map((group) => [group.id, group]));
  const recipientIds = new Set<string>();
  for (const groupId of targetGroupIds) {
    const group = groupsById.get(groupId);
    if (!group) continue;
    for (const contactId of group.contactIds) {
      recipientIds.add(contactId);
    }
  }
  return recipientIds.size;
}
