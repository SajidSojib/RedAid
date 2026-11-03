import { redirect } from "next/navigation";
import { userServices } from "@/service/user.service";
import { RequestForm } from "@/components/module/request/request-form";

export const metadata = { title: "Request blood · RedAid" };

export default async function NewRequestPage() {
  const { data: session } = await userServices.getSessionServer();
  const user = session?.user;

  if (!user) redirect("/login?next=/add-request");

  // Banks and admins have their own flows. The backend only allows USER accounts anyway.
  if (user.role && user.role !== "USER") {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-center">Request blood</h1>
        <p className="mt-2 text-muted-foreground text-center">
          Blood requests are created from donor and requester accounts. Use one
          to create a request.
        </p>
      </main>
    );
  }

  return (
    <main className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_at_top,black,transparent_65%)]"
      />
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -z-10 size-112 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="container mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 space-y-2 motion-safe:animate-fade-up">
          <h1 className="text-3xl font-bold tracking-tight text-center">
            Request{" "}
            <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
              blood
            </span>
          </h1>
          <p className="text-muted-foreground text-center">
            Tell us what is needed and where. We will notify eligible donors in
            that area straight away.
          </p>
        </div>

        <div
          style={{ animationDelay: "100ms" }}
          className="rounded-2xl border bg-card p-6 shadow-lg sm:p-8 motion-safe:animate-fade-up"
        >
          <RequestForm ownPhone={user.phone} />
        </div>
      </div>
    </main>
  );
}
