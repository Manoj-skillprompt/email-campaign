import type { GroupWithMembers } from "../group.types";
import { GroupCard } from "./group-card";

interface GroupGridProps {
  groups: GroupWithMembers[];
  onEdit: (group: GroupWithMembers) => void;
  onDelete: (group: GroupWithMembers) => void;
  onManage: (group: GroupWithMembers) => void;
}

export function GroupGrid({ groups, onEdit, onDelete, onManage }: GroupGridProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} onEdit={onEdit} onDelete={onDelete} onManage={onManage} />
      ))}
    </div>
  );
}
