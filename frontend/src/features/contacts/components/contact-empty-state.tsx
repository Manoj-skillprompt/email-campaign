import { Button } from "@/components/ui/button";

interface ContactEmptyStateProps {
  onAddContact: () => void;
}

export function ContactEmptyState({ onAddContact }: ContactEmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4 py-16 text-center">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">No contacts found</p>
        <p className="text-sm text-foreground-muted">Try adjusting your search or add a new contact.</p>
      </div>
      <Button type="button" onClick={onAddContact}>
        <img src="/icons/contacts/plus.svg" alt="" className="size-3.5" />
        Add Contact
      </Button>
    </div>
  );
}
