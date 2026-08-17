import type { Contact } from "@/types/contact";
import type { Group } from "@/types/group";
import { GroupCard } from "@/components/groups/group-card";

interface GroupGridProps {
  groups: Group[];
  membersByGroupId: Record<string, Contact[]>;
  onManage: (group: Group) => void;
  onDelete: (group: Group) => void;
}

export function GroupGrid({ groups, membersByGroupId, onManage, onDelete }: GroupGridProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          members={membersByGroupId[group.id] ?? []}
          onManage={onManage}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
