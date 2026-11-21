import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import {
  BankRequestStatus,
  RequestStatus,
  Role,
  UserStatus,
  VerificationStatus,
} from "../../../generated/prisma/enums";

const WEEKS = 8;
const WEEK_MS = 7 * 86_400_000;

// Monday 00:00 UTC of the week that contains `date`
const weekStart = (date: Date) => {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
};

// The last 8 week starts, oldest first, so empty weeks still show up as zeros
const weekBuckets = (): number[] => {
  const current = weekStart(new Date()).getTime();
  return Array.from(
    { length: WEEKS },
    (_, i) => current - (WEEKS - 1 - i) * WEEK_MS,
  );
};

// Counts rows per week for each series
const bucketByWeek = <T extends string>(
  rows: { date: Date; series: T }[],
  series: readonly T[],
) => {
  const buckets = weekBuckets();

  const result = buckets.map((start) => {
    const counts = Object.fromEntries(series.map((s) => [s, 0])) as Record<
      T,
      number
    >;
    return { weekStart: new Date(start).toISOString(), counts };
  });

  for (const row of rows) {
    const index = buckets.indexOf(weekStart(row.date).getTime());
    const bucket = result[index];
    if (bucket) bucket.counts[row.series] += 1;
  }

  return result;
};

const since = () => new Date(weekBuckets()[0] ?? Date.now());

// ---------- 1. Bank overview ----------

const getBankOverview = async (ownerId: string) => {
  const bank = await prisma.bloodBank.findUnique({
    where: { ownerId },
    select: {
      id: true,
      name: true,
      verificationStatus: true,
      verificationNote: true,
      inventory: {
        select: { bloodType: true, unitsAvailable: true },
        orderBy: { bloodType: "asc" },
      },
    },
  });

  if (!bank) {
    throw new ApiError(404, "Blood bank not found for this account");
  }

  const [pending, approved, fulfilled, bags, finished, recent] =
    await Promise.all([
      prisma.bankRequest.count({
        where: { bankId: bank.id, status: BankRequestStatus.PENDING },
      }),
      prisma.bankRequest.count({
        where: { bankId: bank.id, status: BankRequestStatus.APPROVED },
      }),
      prisma.bankRequest.count({
        where: { bankId: bank.id, status: BankRequestStatus.FULFILLED },
      }),
      // complete() stores the bags really given in unitsRequested
      prisma.bankRequest.aggregate({
        where: { bankId: bank.id, status: BankRequestStatus.FULFILLED },
        _sum: { unitsRequested: true },
      }),
      prisma.bankRequest.findMany({
        where: {
          bankId: bank.id,
          status: {
            in: [BankRequestStatus.FULFILLED, BankRequestStatus.REJECTED],
          },
          updatedAt: { gte: since() },
        },
        select: { status: true, updatedAt: true },
      }),
      prisma.bankRequest.findMany({
        where: { bankId: bank.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          bloodType: true,
          unitsRequested: true,
          status: true,
          createdAt: true,
          requester: { select: { name: true } },
        },
      }),
    ]);

  const LOW = 5;

  return {
    bank: {
      name: bank.name,
      verificationStatus: bank.verificationStatus,
      verificationNote: bank.verificationNote,
    },
    counts: {
      pending,
      approved,
      fulfilled,
      bagsGiven: bags._sum.unitsRequested ?? 0,
    },
    stock: {
      items: bank.inventory,
      out: bank.inventory.filter((i) => i.unitsAvailable === 0).length,
      low: bank.inventory.filter(
        (i) => i.unitsAvailable > 0 && i.unitsAvailable < LOW,
      ).length,
      total: bank.inventory.reduce((sum, i) => sum + i.unitsAvailable, 0),
    },
    weekly: bucketByWeek(
      finished.map((r) => ({
        date: r.updatedAt,
        series:
          r.status === BankRequestStatus.FULFILLED
            ? ("fulfilled" as const)
            : ("rejected" as const),
      })),
      ["fulfilled", "rejected"] as const,
    ).map((w) => ({ weekStart: w.weekStart, ...w.counts })),
    recent,
  };
};

// ---------- 2. Admin overview ----------

const getAdminOverview = async () => {
  const [
    banksByStatus,
    users,
    suspended,
    donations,
    openRequests,
    donationRows,
    signupRows,
    pendingBanks,
  ] = await Promise.all([
    prisma.bloodBank.groupBy({
      by: ["verificationStatus"],
      _count: { _all: true },
    }),
    prisma.user.count({ where: { role: Role.USER } }),
    prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
    prisma.donationHistory.count(),
    prisma.donationRequest.count({ where: { status: RequestStatus.OPEN } }),
    prisma.donationHistory.findMany({
      where: { donatedAt: { gte: since() } },
      select: { donatedAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: since() }, role: Role.USER },
      select: { createdAt: true },
    }),
    // oldest first: the review queue
    prisma.bloodBank.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
        upazila: {
          select: { name: true, district: { select: { name: true } } },
        },
      },
    }),
  ]);

  const banks = Object.fromEntries(
    Object.values(VerificationStatus).map((s) => [
      s,
      banksByStatus.find((b) => b.verificationStatus === s)?._count._all ?? 0,
    ]),
  ) as Record<VerificationStatus, number>;

  const donationsByWeek = bucketByWeek(
    donationRows.map((r) => ({
      date: r.donatedAt,
      series: "donations" as const,
    })),
    ["donations"] as const,
  );
  
  const signupsByWeek = bucketByWeek(
    signupRows.map((r) => ({ date: r.createdAt, series: "signups" as const })),
    ["signups"] as const,
  );

  const weekly = donationsByWeek.map((w, i) => ({
    weekStart: w.weekStart,
    donations: w.counts.donations,
    signups: signupsByWeek[i]?.counts.signups ?? 0,
  }));

  return {
    counts: { banks, users, suspended, donations, openRequests },
    weekly,
    pendingBanks,
  };
};

export const overviewServices = { getBankOverview, getAdminOverview };
