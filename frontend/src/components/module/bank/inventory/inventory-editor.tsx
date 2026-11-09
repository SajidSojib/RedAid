"use client";

import { useState, useTransition } from "react";
import { Loader, Minus, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { bloodLabel } from "@/lib/blood";
import { cn } from "@/lib/utils";
import { InventoryItem } from "@/service/bank.service";
import { updateMyInventory } from "@/action/bank.action";

const MAX = 1000;
const LOW = 5; // 1 to 4 units counts as low stock

const level = (units: number) =>
  units === 0
    ? {
        label: "Out of stock",
        card: "border-destructive/40 bg-destructive/5",
        dot: "bg-destructive",
        text: "text-destructive",
      }
    : units < LOW
      ? {
          label: "Low",
          card: "border-amber-500/40 bg-amber-500/5",
          dot: "bg-amber-500",
          text: "text-amber-600 dark:text-amber-400",
        }
      : {
          label: "In stock",
          card: "",
          dot: "bg-emerald-500",
          text: "text-emerald-600 dark:text-emerald-400",
        };

export function InventoryEditor({ initial }: { initial: InventoryItem[] }) {
  const toMap = (items: InventoryItem[]) =>
    Object.fromEntries(items.map((i) => [i.bloodType, i.unitsAvailable]));

  const [saved, setSaved] = useState<Record<string, number>>(toMap(initial));
  const [values, setValues] = useState<Record<string, number>>(toMap(initial));
  const [pending, startTransition] = useTransition();

  const changed = initial
    .map((i) => i.bloodType)
    .filter((type) => values[type] !== saved[type]);

  const set = (type: string, next: number) =>
    setValues((v) => ({
      ...v,
      [type]: Math.min(MAX, Math.max(0, Math.floor(next) || 0)),
    }));

  const save = () => {
    startTransition(async () => {
      const { error } = await updateMyInventory(
        changed.map((type) => ({
          bloodType: type,
          unitsAvailable: values[type],
        })),
      );

      if (error) {
        toast.error(error.message);
        return;
      }
      setSaved(values);
      toast.success(
        `Updated ${changed.length} blood type${changed.length === 1 ? "" : "s"}`,
      );
    });
  };

  return (
    <div className="space-y-6">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {initial.map(({ bloodType }) => {
          const units = values[bloodType];
          const state = level(units);
          const dirty = units !== saved[bloodType];

          return (
            <li
              key={bloodType}
              className={cn(
                "space-y-3 rounded-xl border bg-card p-4 transition-colors",
                state.card,
                dirty && "ring-1 ring-primary",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {bloodLabel(bloodType)}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium",
                    state.text,
                  )}
                >
                  <span className={cn("size-2 rounded-full", state.dot)} />
                  {state.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Decrease ${bloodLabel(bloodType)}`}
                  disabled={units <= 0}
                  onClick={() => set(bloodType, units - 1)}
                >
                  <Minus className="size-4" />
                </Button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX}
                  value={units}
                  aria-label={`${bloodLabel(bloodType)} units`}
                  onChange={(e) =>
                    set(
                      bloodType,
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  className="h-9 w-full min-w-0 rounded-md border bg-background text-center text-lg font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Increase ${bloodLabel(bloodType)}`}
                  disabled={units >= MAX}
                  onClick={() => set(bloodType, units + 1)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={pending || changed.length === 0}>
          {pending && <Loader className="animate-spin" />}
          Save changes
          {changed.length > 0 && ` (${changed.length})`}
        </Button>
        <Button
          variant="ghost"
          disabled={pending || changed.length === 0}
          onClick={() => setValues(saved)}
        >
          <RotateCcw className="size-4" />
          Discard
        </Button>
      </div>
    </div>
  );
}
