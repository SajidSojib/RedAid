import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Phone,
  ShieldX,
  type LucideIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BankProfile, bankServices } from "@/service/bank.service";
import { BankProfileForm } from "@/components/module/bank/bank-profile/bank-profile-form";


export const metadata = { title: "Bank profile · RedAid" };

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const STATUS: Record<
  BankProfile["verificationStatus"],
  { icon: LucideIcon; label: string; chip: string; card: string }
> = {
  PENDING: {
    icon: Clock,
    label: "Pending review",
    chip: "bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-400",
    card: "border-amber-500/30 bg-amber-500/5",
  },
  VERIFIED: {
    icon: CheckCircle2,
    label: "Verified",
    chip: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400",
    card: "",
  },
  REJECTED: {
    icon: ShieldX,
    label: "Not approved",
    chip: "bg-destructive/10 text-destructive ring-destructive/30",
    card: "border-destructive/30 bg-destructive/5",
  },
};

export default async function BankProfilePage() {
  const { data: bank, error } = await bankServices.getMyBank();

  if (error || !bank) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load your bank</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  const ui = STATUS[bank.verificationStatus];
  const Icon = ui.icon;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Bank profile</h1>
        <p className="text-sm text-muted-foreground">
          Keep your {`bank's`} details current and track its verification.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-2xl border bg-card p-6">
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2.5rem_2.5rem] opacity-60 mask-[radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute -top-20 -right-16 size-56 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-card">
            <Building2 className="size-7" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-lg font-semibold">{bank.name}</p>
            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {bank.upazila.name}, {bank.upazila.district.name}
            </p>
            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <Phone className="size-3.5 shrink-0" />
              {bank.phone}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("gap-1 border-transparent ring-1", ui.chip)}
            >
              <Icon className="size-3" />
              {ui.label}
            </Badge>
            <Badge variant="secondary" className="gap-1 font-mono">
              <FileText className="size-3" />
              {bank.licenseNumber}
            </Badge>
          </div>
        </div>

        {bank.verificationStatus === "VERIFIED" && bank.verifiedAt && (
          <p className="relative mt-4 border-t pt-3 text-sm text-muted-foreground">
            Verified on {date(bank.verifiedAt)}. Your bank is visible to
            requesters.
          </p>
        )}
      </section>

      {bank.verificationStatus !== "VERIFIED" && (
        <section className={cn("rounded-2xl border p-5 text-sm", ui.card)}>
          <p className="font-semibold">
            {bank.verificationStatus === "PENDING"
              ? "An admin is checking your details"
              : "Your bank was not approved"}
          </p>
          <p className="mt-1 text-muted-foreground">
            {bank.verificationStatus === "PENDING"
              ? "Your bank becomes visible to requesters once it is verified."
              : "Update your details below and save. Your bank goes back to review automatically."}
          </p>
          {bank.verificationStatus === "REJECTED" && (
            <p className="mt-3 rounded-lg border bg-background/70 p-3">
              <span className="font-medium">Reason: </span>
              {bank.verificationNote ?? "No reason was given."}
            </p>
          )}
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bank details</CardTitle>
          <CardDescription>Registered {date(bank.createdAt)}</CardDescription>
        </CardHeader>
        <CardContent>
          <BankProfileForm bank={bank} />
        </CardContent>
      </Card>
    </div>
  );
}
