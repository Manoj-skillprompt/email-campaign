interface ContactAvatarProps {
  name: string;
}

export function ContactAvatar({ name }: ContactAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">
      {initial}
    </div>
  );
}
