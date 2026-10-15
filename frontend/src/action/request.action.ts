"use server"

import { CreateRequestInput, requestServices } from "@/service/request.service"

export const createRequest = async (input: CreateRequestInput) => {
    const res = await requestServices.createRequest(input);
    return res;
}