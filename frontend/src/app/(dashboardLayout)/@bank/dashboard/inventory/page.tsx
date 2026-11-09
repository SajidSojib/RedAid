import { AlertCircle, AlertTriangle, Droplet, PackageX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { timeAgo } from "@/lib/time";
import { bankServices } from "@/service/bank.service";
import { InventoryEditor } from "@/components/module/bank/inventory/inventory-editor";

export const metadata = { title: "Inventory · RedAid" };

export default async function InventoryPage() {
  const { data, error } = await bankServices.getMyInventory();

  if (error || !data) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load your inventory</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  const { bank, inventory } = data;
  const total = inventory.reduce((sum, i) => sum + i.unitsAvailable, 0);
  const out = inventory.filter((i) => i.unitsAvailable === 0).length;
  const low = inventory.filter(
    (i) => i.unitsAvailable > 0 && i.unitsAvailable < 5,
  ).length;
  const updates = inventory.flatMap((i) =>
    i.updatedAt ? [new Date(i.updatedAt).getTime()] : [],
  );
  const lastUpdate = updates.length
    ? new Date(Math.max(...updates)).toISOString()
    : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Keep your blood stock current so requesters know what you have.
        </p>
      </header>

      {bank.verificationStatus !== "VERIFIED" && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>Your stock is not public yet</AlertTitle>
          <AlertDescription>
            Requesters can see your bank and its inventory only after an admin
            verifies it. You can prepare your numbers now.
          </AlertDescription>
        </Alert>
      )}

      <section className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2.5rem_2.5rem] opacity-60 mask-[radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-16 size-72 rounded-full bg-primary/20 blur-3xl"
        />

        <div className="relative grid gap-8 md:grid-cols-[1fr_16rem] md:items-center">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Total units in stock
            </p>
            <p className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-6xl font-bold tracking-tight text-transparent tabular-nums motion-safe:animate-gradient">
              {total}
            </p>
            <p className="text-xs text-muted-foreground">
              {lastUpdate
                ? `Last updated ${timeAgo(lastUpdate)}`
                : "Not updated yet"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div className="flex items-center gap-3 rounded-xl border bg-background/60 p-3 backdrop-blur">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/30">
                <PackageX className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Out of stock</p>
                <p className="font-semibold tabular-nums">{out} of 8 types</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-background/60 p-3 backdrop-blur">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-400">
                <Droplet className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Low stock</p>
                <p className="font-semibold tabular-nums">{low} of 8 types</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Units by blood type</CardTitle>
          <CardDescription>
            Edit the numbers, then save once. Only the types you changed are
            sent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryEditor initial={inventory} />
        </CardContent>
      </Card>
    </div>
  );
}
