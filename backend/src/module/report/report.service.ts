import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import {
  NotificationType,
  ReportCategory,
  ReportStatus,
  Role,
} from "../../../generated/prisma/enums";
import { parsePagination } from "../../utils/parsePagination";
import { userBankConnected, usersConnected } from "./report.eligiblity";

export const MAX_REPORTS_PER_DAY = 5;
const MIN_REASON = 10;
const MAX_REASON = 500;

const NOT_CONNECTED =
  "You can only report someone you have worked with on a request.";

type Reporter = { id: string; role: Role | null };
type Resolved = {
  reportedUserId: string | null;
  reportedBankId: string | null;
};

export type ReportTarget = { userId?: string; bankId?: string };

export type CreateReportInput = ReportTarget & {
  category?: ReportCategory;
  reason?: string;
};

export type GetReportsFilters = ReportTarget & {
  status?: string;
  page?: number | string;
  limit?: number | string;
};

// ---------- Helpers ----------

// One rulebook for "who can report whom", shared by create and eligibility
const resolveTarget = async (
  reporter: Reporter,
  target: ReportTarget,
): Promise<Resolved> => {
  const { userId, bankId } = target;

  if (Boolean(userId) === Boolean(bankId)) {
    throw new ApiError(400, "Report either a user or a blood bank");
  }
  if (reporter.role === Role.ADMIN) {
    throw new ApiError(403, "Admins review reports, they don't file them");
  }

  const isBank = reporter.role === Role.BANK;

  if (userId) {
    if (userId === reporter.id) {
      throw new ApiError(400, "You can't report yourself");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) throw new ApiError(404, "User not found");
    if (user.role !== Role.USER) throw new ApiError(403, NOT_CONNECTED);

    if (isBank) {
      const bank = await prisma.bloodBank.findUnique({
        where: { ownerId: reporter.id },
        select: { id: true },
      });
      if (!bank || !(await userBankConnected(userId, bank.id))) {
        throw new ApiError(403, NOT_CONNECTED);
      }
    } else if (!(await usersConnected(reporter.id, userId))) {
      throw new ApiError(403, NOT_CONNECTED);
    }

    return { reportedUserId: userId, reportedBankId: null };
  }

  if (isBank) {
    throw new ApiError(403, "Blood banks can't report other banks");
  }

  const bank = await prisma.bloodBank.findUnique({
    where: { id: bankId! },
    select: { id: true, ownerId: true },
  });
  if (!bank) throw new ApiError(404, "Blood bank not found");
  if (bank.ownerId === reporter.id) {
    throw new ApiError(400, "You can't report your own bank");
  }
  if (!(await userBankConnected(reporter.id, bank.id))) {
    throw new ApiError(403, NOT_CONNECTED);
  }

  return { reportedUserId: null, reportedBankId: bank.id };
};

const pendingFilter = (reporterId: string, t: Resolved) => ({
  reporterId,
  status: ReportStatus.PENDING,
  ...(t.reportedUserId
    ? { reportedUserId: t.reportedUserId }
    : { reportedBankId: t.reportedBankId }),
});

// ---------- 1. Can I report this target? (for the UI) ----------

const getEligibility = async (reporter: Reporter, target: ReportTarget) => {
  try {
    const resolved = await resolveTarget(reporter, target);
    const existing = await prisma.report.count({
      where: pendingFilter(reporter.id, resolved),
    });

    return {
      canReport: existing === 0,
      alreadyReported: existing > 0,
      reason:
        existing > 0 ? "You already have a pending report on this." : null,
    };
  } catch (error) {
    if (error instanceof ApiError && error.statusCode < 500) {
      return {
        canReport: false,
        alreadyReported: false,
        reason: error.message,
      };
    }
    throw error;
  }
};

// ---------- 2. File a report ----------

