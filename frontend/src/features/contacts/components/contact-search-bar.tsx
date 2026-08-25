interface ContactSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function ContactSearchBar({ value, onChange }: ContactSearchBarProps) {
  return (
    <div className="flex w-[320px] items-center gap-2 rounded-md border border-border bg-background px-4 py-[10px]">
      <img src="/icons/contacts/search.svg" alt="" className="size-4 shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search contacts..."
        aria-label="Search contacts"
        className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
      />
    </div>
  );
}
