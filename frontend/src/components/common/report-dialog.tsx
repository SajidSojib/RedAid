"use client";

import { useState, useTransition } from "react";
import { Flag, Loader } from "lucide-react";
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
import { createReport, getReportEligibility } from "@/action/report.action";
import type { Eligibility, ReportTarget } from "@/service/report.service";

const CATEGORIES = [
  { value: "FAKE_REQUEST", label: "Fake request" },
  { value: "ABUSIVE", label: "Abusive behavior" },
  { value: "NO_SHOW", label: "Didn't show up" },
  { value: "WRONG_INFORMATION", label: "Wrong information" },
  { value: "OTHER", label: "Something else" },
];

export function ReportDialog({
  target,
  name,
}: {
  target: ReportTarget;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [check, setCheck] = useState<Eligibility | null>(null);
  const [category, setCategory] = useState("OTHER");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const change = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setCheck(null);
    void getReportEligibility(target).then(({ data, error }) =>
      setCheck(
        data ?? {
          canReport: false,
          alreadyReported: false,
          reason: error?.message ?? "Couldn't check",
        },
      ),
    );
  };

  const submit = () =>
    startTransition(async () => {
      const { error } = await createReport({
        ...target,
        category,
        reason: reason.trim(),
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setOpen(false);
      setReason("");
      toast.success("Report sent. An admin will review it.");
    });

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogTrigger
        render={
          <Button size="sm" variant="ghost" className="text-muted-foreground" />
        }
      >
        <Flag className="size-4" />
        Report
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {name}</DialogTitle>
          <DialogDescription>
            Only report someone you worked with on a request. An admin reviews
            every report.
          </DialogDescription>
        </DialogHeader>

        {check === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Checking...
          </p>
        ) : !check.canReport ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {check.reason}
          </p>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">What happened?</p>
                <Select
                  items={CATEGORIES}
                  value={category}
                  onValueChange={(v) => v && setCategory(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Details</p>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Explain what happened (at least 10 characters)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={submit}
                disabled={pending || reason.trim().length < 10}
              >
                {pending && <Loader className="animate-spin" />}
                Send report
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
