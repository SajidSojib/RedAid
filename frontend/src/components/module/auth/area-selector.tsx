"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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
import { getAllDivisions, getDistrictsByDivisionId, getUnionsByUpazilaId, getUpazilasByDistrictId } from "@/action/location.action";

export type SelectedArea = {
  upazilaId: string;
  unionId: string | null;
  label: string;
};

type LoadingKey = "divisions" | "districts" | "upazilas" | "unions";
type LoadResult = Promise<{
  data: LocationOption[] | null;
  error: { message: string } | null;
}>;

const WHOLE_UPAZILA = "whole-upazila";

function LocationSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  loading,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: LocationOption[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  // Lets the trigger show the name instead of the id
  const items = options.map((option) => ({
    value: option.id,
    label: option.name,
  }));

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        items={items}
        value={value || null} // null shows the placeholder, "" may not
        onValueChange={(next) => {
          if (next) onChange(next); // ignore null, nothing here clears a selection
        }}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

type AreaSelectorProps = {
  // "add": the user presses "Add area" (donors pick several)
  // "single": the selection is reported as soon as an upazila is chosen (banks pick one)
  mode: "add" | "single";
  withUnion?: boolean;
  wholeLabel?: string;
  onSelect: (area: SelectedArea | null) => void;
};

export function AreaSelector({
  mode,
  withUnion = false,
  wholeLabel = "Whole upazila (all unions)",
  onSelect,
}: AreaSelectorProps) {
  const [divisions, setDivisions] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [upazilas, setUpazilas] = useState<LocationOption[]>([]);
  const [unions, setUnions] = useState<LocationOption[]>([]);

  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [upazilaId, setUpazilaId] = useState("");
  const [unionId, setUnionId] = useState(WHOLE_UPAZILA);

  const [loading, setLoading] = useState<LoadingKey | null>("divisions");

  const load = async (
    key: LoadingKey,
    request: LoadResult,
    apply: (items: LocationOption[]) => void,
  ) => {
    setLoading(key);
    try {
      const { data, error } = await request;
      if (error || !data) {
        toast.error("Couldn't load locations. Please try again.");
      } else {
        apply(data);
      }
    } catch {
      toast.error("Couldn't load locations. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchDivisions = async () => {
      try {
        const { data, error } = await getAllDivisions();

        if (cancelled) return;

        if (error || !data) {
          toast.error("Couldn't load locations. Please try again.");
        } else {
          setDivisions(data);
        }
      } catch {
        if (!cancelled) {
          toast.error("Couldn't load locations. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(null);
        }
      }
    };

    void fetchDivisions();

    return () => {
      cancelled = true;
    };
  }, []);

  const buildArea = (upId: string, unId: string): SelectedArea | null => {
    const upazila = upazilas.find((u) => u.id === upId);
    const district = districts.find((d) => d.id === districtId);
    if (!upazila || !district) return null;

    const union =
      unId === WHOLE_UPAZILA
        ? null
        : (unions.find((u) => u.id === unId) ?? null);
    const place = `${upazila.name}, ${district.name}`;
    const label = union
      ? `${union.name}, ${place}`
      : withUnion
        ? `${place} (all unions)`
        : place;

    return { upazilaId: upazila.id, unionId: union?.id ?? null, label };
  };

  const handleDivision = (id: string) => {
    setDivisionId(id);
    setDistrictId("");
    setUpazilaId("");
    setUnionId(WHOLE_UPAZILA);
    setDistricts([]);
    setUpazilas([]);
    setUnions([]);
    onSelect(null);
    void load("districts", getDistrictsByDivisionId(id), setDistricts);
  };

  const handleDistrict = (id: string) => {
    setDistrictId(id);
    setUpazilaId("");
    setUnionId(WHOLE_UPAZILA);
    setUpazilas([]);
    setUnions([]);
    onSelect(null);
    void load("upazilas", getUpazilasByDistrictId(id), setUpazilas);
  };

  const handleUpazila = (id: string) => {
    setUpazilaId(id);
    setUnionId(WHOLE_UPAZILA);
    setUnions([]);
    if (withUnion) void load("unions", getUnionsByUpazilaId(id), setUnions);
    if (mode === "single") onSelect(buildArea(id, WHOLE_UPAZILA));
  };

  const handleUnion = (id: string) => {
    setUnionId(id);
    if (mode === "single") onSelect(buildArea(upazilaId, id));
  };

  const handleAdd = () => {
    const area = buildArea(upazilaId, unionId);
    if (!area) return;

    onSelect(area);
    // Keep division and district, since donors often add several areas nearby
    setUpazilaId("");
    setUnionId(WHOLE_UPAZILA);
    setUnions([]);
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 shadow-md p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <LocationSelect
          label="Division"
          value={divisionId}
          onChange={handleDivision}
          options={divisions}
          placeholder="Select division"
          loading={loading === "divisions"}
        />
        <LocationSelect
          label="District"
          value={districtId}
          onChange={handleDistrict}
          options={districts}
          placeholder="Select district"
          disabled={!divisionId}
          loading={loading === "districts"}
        />
        <LocationSelect
          label="Upazila"
          value={upazilaId}
          onChange={handleUpazila}
          options={upazilas}
          placeholder="Select upazila"
          disabled={!districtId}
          loading={loading === "upazilas"}
        />
        {withUnion && (
          <LocationSelect
            label="Union"
            value={unionId}
            onChange={handleUnion}
            options={[
              {
                id: WHOLE_UPAZILA,
                name: "Whole upazila (all unions)",
                bn_name: "",
              },
              ...unions,
            ]}
            placeholder="Select union"
            disabled={!upazilaId}
            loading={loading === "unions"}
          />
        )}
      </div>

      {mode === "add" && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={!upazilaId}
        >
          <Plus className="size-4" />
          Add area
        </Button>
      )}
    </div>
  );
}
