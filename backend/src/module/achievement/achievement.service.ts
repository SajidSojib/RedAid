import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import {
  AchievementKind,
  NotificationType,
  Role,
} from "../../../generated/prisma/enums";
import type { Prisma } from "../../../generated/prisma/client";
import { certificateCode, MILESTONES } from "../../types/constant/milestones";
import config from "../../config";

type Tx = Prisma.TransactionClient;

type EarnedMilestone = {
  milestone: (typeof MILESTONES)[number];
  badgeIsNew: boolean;
  certificateIsNew: boolean;
};

const titleCase = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase();

// Called by the donations service, inside its transaction, after donationCount is incremented.
// Awards every milestone the donor has reached and doesn't own yet.
const awardMilestones = async (
  tx: Tx,
  donorId: string,
  donationCount: number,
) => {
  const reached = MILESTONES.filter((m) => m.count <= donationCount);

  if (reached.length === 0) return [];

  const existing = await tx.achievement.findMany({
    where: { donorId },
    select: { kind: true, code: true },
  });
  const owned = new Set(existing.map((a) => `${a.kind}:${a.code}`));

  const earned: EarnedMilestone[] = [];

  for (const milestone of reached) {
    const badgeIsNew = !owned.has(
      `${AchievementKind.BADGE}:${milestone.badge}`,
    );
    const certificateIsNew =
      milestone.certificate &&
      !owned.has(`${AchievementKind.CERTIFICATE}:${milestone.badge}`); // same code as the badge

    if (badgeIsNew || certificateIsNew) {
      earned.push({ milestone, badgeIsNew, certificateIsNew });
    }
  }

  if (earned.length === 0) return [];

  const rows: Prisma.AchievementCreateManyInput[] = earned.flatMap(
    ({ milestone, badgeIsNew, certificateIsNew }) => [
      ...(badgeIsNew
        ? [{ donorId, kind: AchievementKind.BADGE, code: milestone.badge }]
        : []),
      ...(certificateIsNew
        ? [
            {
              donorId,
              kind: AchievementKind.CERTIFICATE,
              code: milestone.badge,
            },
          ]
        : []),
    ],
  );

  await tx.achievement.createMany({ data: rows, skipDuplicates: true });

  // One notification per milestone, not one per item
  await tx.notification.createMany({
    data: earned.map(({ milestone, certificateIsNew }) => ({
      userId: donorId,
      type: NotificationType.ACHIEVEMENT,
      title: `${titleCase(milestone.badge)} badge unlocked`,
      message: `You reached ${milestone.count} donation${
        milestone.count > 1 ? "s" : ""
      }. You earned the ${titleCase(milestone.badge)} badge${
        certificateIsNew ? " and a certificate" : ""
      }. Thank you for saving lives.`,
      link: "/dashboard/my-donations",
    })),
  });

  return earned.map(({ milestone, certificateIsNew }) => ({
    badge: milestone.badge,
    donations: milestone.count,
    certificate: certificateIsNew,
  }));
};

const getMyAchievements = async (donorId: string) => {
  const [user, achievements] = await Promise.all([
    prisma.user.findUnique({
      where: { id: donorId },
      select: { donationCount: true },
    }),
    prisma.achievement.findMany({
      where: { donorId },
      orderBy: { awardedAt: "desc" },
    }),
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const count = user.donationCount;
  const current = [...MILESTONES].reverse().find((m) => m.count <= count);
  const next = MILESTONES.find((m) => m.count > count);

  return {
    points: count, // 1 confirmed donation = 1 point
    donationCount: count,
    currentBadge: current?.badge ?? null,
    nextMilestone: next
      ? {
          badge: next.badge,
          donationsNeeded: next.count - count,
          certificate: next.certificate,
        }
      : null,
    badges: achievements.filter((a) => a.kind === AchievementKind.BADGE),
    certificates: achievements.filter(
      (a) => a.kind === AchievementKind.CERTIFICATE,
    ),
  };
};

// Data for the certificate page. The owner can open theirs, and an admin can open any.
const getCertificate = async (
  userId: string,
  role: Role | null,
  achievementId: string,
) => {
  const achievement = await prisma.achievement.findFirst({
    where: {
      id: achievementId,
      kind: AchievementKind.CERTIFICATE,
      ...(role !== Role.ADMIN && { donorId: userId }),
    },
    include: {
      donor: { select: { name: true } },
    },
  });

  if (!achievement) {
    throw new ApiError(404, "Certificate not found");
  }

  const milestone = MILESTONES.find(
    (m) => certificateCode(m.count) === achievement.code,
  );

  return {
    verificationCode: achievement.id,
    verificationUrl: `${config.frontend_url}/verify/${achievement.id}`, // this is what the QR encodes
    donorName: achievement.donor.name,
    donations: milestone?.count ?? null,
    badge: milestone?.badge ?? null,
    awardedAt: achievement.awardedAt,
  };
};

// PUBLIC: anyone with the code (from the QR) can check a certificate.
// Returns the minimum needed: no email, phone, blood type or user id.
const verifyCertificate = async (code: string) => {
  const achievement = await prisma.achievement.findFirst({
    where: { id: code, kind: AchievementKind.CERTIFICATE },
    include: { donor: { select: { name: true } } },
  });

  if (!achievement) {
    throw new ApiError(404, "No certificate found for this code");
  }

  const milestone = MILESTONES.find(
    (m) => certificateCode(m.count) === achievement.code,
  );

  return {
    valid: true,
    donorName: achievement.donor.name,
    donations: milestone?.count ?? null,
    badge: milestone?.badge ?? null,
    awardedAt: achievement.awardedAt,
    issuedBy: "RedAid",
  };
};

export const achievementServices = {
  awardMilestones,
  getMyAchievements,
  getCertificate,
  verifyCertificate,
};
