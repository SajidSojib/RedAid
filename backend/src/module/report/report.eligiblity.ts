import { prisma } from "../../lib/prisma";
import {
  BankRequestStatus,
  MatchStatus,
} from "../../../generated/prisma/enums";

// Bank requests that count as a real connection (the bank actually engaged)
const CONNECTED_BANK_STATUSES: BankRequestStatus[] = [
  BankRequestStatus.APPROVED,
  BankRequestStatus.FULFILLED,
  BankRequestStatus.NO_SHOW,
];

// donor <-> requester: someone actually answered the request
export const usersConnected = async (a: string, b: string) => {
  const match = await prisma.donationMatch.findFirst({
    where: {
      respondedAt: { not: null },
      status: { not: MatchStatus.DECLINED },
      OR: [
        { donorId: a, request: { requesterId: b } },
        { donorId: b, request: { requesterId: a } },
      ],
    },
    select: { id: true },
  });
  return Boolean(match);
};

// user <-> bank: the bank approved a request from this user
export const userBankConnected = async (userId: string, bankId: string) => {
  const request = await prisma.bankRequest.findFirst({
    where: {
      requesterId: userId,
      bankId,
      status: { in: CONNECTED_BANK_STATUSES },
    },
    select: { id: true },
  });
  return Boolean(request);
};
