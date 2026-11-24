import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";
import {
  AchievementKind,
  BankRequestStatus,
  BloodType,
  MatchStatus,
  NotificationType,
  ReportCategory,
  RequestStatus,
  Role,
  Urgency,
  UserStatus,
  VerificationStatus,
} from "../../generated/prisma/enums";
import { COMPATIBLE_Donors } from "../types/constant/compatibleDonors";
import { MILESTONES } from "../types/constant/milestones";

const DOMAIN = "gmail.com";
const PASSWORD = "Abc@1234";
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const BLOOD = Object.values(BloodType);

const NAMES = [
  "Rahim Uddin",
  "Karim Hossain",
  "Nusrat Jahan",
  "Tanvir Ahmed",
  "Sadia Islam",
  "Mehedi Hasan",
  "Farhana Akter",
  "Imran Khan",
  "Sumaiya Rahman",
  "Arif Chowdhury",
  "Jannat Ara",
  "Shakil Mia",
];
const BANKS = [
  {
    name: "Comilla Central Blood Bank",
    status: VerificationStatus.VERIFIED,
    area: 0,
  },
  {
    name: "Lifeline Blood Center",
    status: VerificationStatus.VERIFIED,
    area: 1,
  },
  { name: "Hope Blood Bank", status: VerificationStatus.PENDING, area: 0 },
];

const email = (key: string) => `${key}@${DOMAIN}`;

// Only these exact addresses belong to the seed. Real Gmail users are never matched.
const seededEmails = [
  ...Array.from({ length: 12 }, (_, i) => email(`donor${i + 1}`)),
  ...Array.from({ length: 3 }, (_, i) => email(`bank${i + 1}`)),
];

// ---------- reset ----------

