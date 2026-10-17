"use server";

import { refresh } from "next/cache";
import {
  requestServices,
  type CreateRequestInput,
  type UpdateRequestInput,
} from "@/service/request.service";

export const createRequest = async (input: CreateRequestInput) =>
  requestServices.createRequest(input);

export const getMyRequestDetails = async (id: string) =>
  requestServices.getMyRequestDetails(id);

export const updateMyRequest = async (
  id: string,
  input: UpdateRequestInput,
) => {
  const result = await requestServices.updateRequest(id, input);
  refresh();
  return result;
};

export const cancelMyRequest = async (id: string) => {
  const result = await requestServices.cancelRequest(id);
  refresh();
  return result;
};

export const completeMyRequest = async (id: string) => {
  const result = await requestServices.completeRequest(id);
  refresh();
  return result;
};
