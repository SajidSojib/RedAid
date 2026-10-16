import Link from "next/link";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { bloodLabel } from "@/lib/blood";
import { URGENCY_OPTIONS } from "@/lib/validations/request";
import type { LocationOption } from "@/service/location.service";

type Chip = { id: string; label: string; href: string };

const split = (value: string | null) =>
  value ? value.split(",").filter(Boolean) : [];

export function ActiveFilters({
  params,
  divisions,
  districts,
  upazilas,
  unions,
}: {
  params: URLSearchParams;
  divisions: LocationOption[];
  districts: LocationOption[];
  upazilas: LocationOption[];
  unions: LocationOption[];
}) {
  const without = (key: string, value?: string) => {
    const next = new URLSearchParams(params);

    if (value) {
      const rest = split(next.get(key)).filter((item) => item !== value);
      if (rest.length > 0) next.set(key, rest.join(","));
      else next.delete(key);
    } else {
      next.delete(key);
    }

    next.delete("page");
    const qs = next.toString();
    return qs ? `/all-requests?${qs}` : "/all-requests";
  };

  const chips: Chip[] = [];

  for (const value of split(params.get("bloodType"))) {
    chips.push({
      id: `blood-${value}`,
      label: bloodLabel(value),
      href: without("bloodType", value),
    });
  }

  for (const value of split(params.get("urgency"))) {
    chips.push({
      id: `urgency-${value}`,
      label:
        URGENCY_OPTIONS.find((option) => option.value === value)?.label ??
        value,
      href: without("urgency", value),
    });
  }

  // One chip for the deepest location. Removing it steps back up one level.
  const levels = [
    ["unionId", unions],
    ["upazilaId", upazilas],
    ["districtId", districts],
    ["divisionId", divisions],
  ] as const;

  for (const [key, options] of levels) {
    const id = params.get(key);
    if (id) {
      chips.push({
        id: key,
        label: options.find((option) => option.id === id)?.name ?? "Location",
        href: without(key),
      });
      break;
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.id}
          href={chip.href}
          aria-label={`Remove filter ${chip.label}`}
        >
          <Badge
            variant="secondary"
            className="gap-1 pr-1.5 hover:bg-secondary/70"
          >
            {chip.label}
            <X className="size-3" />
          </Badge>
        </Link>
      ))}
      <Link
        href="/all-requests"
        className="px-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Clear all
      </Link>
    </div>
  );
}
