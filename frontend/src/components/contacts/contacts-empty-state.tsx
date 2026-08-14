import { Button } from "@/components/ui/button";

interface ContactsEmptyStateProps {
  onAddContact: () => void;
}

export function ContactsEmptyState({ onAddContact }: ContactsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm font-semibold text-foreground">No contacts found</p>
      <p className="text-sm text-foreground-muted">Try a different search, or add a new contact.</p>
      <Button onClick={onAddContact} className="mt-2">
        Add Contact
      </Button>
    </div>
  );
}
