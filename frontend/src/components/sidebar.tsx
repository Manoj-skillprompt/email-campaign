"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Contacts",
    href: "/contacts",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16.6667 17.5V15.8333C16.6667 14.9493 16.3155 14.1017 15.6904 13.4766C15.0652 12.8515 14.2174 12.5 13.3333 12.5H6.66667C5.78261 12.5 4.93477 12.8515 4.30964 13.4766C3.68452 14.1017 3.33333 14.9493 3.33333 15.8333V17.5"
          stroke={active ? "#007bff" : "#6b7280"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 9.16667C11.8409 9.16667 13.3333 7.67428 13.3333 5.83333C13.3333 3.99238 11.8409 2.5 10 2.5C8.15905 2.5 6.66667 3.99238 6.66667 5.83333C6.66667 7.67428 8.15905 9.16667 10 9.16667Z"
          stroke={active ? "#007bff" : "#6b7280"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Groups",
    href: "/groups",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M13.3333 11.6667C14.6594 11.6667 15.9312 12.1935 16.8689 13.1312C17.8066 14.0689 18.3333 15.3407 18.3333 16.6667V17.5"
          stroke={active ? "#007bff" : "#6b7280"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.3333 11.6667C11.5652 11.6667 10.1212 13.1107 10.1212 14.8788C10.1212 15.525 10.3062 16.145 10.6415 16.6667H3.33333C2.44928 16.6667 1.60143 16.3155 0.976311 15.6904C0.351189 15.0652 0 14.2174 0 13.3333V12.5C0 11.616 0.351189 10.7681 0.976311 10.143C1.60143 9.51786 2.44928 9.16667 3.33333 9.16667H5C5.88405 9.16667 6.7319 9.51786 7.35702 10.143C7.98215 10.7681 8.33333 11.616 8.33333 12.5V12.9167"
          stroke={active ? "#007bff" : "#6b7280"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="10"
          cy="5"
          r="3.33333"
          stroke={active ? "#007bff" : "#6b7280"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Campaigns",
    href: "/campaign",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M17.5 3.33334L10 8.33334L2.5 3.33334V16.6667C2.5 17.1087 2.67559 17.5326 2.98816 17.8452C3.30072 18.1577 3.72464 18.3333 4.16667 18.3333H15.8333C16.2754 18.3333 16.6993 18.1577 17.0118 17.8452C17.3244 17.5326 17.5 17.1087 17.5 16.6667V3.33334Z"
          stroke={active ? "#007bff" : "#6b7280"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.5 3.33334L10 8.33334L17.5 3.33334"
          stroke={active ? "#007bff" : "#6b7280"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-white">
      <div className="flex h-16 items-center border-b border-border px-5">
        <span className="text-lg font-bold text-foreground">Email Campaign</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-muted hover:bg-background hover:text-foreground"
              )}
            >
              {item.icon(isActive)}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
