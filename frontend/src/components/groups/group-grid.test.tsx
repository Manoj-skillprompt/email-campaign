import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GroupGrid } from "./group-grid";
import type { Group } from "@/types/group";

const GROUPS: Group[] = [
  {
    id: "g1",
    name: "VIP Customers",
    contactCount: 3,
    contactIds: ["c1", "c2", "c3"],
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
  },
  {
    id: "g2",
    name: "Newsletter Subscribers",
    contactCount: 0,
    contactIds: [],
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
  },
];

describe("GroupGrid/GroupCard (T15)", () => {
  it("renders Group Name and Contact Count for each group", () => {
    render(<GroupGrid groups={GROUPS} membersByGroupId={{}} onManage={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("VIP Customers")).toBeInTheDocument();
    expect(screen.getByText("3 contacts matched")).toBeInTheDocument();
    expect(screen.getByText("Newsletter Subscribers")).toBeInTheDocument();
    expect(screen.getByText("0 contacts matched")).toBeInTheDocument();
  });
});
