import { DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function DialogLoading() {
  return (
    <>
      <DialogHeader className="border-b p-4 text-left">
        <DialogTitle>Loading request...</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 p-4" aria-hidden>
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </>
  );
}

export function DialogError({ message }: { message: string }) {
  return (
    <>
      <DialogHeader className="border-b p-4 text-left">
        <DialogTitle>Could not open this request</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
      </div>
    </>
  );
}
