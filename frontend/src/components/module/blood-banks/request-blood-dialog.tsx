"use client";

import { useState, useTransition } from "react";
import { HeartHandshake, Link2, Loader, Minus, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBankRequest } from "@/action/bank-request.action";
import { bloodLabel } from "@/lib/blood";
import { cn } from "@/lib/utils";

type Stock = { bloodType: string; unitsAvailable: number };
export type OpenRequest = {
  id: string;
  bloodType: string;
  unitsRemaining: number;
  hospitalName: string | null;
};

const NONE = "none";

export function RequestBloodDialog({
  bankId,
  bankName,
  inventory,
  defaultBloodType,
  openRequests = [],
}: {
  bankId: string;
  bankName: string;
  inventory: Stock[];
  defaultBloodType?: string;
  openRequests?: OpenRequest[];
}) {
  const inStock = inventory.filter((i) => i.unitsAvailable > 0);
  const first =
    inStock.find((i) => i.bloodType === defaultBloodType)?.bloodType ??
    inStock[0]?.bloodType ??
    "";

  const [open, setOpen] = useState(false);
  const [pickedType, setPickedType] = useState(first);
  const [pickedUnits, setPickedUnits] = useState(1);
  const [note, setNote] = useState("");
  const [linkId, setLinkId] = useState(NONE);
  const [pending, startTransition] = useTransition();

  // A linked request decides the blood type and the bags
  const linked = openRequests.find((r) => r.id === linkId);
  const locked = Boolean(linked);
  const bloodType = linked?.bloodType ?? pickedType;
  const units = linked?.unitsRemaining ?? pickedUnits;

  const stock =
    inventory.find((i) => i.bloodType === bloodType)?.unitsAvailable ?? 0;
  const max = Math.min(stock, 15);
  const notEnough = units > stock;

  const linkItems = [
    { value: NONE, label: "Don't link" },
    ...openRequests.map((r) => ({
      value: r.id,
      label: `${bloodLabel(r.bloodType)} · ${r.unitsRemaining} bag${r.unitsRemaining === 1 ? "" : "s"} still needed · ${r.hospitalName ?? "No hospital"}`,
    })),
  ];

  const pick = (type: string) => {
    if (locked) return;
    setPickedType(type);
    setPickedUnits(1); // the new type may have less stock
  };

  const submit = () => {
    startTransition(async () => {
      const { error } = await createBankRequest({
        bankId,
        bloodType,
        unitsRequested: units,
        note: note.trim() || null,
        donationRequestId: linked ? linked.id : null,
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      setOpen(false);
      setNote("");
      setPickedUnits(1);
      setLinkId(NONE);
      toast.success("Request sent. The bank will contact you.");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            disabled={inStock.length === 0}
            className="shadow-md shadow-primary/20"
          />
        }
      >
        <HeartHandshake className="size-4" />
        Request blood
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request blood from {bankName}</DialogTitle>
          <DialogDescription>
            The bank sees your name and phone number and decides whether to
            approve it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {openRequests.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Link to one of my requests{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </p>
              <Select
                items={linkItems}
                value={linkId}
                onValueChange={(next) => next && setLinkId(next)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {linkItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {locked && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Link2 className="size-3" />
                  Blood type and bags follow your request. The bank also sees
                  its details, including the patient and contact number.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Blood type</p>
            <div className="grid grid-cols-4 gap-2">
              {inventory.map(({ bloodType: type, unitsAvailable }) => (
                <button
                  key={type}
                  type="button"
                  disabled={unitsAvailable === 0 && bloodType !== type}
                  onClick={() => pick(type)}
                  className={cn(
                    "h-11 rounded-lg border text-base font-bold transition-all disabled:cursor-not-allowed disabled:border-dashed disabled:text-muted-foreground/40",
                    bloodType === type
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "enabled:hover:border-primary/50 enabled:hover:text-primary",
                    locked && "cursor-not-allowed",
                    locked && bloodType !== type && "opacity-40",
                  )}
                >
                  {bloodLabel(type)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Bags needed</p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Decrease bags"
                disabled={locked || units <= 1}
                onClick={() => setPickedUnits(units - 1)}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-10 text-center text-lg font-semibold tabular-nums">
                {units}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Increase bags"
                disabled={locked || units >= max}
                onClick={() => setPickedUnits(units + 1)}
              >
                <Plus className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {stock} in stock
              </span>
            </div>
            {notEnough && (
              <p className="text-xs text-destructive">
                This bank has {stock} bag{stock === 1 ? "" : "s"} of{" "}
                {bloodLabel(bloodType)}, but your request needs {units}. Try
                another bank.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Note{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Hospital, patient ward, when you need it"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={submit}
            disabled={pending || !bloodType || notEnough}
          >
            {pending && <Loader className="animate-spin" />}
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
