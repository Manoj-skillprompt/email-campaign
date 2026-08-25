interface CampaignSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function CampaignSearchBar({ value, onChange }: CampaignSearchBarProps) {
  return (
    <div className="flex w-[320px] items-center gap-2 rounded-md border border-border bg-[#f9fafb] px-4 py-[10px]">
      <img src="/icons/campaign/search.svg" alt="" className="size-4 shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search campaigns..."
        aria-label="Search campaigns"
        className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
      />
    </div>
  );
}
