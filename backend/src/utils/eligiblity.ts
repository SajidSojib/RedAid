export const ELIGIBILITY_DAYS = 90;
const DAY_MS = 86_400_000;

export const eligibilityCutoff = (now = new Date()) =>
  new Date(now.getTime() - ELIGIBILITY_DAYS * DAY_MS);

export const getEligibility = (
  lastDonationDate: Date | null,
  now = new Date(),
) => {
  if (!lastDonationDate) {
    return { eligible: true, nextEligibleDate: null, daysLeft: 0 };
  }

  const nextEligibleDate = new Date(
    lastDonationDate.getTime() + ELIGIBILITY_DAYS * DAY_MS,
  );
  const daysLeft = Math.max(
    0,
    Math.ceil((nextEligibleDate.getTime() - now.getTime()) / DAY_MS),
  );

  return { eligible: daysLeft === 0, nextEligibleDate, daysLeft };
};
