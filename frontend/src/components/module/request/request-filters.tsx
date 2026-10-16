"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Toggle } from "@/components/ui/toggle";
import { BLOOD_TYPE_OPTIONS } from "@/lib/validations/signup";
import { URGENCY_OPTIONS } from "@/lib/validations/request";
import type { LocationOption } from "@/service/location.service";

type Props = {
  divisions: LocationOption[];
  districts: LocationOption[];
  upazilas: LocationOption[];
  unions: LocationOption[];
};

const ALL = "all";
const LOCATION_KEYS = [
  "divisionId",
  "districtId",
  "upazilaId",
  "unionId",
] as const;

const toList = (value: string | null) =>
  value ? value.split(",").filter(Boolean) : [];

function FilterSelect({
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
    ...options.map((option) => ({ value: option.id, label: option.name })),
  ];
  const current = items.some((item) => item.value === (value || ALL))
    ? value || ALL
    : ALL;

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        items={items}
        value={current}
        onValueChange={(next) => {
          if (next) onChange(next === ALL ? "" : next);
        }}
        disabled={disabled}
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

export function RequestFilters({
  divisions,
  districts,
  upazilas,
  unions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setOpenMobile } = useSidebar();

  const bloodTypes = toList(searchParams.get("bloodType"));
  const urgencies = toList(searchParams.get("urgency"));
  const divisionId = searchParams.get("divisionId") ?? "";
  const districtId = searchParams.get("districtId") ?? "";
  const upazilaId = searchParams.get("upazilaId") ?? "";
  const unionId = searchParams.get("unionId") ?? "";

  const activeCount =
    bloodTypes.length +
    urgencies.length +
    (LOCATION_KEYS.some((key) => searchParams.get(key)) ? 1 : 0);

  const update = (changes: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      const text = Array.isArray(value) ? value.join(",") : value;
      if (text) params.set(key, text);
      else params.delete(key);
    }

    params.delete("page"); // a new filter always starts at page 1
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const toggle = (
    key: "bloodType" | "urgency",
    current: string[],
    value: string,
  ) =>
    update({
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });

  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Filters</h2>
            {activeCount > 0 && (
              <Badge variant="secondary">{activeCount}</Badge>
            )}
          </div>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.replace(pathname, { scroll: false })}
            >
              Clear all
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Blood type</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_TYPE_OPTIONS.map((type) => (
                <Toggle
                  key={type.value}
                  variant="outline"
                  pressed={bloodTypes.includes(type.value)}
                  onPressedChange={() =>
                    toggle("bloodType", bloodTypes, type.value)
                  }
                  className="h-9 aria-pressed:border-primary! aria-pressed:bg-primary! aria-pressed:text-primary-foreground!"
                >
                  {type.label}
                </Toggle>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Pick as many as you like.
            </p>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Urgency</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-3 pt-1">
            {URGENCY_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center gap-3">
                <Checkbox
                  id={`urgency-${option.value}`}
                  checked={urgencies.includes(option.value)}
                  onCheckedChange={() =>
                    toggle("urgency", urgencies, option.value)
                  }
                />
                <Label
                  htmlFor={`urgency-${option.value}`}
                  className="font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Location</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4 pt-1">
            <FilterSelect
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
            <FilterSelect
              label="District"
              allLabel="All districts"
              value={districtId}
              options={districts}
              disabled={!divisionId}
              onChange={(id) =>
                update({ districtId: id, upazilaId: null, unionId: null })
              }
            />
            <FilterSelect
              label="Upazila"
              allLabel="All upazilas"
              value={upazilaId}
              options={upazilas}
              disabled={!districtId}
              onChange={(id) => update({ upazilaId: id, unionId: null })}
            />
            <FilterSelect
              label="Union"
              allLabel="All unions"
              value={unionId}
              options={unions}
              disabled={!upazilaId}
              onChange={(id) => update({ unionId: id })}
            />
            <p className="text-xs text-muted-foreground">
              Choosing an upazila also shows requests for any union in it.
            </p>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 md:hidden">
        <Button className="w-full" onClick={() => setOpenMobile(false)}>
          Show results
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
