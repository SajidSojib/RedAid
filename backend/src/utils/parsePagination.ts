import { ApiError } from "./apiError";

export const parsePagination = (
  pageInput?: number | string,
  limitInput?: number | string,
) => {
  const page = pageInput === undefined ? 1 : Number(pageInput);
  const limit = limitInput === undefined ? 12 : Number(limitInput);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new ApiError(
      400,
      "Page must be positive and limit must be between 1 and 100",
    );
  }

  return { page, limit };
};