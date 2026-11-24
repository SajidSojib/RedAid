"use client";

import { useState, useTransition } from "react";
import { Loader, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    createLocation,
  getDistrictsByDivisionId,
  getUpazilasByDistrictId,
  updateLocation,
} from "@/action/location.action";
import type { Level, LocationOption, LocationRow } from "@/service/location.service";

const LABEL: Record<Level, string> = {
  division: "division",
  district: "district",
  upazila: "upazila",
  union: "union",
};

function Fields({
  level,
  form,
  set,
}: {
  level: Level;
  form: {
    name: string;
    bn_name: string;
    url: string;
    latitude: string;
    longitude: string;
  };
  set: (key: keyof typeof form, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Name (English)</FieldLabel>
          <Input
            value={form.name}
            maxLength={30}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Name (Bengali)</FieldLabel>
          <Input
            value={form.bn_name}
            maxLength={30}
            onChange={(e) => set("bn_name", e.target.value)}
          />
        </Field>
      </div>
      {level === "district" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Latitude</FieldLabel>
            <Input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => set("latitude", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Longitude</FieldLabel>
            <Input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => set("longitude", e.target.value)}
            />
          </Field>
        </div>
      )}
      <Field>
        <FieldLabel>Website URL (optional)</FieldLabel>
        <Input
          value={form.url}
          maxLength={150}
          onChange={(e) => set("url", e.target.value)}
        />
      </Field>
    </div>
  );
}

const payload = (
  level: Level,
  f: {
    name: string;
    bn_name: string;
    url: string;
    latitude: string;
    longitude: string;
  },
) => ({
  name: f.name,
  bn_name: f.bn_name,
  url: f.url,
  ...(level === "district" && {
    latitude: Number(f.latitude),
    longitude: Number(f.longitude),
  }),
});

// ---------- edit ----------

export function EditLocationDialog({
  level,
  row,
}: {
  level: Level;
  row: LocationRow;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: row.name,
    bn_name: row.bn_name,
    url: row.url,
    latitude: row.latitude?.toString() ?? "",
    longitude: row.longitude?.toString() ?? "",
  });

  const save = () =>
    startTransition(async () => {
      const { error } = await updateLocation(
        level,
        row.id,
        payload(level, form),
      );
      if (error) {
        toast.error(error.message);
        return;
      }
      setOpen(false);
      toast.success("Location updated");
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>
        <Pencil className="size-4" />
        Edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {LABEL[level]}</DialogTitle>
          <DialogDescription>
            {row.parent ? `Inside ${row.parent}. ` : ""}The parent can&apos;t be
            changed, because that would change which donors requests reach.
          </DialogDescription>
        </DialogHeader>
        <Fields
          level={level}
          form={form}
          set={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
        />
        <DialogFooter>
          <Button onClick={save} disabled={pending}>
            {pending && <Loader className="animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- add ----------

function ParentSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: LocationOption[];
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
        onValueChange={(v) => v && onChange(v)}
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

const EMPTY = { name: "", bn_name: "", url: "", latitude: "", longitude: "" };

export function AddLocationDialog({
  level,
  divisions,
}: {
  level: Level;
  divisions: LocationOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(EMPTY);
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [upazilaId, setUpazilaId] = useState("");
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [upazilas, setUpazilas] = useState<LocationOption[]>([]);

  // which parent the new location belongs to
  const parentId =
    level === "district"
      ? divisionId
      : level === "upazila"
        ? districtId
        : upazilaId;
  const needsParent = level !== "division";

  const pickDivision = async (id: string) => {
    setDivisionId(id);
    setDistrictId("");
    setUpazilaId("");
    setUpazilas([]);
    setDistricts((await getDistrictsByDivisionId(id)).data ?? []);
  };
  const pickDistrict = async (id: string) => {
    setDistrictId(id);
    setUpazilaId("");
    setUpazilas((await getUpazilasByDistrictId(id)).data ?? []);
  };

  const save = () =>
    startTransition(async () => {
      const { error } = await createLocation(level, {
        ...payload(level, form),
        ...(needsParent && { parentId }),
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setOpen(false);
      setForm(EMPTY);
      toast.success(
        `${LABEL[level][0]!.toUpperCase()}${LABEL[level].slice(1)} added`,
      );
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Add {LABEL[level]}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add {LABEL[level]}</DialogTitle>
          <DialogDescription>
            It shows up in every area selector right away.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {needsParent && (
            <div className="grid gap-4 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
              <ParentSelect
                label="Division"
                value={divisionId}
                options={divisions}
                onChange={pickDivision}
              />
              {(level === "upazila" || level === "union") && (
                <ParentSelect
                  label="District"
                  value={districtId}
                  options={districts}
                  disabled={!divisionId}
                  onChange={pickDistrict}
                />
              )}
              {level === "union" && (
                <ParentSelect
                  label="Upazila"
                  value={upazilaId}
                  options={upazilas}
                  disabled={!districtId}
                  onChange={setUpazilaId}
                />
              )}
            </div>
          )}
          <Fields
            level={level}
            form={form}
            set={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={save}
            disabled={pending || (needsParent && !parentId)}
          >
            {pending && <Loader className="animate-spin" />}
            Add {LABEL[level]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
