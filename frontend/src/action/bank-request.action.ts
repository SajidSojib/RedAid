"use server";

import { updateTag } from "next/cache";
import {
  bankRequestServices,
  type CreateBankRequestInput,
} from "@/service/bank-request.service";

// Every change to a bank request affects the requester's list and the bank's notifications
const expire = () => {
  updateTag("my-bank-requests");
  updateTag("notifications");
};

// A plain read for client components. It has no tag, so it's always fresh.
export const getMyBankRequests = async (query: string) =>
  bankRequestServices.getMyBankRequests(query);

export const createBankRequest = async (input: CreateBankRequestInput) => {
  const res = await bankRequestServices.createBankRequest(input);
  if (!res.error) expire();
  return res;
};

export const withdrawBankRequest = async (id: string) => {
  const res = await bankRequestServices.withdrawBankRequest(id);
  if (!res.error) expire();
  return res;
};

export const approveBankRequest = async (id: string) => {
  const res = await bankRequestServices.approveBankRequest(id);
  if (!res.error) expire();
  return res;
};

export const rejectBankRequest = async (id: string) => {
  const res = await bankRequestServices.rejectBankRequest(id);
  if (!res.error) expire();
  return res;
};

export const completeBankRequest = async (id: string) => {
  const res = await bankRequestServices.completeBankRequest(id);
  if (!res.error) {
    expire();
    updateTag("blood-banks"); // stock went down, and the public list shows it
  }
  return res;
};

export const markBankRequestNoShow = async (id: string) => {
  const res = await bankRequestServices.markBankRequestNoShow(id);
  if (!res.error) expire();
  return res;
};
