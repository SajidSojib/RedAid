// Keep in sync with the backend milestones.ts
export const MILESTONES = [
  { badge: "BRONZE", count: 1, certificate: false },
  { badge: "SILVER", count: 3, certificate: true },
  { badge: "GOLD", count: 5, certificate: true },
  { badge: "DIAMOND", count: 10, certificate: true },
  { badge: "PLATINUM", count: 15, certificate: true },
] as const;
