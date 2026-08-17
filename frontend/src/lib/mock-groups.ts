import type { Contact } from "@/types/contact";

export interface MockGroupSeed {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

function contact(id: string, name: string, email: string, branch: string): Contact {
  const now = new Date("2026-08-10T09:00:00.000Z").toISOString();
  return { id, clientId: `LOCAL-${id}`, name, email, branch, createdAt: now, updatedAt: now };
}

export const mockContacts: Contact[] = [
  contact("c1", "Saroj Husband", "saroj.husband@mailinator.com", "Kathmandu"),
  contact("c2", "Krishna Belbase", "krishna.belbase@mailinator.com", "Pokhara"),
  contact("c3", "Gita Pandey", "gita.pandey@mailinator.com", "Lalitpur"),
  contact("c4", "Ramesh Koirala", "ramesh.koirala@gmail.com", "Biratnagar"),
  contact("c5", "Sabina Lama", "sabina.lama@gmail.com", "Chitwan"),
  contact("c6", "Dipesh Rana", "dipesh.rana@gmail.com", "Butwal"),
  contact("c7", "Nisha Basnet", "nisha.basnet@gmail.com", "Dharan"),
];

function seed(id: string, name: string): MockGroupSeed {
  const now = new Date("2026-08-12T09:00:00.000Z").toISOString();
  return { id, name, createdAt: now, updatedAt: now };
}

export const initialGroupSeeds: MockGroupSeed[] = [
  seed("g1", "Small Real Email Group"),
  seed("g2", "Newsletter Subscribers"),
  seed("g3", "VIP Customers"),
];

export const initialGroupMembership: Record<string, string[]> = {
  g1: ["c1", "c2", "c3", "c4"],
  g2: ["c1", "c2", "c3", "c4", "c5", "c6"],
  g3: ["c5", "c6", "c7"],
};
