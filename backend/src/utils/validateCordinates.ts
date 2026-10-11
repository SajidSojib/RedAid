import { ApiError } from "./apiError";

export const validateCoordinates = (
  latitude?: number | null,
  longitude?: number | null,
) => {
  if ((latitude == null) !== (longitude == null)) {
    throw new ApiError(400, "Provide both latitude and longitude, or neither");
  }

  if (latitude != null && longitude != null) {
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new ApiError(400, "Invalid latitude or longitude");
    }
  }
};
