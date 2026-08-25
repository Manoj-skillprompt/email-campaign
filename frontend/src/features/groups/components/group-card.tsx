"use client";

import { useEffect, useRef, useState } from "react";

import type { GroupWithMembers } from "../groups.mock-api";

const AVATAR_COLORS = ["#007bff", "#4f46e5", "#10b981", "#f59e0b"];
const MAX_AVATARS = 4;

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

interface GroupCardProps {
  group: GroupWithMembers;
  onEdit: (group: GroupWithMembers) => void;
  onDelete: (group: GroupWithMembers) => void;
  onManage: (group: GroupWithMembers) => void;
}

export function GroupCard({ group, onEdit, onDelete, onManage }: GroupCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const previewMembers = group.members.slice(0, MAX_AVATARS);

  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-white p-6">
      <div className="flex w-full items-center justify-between">
        <p className="text-[18px] font-bold text-foreground">{group.name}</p>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label={`More actions for ${group.name}`}
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded p-1 hover:opacity-70"
          >
            <img src="/icons/groups/more.svg" alt="" className="size-4" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border border-border bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(group);
                }}
                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-background"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(group);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-background"
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-foreground-muted">{group.contactIds.length} contacts matched</p>

      <div className="flex w-full items-center justify-between">
        <div className="relative h-8" style={{ width: `${previewMembers.length * 22 + 10}px` }}>
          {previewMembers.map((member, index) => (
            <div
              key={member.id}
              className="absolute top-0 flex size-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white"
              style={{ left: `${index * 22}px`, backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
            >
              {initialOf(member.name)}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onManage(group)}
          className="flex items-center gap-1.5 rounded-lg bg-background px-4 py-2 text-sm font-medium text-foreground-muted hover:opacity-80"
        >
          <img src="/icons/groups/pencil.svg" alt="" className="size-3.5" />
          Manage Group
        </button>
      </div>
    </div>
  );
}
