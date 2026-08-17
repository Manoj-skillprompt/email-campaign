"use client";

import { useEffect, useRef, useState } from "react";

import type { Contact } from "@/types/contact";
import type { Group } from "@/types/group";

const AVATAR_COLORS = ["#007bff", "#4f46e5", "#10b981", "#f59e0b"];
const MAX_AVATARS = 4;

interface GroupCardProps {
  group: Group;
  members: Contact[];
  onManage: (group: Group) => void;
  onDelete: (group: Group) => void;
}

export function GroupCard({ group, members, onManage, onDelete }: GroupCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-border bg-white p-6">
      <div className="flex w-full items-center justify-between">
        <p className="text-lg font-bold text-foreground">{group.name}</p>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label={`More options for ${group.name}`}
            onClick={() => setMenuOpen((open) => !open)}
            className="opacity-70 hover:opacity-100"
          >
            <img src="/icons/more.svg" alt="" className="size-4" width={16} height={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-10 w-40 rounded-md border border-border bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(group);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-background"
              >
                Delete Group
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-foreground-muted">{group.contactCount} contacts matched</p>

      <div className="flex w-full items-center justify-between">
        <div className="flex h-8 items-center">
          {members.slice(0, MAX_AVATARS).map((member, index) => (
            <div
              key={member.id}
              style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length], marginLeft: index === 0 ? 0 : -8 }}
              className="flex size-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white"
            >
              {member.name.trim().charAt(0).toUpperCase() || "?"}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onManage(group)}
          className="flex items-center gap-1.5 rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-border"
        >
          <img src="/icons/pencil.svg" alt="" className="size-3.5" width={14} height={14} />
          Manage Group
        </button>
      </div>
    </div>
  );
}
