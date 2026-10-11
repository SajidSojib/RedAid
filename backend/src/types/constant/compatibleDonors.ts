import { BloodType } from "../../../generated/prisma/enums";

export const COMPATIBLE_Donors: Record<BloodType, BloodType[]> = {
  O_NEGATIVE: ["O_NEGATIVE"],
  O_POSITIVE: ["O_NEGATIVE", "O_POSITIVE"],
  A_NEGATIVE: ["A_NEGATIVE", "O_NEGATIVE"],
  A_POSITIVE: ["A_NEGATIVE", "A_POSITIVE", "O_NEGATIVE", "O_POSITIVE"],
  B_NEGATIVE: ["B_NEGATIVE", "O_NEGATIVE"],
  B_POSITIVE: ["B_NEGATIVE", "B_POSITIVE", "O_NEGATIVE", "O_POSITIVE"],
  AB_NEGATIVE: ["AB_NEGATIVE", "A_NEGATIVE", "B_NEGATIVE", "O_NEGATIVE"],
  AB_POSITIVE: [
    "AB_POSITIVE",
    "AB_NEGATIVE",
    "A_POSITIVE",
    "A_NEGATIVE",
    "B_POSITIVE",
    "B_NEGATIVE",
    "O_POSITIVE",
    "O_NEGATIVE",
  ],
};