const createReport = async (reporter: Reporter, payload: CreateReportInput) => {
  const category = payload.category ?? ReportCategory.OTHER;
  const reason = payload.reason?.trim();

  if (!Object.values(ReportCategory).includes(category)) {
    throw new ApiError(400, "Invalid report category");
  }
  if (!reason || reason.length < MIN_REASON) {
    throw new ApiError(
      400,
      `Please explain what happened (at least ${MIN_REASON} characters)`,
    );
  }
  if (reason.length > MAX_REASON) {
    throw new ApiError(
      400,
      `The reason can be at most ${MAX_REASON} characters`,
    );
  }

  const target = await resolveTarget(reporter, payload);

  const [pending, today] = await Promise.all([
    prisma.report.count({ where: pendingFilter(reporter.id, target) }),
    prisma.report.count({
      where: {
        reporterId: reporter.id,
        createdAt: { gte: new Date(Date.now() - 86_400_000) },
      },
    }),
  ]);

  if (pending > 0) {
    throw new ApiError(
      409,
      "You already have a pending report on this. An admin will review it.",
    );
  }
  if (today >= MAX_REPORTS_PER_DAY) {
    throw new ApiError(
      429,
      `You can send at most ${MAX_REPORTS_PER_DAY} reports per day`,
    );
  }

  return prisma.report.create({
    data: { reporterId: reporter.id, category, reason, ...target },
    select: { id: true, category: true, status: true, createdAt: true },
  });
};

// ---------- 3. Admin: reports on one user or bank ----------

const getReports = async (filters: GetReportsFilters = {}) => {
  const { page, limit } = parsePagination(filters.page, filters.limit);

  if (Boolean(filters.userId) === Boolean(filters.bankId)) {
    throw new ApiError(400, "Provide either userId or bankId");
  }
  if (
    filters.status !== undefined &&
    !Object.values(ReportStatus).includes(filters.status as ReportStatus)
  ) {
    throw new ApiError(400, "Invalid report status");
  }

  const target = filters.userId
    ? { reportedUserId: filters.userId }
    : { reportedBankId: filters.bankId! };

  const where = {
    ...target,
    ...(filters.status && { status: filters.status as ReportStatus }),
  };

  const [reports, total, pending] = await prisma.$transaction([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        category: true,
        reason: true,
        status: true,
        adminNote: true,
        resolvedAt: true,
        createdAt: true,
        reporter: { select: { id: true, name: true, image: true, role: true } },
      },
    }),
    prisma.report.count({ where }),
    prisma.report.count({ where: { ...target, status: ReportStatus.PENDING } }),
  ]);

  return {
    reports,
    pendingCount: pending,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ---------- 4. Admin: dismiss a report ----------

const dismissReport = async (reportId: string, note?: string) => {
  const adminNote = note?.trim() || null;
  if (adminNote && adminNote.length > 300) {
    throw new ApiError(400, "The note can be at most 300 characters");
  }

  return prisma.$transaction(async (tx) => {
    const report = await tx.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true, reporterId: true },
    });
    if (!report) throw new ApiError(404, "Report not found");
    if (report.status !== ReportStatus.PENDING) {
      throw new ApiError(409, "This report was already handled");
    }

    const updated = await tx.report.updateMany({
      where: { id: reportId, status: ReportStatus.PENDING },
      data: {
        status: ReportStatus.DISMISSED,
        adminNote,
        resolvedAt: new Date(),
      },
    });
    if (updated.count === 0) {
      throw new ApiError(
        409,
        "This report was just updated. Reload and try again.",
      );
    }

    await tx.notification.create({
      data: {
        userId: report.reporterId,
        type: NotificationType.ACCOUNT,
        title: "Your report was reviewed",
        message:
          "An admin reviewed your report and decided no action was needed. Thank you for letting us know.",
      },
    });

    return tx.report.findUniqueOrThrow({ where: { id: reportId } });
  });
};

export const reportServices = {
  getEligibility,
  createReport,
  getReports,
  dismissReport,
};
