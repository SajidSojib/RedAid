"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLOOD_TYPE_OPTIONS } from "@/lib/validations/signup";
import type { LocationOption } from "@/service/location.service";
import { AreaSelect } from "../top-donors/donor-filters";

type Props = {
  divisions: LocationOption[];
  districts: LocationOption[];
  upazilas: LocationOption[];
};

export function BankFilters({ divisions, districts, upazilas }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const divisionId = searchParams.get("divisionId") ?? "";
  const districtId = searchParams.get("districtId") ?? "";
  const upazilaId = searchParams.get("upazilaId") ?? "";
  const bloodType = searchParams.get("bloodType") ?? "";

  const update = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const bloodTypes = BLOOD_TYPE_OPTIONS.map((o) => ({
    id: o.value,
    name: o.label,
    bn_name: "",
  }));

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="size-4 text-primary" />
          Filter banks
        </p>
        {(divisionId || bloodType) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            <X className="size-3.5" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AreaSelect
          label="Division"
          allLabel="All divisions"
          value={divisionId}
          options={divisions}
          onChange={(id) =>
            update({ divisionId: id, districtId: null, upazilaId: null })
          }
        />
        <AreaSelect
          label="District"
          allLabel="All districts"
          value={districtId}
          options={districts}
          disabled={!divisionId}
          onChange={(id) => update({ districtId: id, upazilaId: null })}
        />
        <AreaSelect
          label="Upazila"
          allLabel="All upazilas"
          value={upazilaId}
          options={upazilas}
          disabled={!districtId}
          onChange={(id) => update({ upazilaId: id })}
        />
        <AreaSelect
          label="In stock"
          allLabel="Any blood type"
          value={bloodType}
          options={bloodTypes}
          onChange={(id) => update({ bloodType: id })}
        />
      </div>
    </div>
  );
}
