import { authedRequest } from "@/lib/server-api";

export type Milestone = {
  badge: string;
  count: number;
  hasCertificate: boolean;
  earnedAt: string | null;
  certificateId: string | null;
};

export type AchievementItem = {
  id: string;
  kind: "BADGE" | "CERTIFICATE";
  code: string; // BRONZE, SILVER...
  awardedAt: string;
};

export type AchievementsPayload = {
  points: number;
  donationCount: number;
  currentBadge: string | null;
  nextMilestone: {
    badge: string;
    donationsNeeded: number;
    certificate: boolean;
  } | null;
  badges: AchievementItem[];
  certificates: AchievementItem[];
};

export type VerifyPayload = {
  valid: boolean;
  donorName: string;
  donations: number | null;
  badge: string | null;
  awardedAt: string;
  issuedBy: string;
};

const verifyCertificate = (code: string) =>
  authedRequest<VerifyPayload>(
    `/achievements/verify/${encodeURIComponent(code)}`,
  );

const getMyAchievements = () =>
  authedRequest<AchievementsPayload>("/achievements/my", {
    cache: { revalidate: 15, tags: ["my-donations"] },     
  });

export const achievementServices = { getMyAchievements, verifyCertificate };
