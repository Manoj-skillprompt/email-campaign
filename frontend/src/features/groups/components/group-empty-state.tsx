import { Button } from "@/components/ui/button";

interface GroupEmptyStateProps {
  onCreateGroup: () => void;
}

export function GroupEmptyState({ onCreateGroup }: GroupEmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4 py-16 text-center">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">No groups found</p>
        <p className="text-sm text-foreground-muted">Try adjusting your search or create a new group.</p>
      </div>
      <Button type="button" onClick={onCreateGroup}>
        <img src="/icons/contacts/plus.svg" alt="" className="size-3.5" />
        Create Group
      </Button>
    </div>
  );
}
