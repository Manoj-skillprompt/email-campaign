export interface MockContactRef {
  id: string;
  name: string;
}

export interface InitialMockGroup {
  id: string;
  name: string;
  members: MockContactRef[];
  createdAt: string;
  updatedAt: string;
}

export const initialMockGroups: InitialMockGroup[] = [
  {
    id: "b2b5b8e2-1a2b-4c3d-9e0f-000000000001",
    name: "Small Real Email Group",
    members: [
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000001", name: "Saraswoti Pandey" },
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000002", name: "Rajesh Shrestha" },
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000003", name: "Bikash Thapa" },
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000004", name: "Anita Gurung" },
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000005", name: "Sunita KC" },
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000006", name: "Bipin Rai" },
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000007", name: "Alina Shah" },
    ],
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "b2b5b8e2-1a2b-4c3d-9e0f-000000000002",
    name: "Newsletter Subscribers",
    members: [
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000001", name: "Saraswoti Pandey" },
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000002", name: "Rajesh Shrestha" },
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000003", name: "Bikash Thapa" },
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000004", name: "Anita Gurung" },
    ],
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z",
  },
  {
    id: "b2b5b8e2-1a2b-4c3d-9e0f-000000000003",
    name: "VIP Customers",
    members: [
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000008", name: "Suresh Karki" },
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000002", name: "Rajesh Shrestha" },
      { id: "d2b5b8e2-0000-4c3d-9e0f-000000000009", name: "Bina Adhikari" },
    ],
    createdAt: "2026-07-10T00:00:00.000Z",
    updatedAt: "2026-07-10T00:00:00.000Z",
  },
];
