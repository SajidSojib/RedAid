"use server";

import { RegisterBankOwnerInput, RegisterUserInput, userServices } from "@/service/user.service";



export const registerUser = async (input: RegisterUserInput) => {
  return await userServices.registerUser(input);
};

export const registerBank = async (input: RegisterBankOwnerInput) => {
  return await userServices.registerBank(input);
};

export const loginUser = async (email: string, password: string) => {
  return await userServices.loginUser(email, password);
};