"use client";

import { useEffect, useState } from "react";
import { Loader, MapPin, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAllDivisions,
  getDistrictsByDivisionId,
  getUnionsByUpazilaId,
  getUpazilasByDistrictId,
} from "@/action/location.action";
import { updateMyProfile } from "@/action/profile.action";
import type { ProfileArea } from "@/service/profile.service";

const MAX_AREAS = 5;
const WHOLE = "whole";

type Opt = { id: string; name: string; bn_name: string };
type Area = { upazilaId: string; unionId: string | null; label: string };

function Pick({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: Opt[];
  disabled?: boolean;
  onChange: (id: string) => void;
}) {
  const items = options.map((o) => ({ value: o.id, label: o.name }));
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        items={items}
        value={value || null}
        disabled={disabled}
        onValueChange={(next) => next && onChange(next)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {items.map((i) => (
            <SelectItem key={i.value} value={i.value}>
              {i.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function ServiceAreasEditor({
  initial,
  divisions,
}: {
  initial: ProfileArea[];
  divisions: Opt[];
}) {
  const [areas, setAreas] = useState<Area[]>(
    initial.map((a) => ({
      upazilaId: a.upazilaId,
      unionId: a.unionId,
      label: a.union
        ? `${a.union.name}, ${a.upazila.name}`
        : `${a.upazila.name} (whole upazila)`,
    })),
  );
  const [saved, setSaved] = useState(
    JSON.stringify(initial.map((a) => [a.upazilaId, a.unionId])),
  );
  const [saving, setSaving] = useState(false);

  const [districts, setDistricts] = useState<Opt[]>([]);
  const [upazilas, setUpazilas] = useState<Opt[]>([]);
  const [unions, setUnions] = useState<Opt[]>([]);
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [upazilaId, setUpazilaId] = useState("");
  const [unionId, setUnionId] = useState("");

  const pickDivision = async (id: string) => {
    setDivisionId(id);
    setDistrictId("");
    setUpazilaId("");
    setUnionId("");
    setUpazilas([]);
    setUnions([]);
    setDistricts((await getDistrictsByDivisionId(id)).data ?? []);
  };
  const pickDistrict = async (id: string) => {
    setDistrictId(id);
    setUpazilaId("");
    setUnionId("");
    setUnions([]);
    setUpazilas((await getUpazilasByDistrictId(id)).data ?? []);
  };
  const pickUpazila = async (id: string) => {
    setUpazilaId(id);
    setUnionId(WHOLE);
    setUnions((await getUnionsByUpazilaId(id)).data ?? []);
  };

  const add = () => {
    const upazila = upazilas.find((u) => u.id === upazilaId);
    if (!upazila) return;

    const whole = !unionId || unionId === WHOLE;
    const union = whole ? null : unions.find((u) => u.id === unionId);
    const next: Area = {
      upazilaId,
      unionId: union?.id ?? null,
      label: union
        ? `${union.name}, ${upazila.name}`
        : `${upazila.name} (whole upazila)`,
    };

    if (
      areas.some((a) => a.upazilaId === upazilaId && a.unionId === next.unionId)
    ) {
      toast.error("You already added this area");
      return;
    }
    if (
      !whole &&
      areas.some((a) => a.upazilaId === upazilaId && a.unionId === null)
    ) {
      toast.error(
        "The whole upazila is already added, so its unions are covered",
      );
      return;
    }

    // A whole upazila replaces any unions already chosen inside it
    const rest = whole ? areas.filter((a) => a.upazilaId !== upazilaId) : areas;
    if (rest.length >= MAX_AREAS) {
      toast.error(`You can choose up to ${MAX_AREAS} areas`);
      return;
    }
    setAreas([...rest, next]);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await updateMyProfile({
      serviceAreas: areas.map((a) => ({
        upazilaId: a.upazilaId,
        unionId: a.unionId,
      })),
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setSaved(JSON.stringify(areas.map((a) => [a.upazilaId, a.unionId])));
    toast.success("Service areas updated");
  };

  const dirty =
    JSON.stringify(areas.map((a) => [a.upazilaId, a.unionId])) !== saved;
  const unionItems = [
    { id: WHOLE, name: "Whole upazila (all unions)", bn_name: "" },
    ...unions,
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Your areas{" "}
          <span className="text-muted-foreground">
            ({areas.length}/{MAX_AREAS})
          </span>
        </p>
        {areas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No areas yet. You will not be notified until you add at least one.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <li key={`${a.upazilaId}:${a.unionId}`}>
                <Badge
                  variant="outline"
                  className="gap-1.5 border-primary/30 bg-primary/5 py-1 pr-1 pl-2.5 text-primary"
                >
                  <MapPin className="size-3" />
                  {a.label}
                  <button
                    type="button"
                    aria-label={`Remove ${a.label}`}
                    onClick={() => setAreas(areas.filter((x) => x !== a))}
                    className="rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Pick
            label="Division"
            value={divisionId}
            options={divisions}
            onChange={pickDivision}
          />
          <Pick
            label="District"
            value={districtId}
            options={districts}
            disabled={!divisionId}
            onChange={pickDistrict}
          />
          <Pick
            label="Upazila"
            value={upazilaId}
            options={upazilas}
            disabled={!districtId}
            onChange={pickUpazila}
          />
          <Pick
            label="Union"
            value={unionId}
            options={unionItems}
            disabled={!upazilaId}
            onChange={setUnionId}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!upazilaId}
          onClick={add}
        >
          <Plus className="size-4" />
          Add area
        </Button>
      </div>

      <Button onClick={save} disabled={saving || !dirty || areas.length === 0}>
        {saving && <Loader className="animate-spin" />}
        Save areas
      </Button>
    </div>
  );
}
