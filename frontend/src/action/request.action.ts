"use server";

import { refresh, updateTag } from "next/cache";
import {
  requestServices,
  type CreateRequestInput,
  type UpdateRequestInput,
} from "@/service/request.service";

export const createRequest = async (input: CreateRequestInput) => {
  const result = await requestServices.createRequest(input);
  if (!result.error) {
    updateTag("my-requests");
    updateTag("requests");
    updateTag("notifications");
  }
  return result;
};

export const getMyRequestDetails = async (id: string) =>{
    const result = await requestServices.getMyRequestDetails(id);
    return result;
}

export const updateMyRequest = async (
  id: string,
  input: UpdateRequestInput,
) => {
  const result = await requestServices.updateRequest(id, input);
  if (!result.error) {
    updateTag("my-requests");
    updateTag("requests");
    updateTag("notifications");
  }
  return result;
};

export const cancelMyRequest = async (id: string) => {
  const result = await requestServices.cancelRequest(id);
  if (!result.error) {
    updateTag("my-requests");
    updateTag("requests");
    updateTag("notifications");
  }
  return result;
};

export const completeMyRequest = async (id: string) => {
  const result = await requestServices.completeRequest(id);
  if (!result.error) {
    updateTag("my-requests");
    updateTag("requests");
    updateTag("notifications");
  }
  return result;
};