const reset = async () => {
  const users = await prisma.user.findMany({
    where: { email: { in: seededEmails } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;

  await prisma.report.deleteMany({
    where: {
      OR: [{ reporterId: { in: ids } }, { reportedUserId: { in: ids } }],
    },
  });
  await prisma.bankRequest.deleteMany({ where: { requesterId: { in: ids } } });
  await prisma.donationHistory.deleteMany({ where: { donorId: { in: ids } } });
  await prisma.donationMatch.deleteMany({
    where: {
      OR: [{ donorId: { in: ids } }, { request: { requesterId: { in: ids } } }],
    },
  });
  await prisma.donationRequest.deleteMany({
    where: { requesterId: { in: ids } },
  });
  await prisma.achievement.deleteMany({ where: { donorId: { in: ids } } });
  await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  await prisma.donorServiceArea.deleteMany({ where: { donorId: { in: ids } } });
  await prisma.bloodBank.deleteMany({ where: { ownerId: { in: ids } } }); // inventory goes with it
  await prisma.session.deleteMany({ where: { userId: { in: ids } } });
  await prisma.account.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`Removed ${ids.length} seeded users and their data.`);
};

// ---------- seed ----------

const main = async () => {
  const wantReset = process.argv.includes("--reset");
  if (wantReset) await reset();

  const existing = await prisma.user.count({
    where: { email: { in: seededEmails } },
  });
  if (existing > 0) {
    console.log("Demo data already exists. Run with --reset to rebuild it.");
    return;
  }

  // Locations: the first upazilas that have unions
  const areas = await prisma.upazila.findMany({
    where: { unions: { some: {} } },
    take: 2,
    orderBy: { id: "asc" },
    include: { unions: { take: 3, orderBy: { id: "asc" } } },
  });
  const [A, B] = [areas[0], areas[1] ?? areas[0]];
  if (!A || !B)
    throw new Error("Seed the locations first (pnpm seed:locations).");

  const passwordHash = await (await auth.$context).password.hash(PASSWORD);

  const createUser = async (
    key: string,
    name: string,
    role: Role,
    bloodType: BloodType | null,
    phone: string,
  ) => {
    const id = randomUUID();
    await prisma.user.create({
      data: {
        id,
        name,
        email: email(key),
        emailVerified: true,
        role,
        bloodType,
        phone,
        status: UserStatus.ACTIVE,
      },
    });
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: passwordHash,
      },
    });
    return id;
  };

  // ----- donors (the last four also act as requesters) -----
  const counts = [16, 10, 6, 5, 3, 3, 1, 1, 0, 0, 0, 0];
  const donors: {
    id: string;
    bloodType: BloodType;
    count: number;
    last: Date | null;
  }[] = [];

  for (let i = 0; i < NAMES.length; i++) {
    const bloodType = BLOOD[i % BLOOD.length]!;
    const id = await createUser(
      `donor${i + 1}`,
      NAMES[i]!,
      Role.USER,
      bloodType,
      `0171100${String(i + 1).padStart(4, "0")}`,
    );
    const count = counts[i]!;
    const last = count === 0 ? null : daysAgo(i === 3 ? 20 : 110 + i * 7); // donor 4 donated recently
    await prisma.user.update({
      where: { id },
      data: { donationCount: count, lastDonationDate: last },
    });
    donors.push({ id, bloodType, count, last });

    // service areas: a union in area A (or the whole upazila every 4th donor), plus area B for even ones
    const unions = A.unions;
    const first =
      i % 4 === 3
        ? { upazilaId: A.id, unionId: null }
        : { upazilaId: A.id, unionId: unions[i % unions.length]?.id ?? null };
    const rows = [first];
    if (i % 2 === 0 && B.id !== A.id)
      rows.push({ upazilaId: B.id, unionId: null });
    await prisma.donorServiceArea.createMany({
      data: rows.map((r) => ({ donorId: id, ...r })),
    });
  }

  // ----- donation history, badges and certificates -----
  for (const d of donors) {
    if (d.count === 0 || !d.last) continue;

    await prisma.donationHistory.createMany({
      data: Array.from({ length: d.count }, (_, k) => ({
        donorId: d.id,
        units: 1,
        donatedAt: new Date(d.last!.getTime() - k * 100 * DAY),
      })),
    });

    for (const m of MILESTONES.filter((m) => d.count >= m.count)) {
      await prisma.achievement.create({
        data: { donorId: d.id, kind: AchievementKind.BADGE, code: m.badge },
      });
      if (m.certificate) {
        await prisma.achievement.create({
          data: {
            donorId: d.id,
            kind: AchievementKind.CERTIFICATE,
            code: m.badge,
          },
        });
      }
    }
  }

  // ----- blood banks -----
  const bankIds: string[] = [];
  for (let i = 0; i < BANKS.length; i++) {
    const b = BANKS[i]!;
    const area = areas[b.area] ?? A;
    const ownerId = await createUser(
      `bank${i + 1}`,
      `${b.name} Manager`,
      Role.BANK,
      null,
      `0181100${String(i + 1).padStart(4, "0")}`,
    );
    const bank = await prisma.bloodBank.create({
      data: {
        ownerId,
        name: b.name,
        address: `${10 + i} Hospital Road`,
        phone: `0191100${String(i + 1).padStart(4, "0")}`,
        licenseNumber: `LIC-${2026}-${100 + i}`,
        upazilaId: area.id,
        verificationStatus: b.status,
        verifiedAt:
          b.status === VerificationStatus.VERIFIED ? new Date() : null,
      },
    });
    bankIds.push(bank.id);
    await prisma.bloodInventory.createMany({
      data: BLOOD.map((bloodType, k) => ({
        bankId: bank.id,
        bloodType,
        unitsAvailable: [14, 3, 0, 9, 22, 1, 7, 12][(k + i * 2) % 8]!,
      })),
    });
  }

  // ----- donor requests -----
  const requesters = donors.slice(8);
  const eligible = (d: (typeof donors)[number]) =>
    !d.last || Date.now() - d.last.getTime() > 90 * DAY;
  const accepting = new Set<string>(); // one accepted offer per donor

  const makeRequest = async (
    requester: (typeof donors)[number],
    over: {
      bloodType: BloodType;
      units: number;
      urgency: Urgency;
      status: RequestStatus;
      hospital: string;
      unionIdx: number;
      accepted?: number;
    },
  ) => {
    const request = await prisma.donationRequest.create({
      data: {
        requesterId: requester.id,
        patientName: "Patient " + over.hospital.split(" ")[0],
        hospitalName: over.hospital,
        contactPhone: "01711999999",
        note: "Please contact before you come.",
        bloodType: over.bloodType,
        unitsNeeded: over.units,
        unitsAccepted: 0,
        urgency: over.urgency,
        status: over.status,
        upazilaId: A.id,
        unionId: A.unions[over.unionIdx]?.id ?? null,
        createdAt: daysAgo(over.status === RequestStatus.OPEN ? 1 : 5),
      },
    });

    const matches = donors
      .filter(
        (d) =>
          d.id !== requester.id &&
          COMPATIBLE_Donors[over.bloodType].includes(d.bloodType) &&
          eligible(d),
      )
      .slice(0, 5);

    if (matches.length > 0) {
      await prisma.donationMatch.createMany({
        data: matches.map((d) => ({
          requestId: request.id,
          donorId: d.id,
          notifiedAt: daysAgo(1),
        })),
      });
      await prisma.notification.createMany({
        data: matches.map((d) => ({
          userId: d.id,
          type: NotificationType.NEW_REQUEST,
          title: `${over.bloodType.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")} blood needed`,
          message: `${over.units} bag(s) needed at ${over.hospital}. Open the request to respond.`,
          link: `/all-requests/${request.id}`,
        })),
      });
    }

    let accepted = 0;
    for (const d of matches) {
      if (accepted >= (over.accepted ?? 0) || accepting.has(d.id)) continue;
      await prisma.donationMatch.updateMany({
        where: { requestId: request.id, donorId: d.id },
        data: { status: MatchStatus.ACCEPTED, respondedAt: new Date() },
      });
      accepting.add(d.id);
      accepted++;
    }
    if (accepted > 0) {
      await prisma.donationRequest.update({
        where: { id: request.id },
        data: { unitsAccepted: accepted },
      });
    }
    return request;
  };

  const r0 = requesters[0]!,
    r1 = requesters[1]!,
    r2 = requesters[2]!,
    r3 = requesters[3]!;

  await makeRequest(r0, {
    bloodType: BloodType.B_POSITIVE,
    units: 3,
    urgency: Urgency.URGENT,
    status: RequestStatus.OPEN,
    hospital: "Comilla Medical College Hospital",
    unionIdx: 0,
    accepted: 1,
  });
  await makeRequest(r1, {
    bloodType: BloodType.O_NEGATIVE,
    units: 2,
    urgency: Urgency.CRITICAL,
    status: RequestStatus.OPEN,
    hospital: "Mother and Child Hospital",
    unionIdx: 1,
  });
  await makeRequest(r2, {
    bloodType: BloodType.A_POSITIVE,
    units: 1,
    urgency: Urgency.NORMAL,
    status: RequestStatus.OPEN,
    hospital: "Shaheed Dr. Zikrul Clinic",
    unionIdx: 2,
  });
  await makeRequest(r3, {
    bloodType: BloodType.AB_POSITIVE,
    units: 2,
    urgency: Urgency.NORMAL,
    status: RequestStatus.CANCELLED,
    hospital: "City Care Hospital",
    unionIdx: 0,
  });
  const full = await makeRequest(r0, {
    bloodType: BloodType.A_NEGATIVE,
    units: 1,
    urgency: Urgency.URGENT,
    status: RequestStatus.FULFILLED,
    hospital: "Popular Diagnostic",
    unionIdx: 1,
    accepted: 1,
  });
  await prisma.donationRequest.update({
    where: { id: full.id },
    data: { unitsAccepted: 1 },
  });

  // A completed request: link donor 1's latest donation to it
  const done = await makeRequest(r1, {
    bloodType: BloodType.O_POSITIVE,
    units: 1,
    urgency: Urgency.NORMAL,
    status: RequestStatus.COMPLETED,
    hospital: "Sadar Hospital",
    unionIdx: 0,
  });
  const star = donors[0]!;
  const match = await prisma.donationMatch.upsert({
    where: { requestId_donorId: { requestId: done.id, donorId: star.id } },
    update: { status: MatchStatus.COMPLETED, respondedAt: daysAgo(3) },
    create: {
      requestId: done.id,
      donorId: star.id,
      status: MatchStatus.COMPLETED,
      respondedAt: daysAgo(3),
    },
  });
  const latest = await prisma.donationHistory.findFirst({
    where: { donorId: star.id },
    orderBy: { donatedAt: "desc" },
  });
  if (latest) {
    await prisma.donationHistory.update({
      where: { id: latest.id },
      data: { requestId: done.id, matchId: match.id },
    });
  }
  await prisma.donationRequest.update({
    where: { id: done.id },
    data: { unitsAccepted: 1 },
  });

  // ----- bank requests -----
  const [bank1, bank2] = [bankIds[0]!, bankIds[1]!];
  await prisma.bankRequest.createMany({
    data: [
      {
        requesterId: r0.id,
        bankId: bank1,
        bloodType: BloodType.A_POSITIVE,
        unitsRequested: 2,
        status: BankRequestStatus.PENDING,
        note: "For surgery tomorrow",
      },
      {
        requesterId: r1.id,
        bankId: bank1,
        bloodType: BloodType.B_POSITIVE,
        unitsRequested: 1,
        status: BankRequestStatus.APPROVED,
      },
      {
        requesterId: r2.id,
        bankId: bank1,
        bloodType: BloodType.O_POSITIVE,
        unitsRequested: 2,
        status: BankRequestStatus.FULFILLED,
        createdAt: daysAgo(10),
      },
      {
        requesterId: r2.id,
        bankId: bank2,
        bloodType: BloodType.AB_NEGATIVE,
        unitsRequested: 1,
        status: BankRequestStatus.REJECTED,
        createdAt: daysAgo(12),
      },
      {
        requesterId: r3.id,
        bankId: bank1,
        bloodType: BloodType.A_POSITIVE,
        unitsRequested: 1,
        status: BankRequestStatus.PENDING,
      },
      {
        requesterId: r3.id,
        bankId: bank2,
        bloodType: BloodType.A_POSITIVE,
        unitsRequested: 1,
        status: BankRequestStatus.PENDING,
      },
    ],
  });

  // ----- reports (seeded directly, so they skip the "worked together" rule) -----
  await prisma.report.createMany({
    data: [
      {
        reporterId: donors[2]!.id,
        reportedUserId: r1.id,
        category: ReportCategory.NO_SHOW,
        reason: "Agreed to meet at the hospital but never answered the phone.",
      },
      {
        reporterId: donors[3]!.id,
        reportedUserId: r1.id,
        category: ReportCategory.FAKE_REQUEST,
        reason: "The request details did not match what the hospital told me.",
      },
      {
        reporterId: r2.id,
        reportedBankId: bank2,
        category: ReportCategory.WRONG_INFORMATION,
        reason: "The listed stock was not available when I arrived.",
      },
    ],
  });

  console.log("Demo data created.");
  console.log(
    `Log in with any ${email("donor1")} ... ${email("donor12")} or ${email("bank1")} ... ${email("bank3")}`,
  );
  console.log(`Password for all of them: ${PASSWORD}`);
};

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
