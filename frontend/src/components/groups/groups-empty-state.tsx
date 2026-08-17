import { Button } from "@/components/ui/button";

interface GroupsEmptyStateProps {
  onCreateGroup: () => void;
}

export function GroupsEmptyState({ onCreateGroup }: GroupsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm font-semibold text-foreground">No groups found</p>
      <p className="text-sm text-foreground-muted">Try a different search, or create a new group.</p>
      <Button onClick={onCreateGroup} className="mt-2">
        Create Group
      </Button>
    </div>
  );
}
