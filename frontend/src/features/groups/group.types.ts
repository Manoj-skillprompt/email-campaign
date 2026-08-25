import type { Group } from "@email-campaign-v2/contracts";

export type { Group, CreateGroupInput, UpdateGroupInput } from "@email-campaign-v2/contracts";

export interface GroupMember {
  id: string;
  name: string;
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
}
