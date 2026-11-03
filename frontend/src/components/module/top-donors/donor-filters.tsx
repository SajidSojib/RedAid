"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LocationOption } from "@/service/location.service";

type Props = {
  divisions: LocationOption[];
  districts: LocationOption[];
  upazilas: LocationOption[];
  unions: LocationOption[];
};

const ALL = "all";

function AreaSelect({
  label,
  allLabel,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  allLabel: string;
  value: string;
  options: LocationOption[];
  disabled?: boolean;
  onChange: (id: string) => void;
}) {
  const items = [
    { value: ALL, label: allLabel },
    ...options.map((o) => ({ value: o.id, label: o.name })),
  ];
  const current = items.some((i) => i.value === (value || ALL))
    ? value || ALL
    : ALL;

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        items={items}
        value={current}
        disabled={disabled}
        onValueChange={(next) => {
          if (next) onChange(next === ALL ? "" : next);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function DonorFilters({
  divisions,
  districts,
  upazilas,
  unions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const divisionId = searchParams.get("divisionId") ?? "";
  const districtId = searchParams.get("districtId") ?? "";
  const upazilaId = searchParams.get("upazilaId") ?? "";
  const unionId = searchParams.get("unionId") ?? "";
  const active = Boolean(divisionId);

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

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="size-4 text-primary" />
          Filter by area
        </p>
        {active && (
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
            update({
              divisionId: id,
              districtId: null,
              upazilaId: null,
              unionId: null,
            })
          }
        />
        <AreaSelect
          label="District"
          allLabel="All districts"
          value={districtId}
          options={districts}
          disabled={!divisionId}
          onChange={(id) =>
            update({ districtId: id, upazilaId: null, unionId: null })
          }
        />
        <AreaSelect
          label="Upazila"
          allLabel="All upazilas"
          value={upazilaId}
          options={upazilas}
          disabled={!districtId}
          onChange={(id) => update({ upazilaId: id, unionId: null })}
        />
        <AreaSelect
          label="Union"
          allLabel="All unions"
          value={unionId}
          options={unions}
          disabled={!upazilaId}
          onChange={(id) => update({ unionId: id })}
        />
      </div>
    </div>
  );
}
