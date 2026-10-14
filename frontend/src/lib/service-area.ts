import type { ServiceAreaValue } from "@/lib/validations/signup";

export type AddAreaResult =
  | { ok: true; areas: ServiceAreaValue[]; replaced: number }
  | { ok: false; message: string };

export function addServiceArea(
  areas: ServiceAreaValue[],
  area: ServiceAreaValue,
): AddAreaResult {
  const sameUpazila = (a: ServiceAreaValue) => a.upazilaId === area.upazilaId;
  const wholeAlreadyAdded = areas.some(
    (a) => sameUpazila(a) && a.unionId === null,
  );

  if (area.unionId === null) {
    if (wholeAlreadyAdded) {
      return { ok: false, message: "You've already added this upazila" };
    }
    // The whole upazila covers its unions, so drop the specific ones
    const kept = areas.filter((a) => !sameUpazila(a));
    return {
      ok: true,
      areas: [...kept, area],
      replaced: areas.length - kept.length,
    };
  }

  if (wholeAlreadyAdded) {
    return {
      ok: false,
      message:
        "You already cover the whole upazila, so there's no need to add a union in it",
    };
  }

  if (areas.some((a) => sameUpazila(a) && a.unionId === area.unionId)) {
    return { ok: false, message: "You've already added this union" };
  }

  return { ok: true, areas: [...areas, area], replaced: 0 };
}
