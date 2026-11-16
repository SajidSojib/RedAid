"use client";

import { useState, useTransition } from "react";
import { HeartHandshake, Loader, Minus, Plus } from "lucide-react";
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
  const [bloodType, setBloodType] = useState(first);
  const [units, setUnits] = useState(1);
  const [note, setNote] = useState("");
  const [linkId, setLinkId] = useState(NONE);
  const [pending, startTransition] = useTransition();

  const stock =
    inventory.find((i) => i.bloodType === bloodType)?.unitsAvailable ?? 0;
  const max = Math.min(stock, 15);

  const linkItems = [
    { value: NONE, label: "Don't link" },
    ...openRequests.map((r) => ({
      value: r.id,
      label: `${bloodLabel(r.bloodType)} · ${r.hospitalName ?? "No hospital"}`,
    })),
  ];

  const pick = (type: string) => {
    setBloodType(type);
    setUnits(1); // the new type may have less stock
  };

  const submit = () => {
    startTransition(async () => {
      const { error } = await createBankRequest({
        bankId,
        bloodType,
        unitsRequested: units,
        note: note.trim() || null,
        donationRequestId: linkId === NONE ? null : linkId,
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      setOpen(false);
      setNote("");
      setUnits(1);
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
          <div className="space-y-2">
            <p className="text-sm font-medium">Blood type</p>
            <div className="grid grid-cols-4 gap-2">
              {inventory.map(({ bloodType: type, unitsAvailable }) => (
                <button
                  key={type}
                  type="button"
                  disabled={unitsAvailable === 0}
                  onClick={() => pick(type)}
                  className={cn(
                    "h-11 rounded-lg border text-base font-bold transition-all disabled:cursor-not-allowed disabled:border-dashed disabled:text-muted-foreground/40",
                    bloodType === type
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "enabled:hover:border-primary/50 enabled:hover:text-primary",
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
                disabled={units <= 1}
                onClick={() => setUnits(units - 1)}
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
                disabled={units >= max}
                onClick={() => setUnits(units + 1)}
              >
                <Plus className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {stock} in stock
              </span>
            </div>
          </div>

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
            </div>
          )}

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
          <Button onClick={submit} disabled={pending || !bloodType}>
            {pending && <Loader className="animate-spin" />}
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
