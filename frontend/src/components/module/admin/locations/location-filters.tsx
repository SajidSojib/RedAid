"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaSelect } from "@/components/module/top-donors/donor-filters";
import type { Level, LocationOption } from "@/service/location.service";

export function LocationFilters({
  level,
  divisions,
  districts,
  upazilas,
}: {
  level: Level;
  divisions: LocationOption[];
  districts: LocationOption[];
  upazilas: LocationOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const divisionId = searchParams.get("divisionId") ?? "";
  const districtId = searchParams.get("districtId") ?? "";
  const upazilaId = searchParams.get("upazilaId") ?? "";

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

  const active = Boolean(q || divisionId);

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() || null });
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${level}s by English or Bengali name`}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
        {active && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQ("");
              router.replace(`${pathname}?level=${level}`, { scroll: false });
            }}
          >
            <X className="size-4" />
            Clear
          </Button>
        )}
      </form>

      {level !== "division" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <AreaSelect
            label="Division"
            allLabel="All divisions"
            value={divisionId}
            options={divisions}
            onChange={(id) =>
              update({ divisionId: id, districtId: null, upazilaId: null })
            }
          />
          {(level === "upazila" || level === "union") && (
            <AreaSelect
              label="District"
              allLabel="All districts"
              value={districtId}
              options={districts}
              disabled={!divisionId}
              onChange={(id) => update({ districtId: id, upazilaId: null })}
            />
          )}
          {level === "union" && (
            <AreaSelect
              label="Upazila"
              allLabel="All upazilas"
              value={upazilaId}
              options={upazilas}
              disabled={!districtId}
              onChange={(id) => update({ upazilaId: id })}
            />
          )}
        </div>
      )}
    </div>
  );
}
