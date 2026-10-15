import { redirect } from "next/navigation";
import { userServices } from "@/service/user.service";
import { RequestForm } from "@/components/module/request/request-form";

export const metadata = { title: "Request blood · RedAid" };

export default async function NewRequestPage() {
  const { data: session } = await userServices.getSessionServer();
  const user = session?.user;

  if (!user) redirect("/login?next=/requests/new");

  // Banks and admins have their own flows. The backend only allows USER accounts anyway.
  if (user.role && user.role !== "USER") {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Request blood</h1>
        <p className="mt-2 text-muted-foreground">
          Blood requests are created from donor and requester accounts. Use one
          to create a request.
        </p>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Request blood</h1>
        <p className="text-muted-foreground">
          Tell us what is needed and where. We will notify eligible donors in that
          area straight away.
        </p>
      </div>

      <RequestForm ownPhone={user.phone} />
    </main>
  );
}
