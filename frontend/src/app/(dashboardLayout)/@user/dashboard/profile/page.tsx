import { AlertCircle, Droplet, Medal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/components/module/user/profile/profile-form";
import { bloodLabel } from "@/lib/blood";
import { profileServices } from "@/service/profile.service";
import { ServiceAreasEditor } from "@/components/module/user/profile/service-area-editor";
import { getAllDivisions } from "@/action/location.action";

export const metadata = { title: "Profile · RedAid" };

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "U";

export default async function ProfilePage() {
  const [{ data: profile, error }, divisions] = await Promise.all([
    profileServices.getMyProfile(),
    getAllDivisions(),
  ]);

  if (error || !profile) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load your profile</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Profile and Areas
        </h1>
        <p className="text-sm text-muted-foreground">
          Keep your details current and choose where you can donate.
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
          <Avatar className="size-16 ring-2 ring-primary/30 ring-offset-2 ring-offset-card">
            <AvatarImage src={profile.image ?? undefined} alt={profile.name} />
            <AvatarFallback className="text-lg">
              {initials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{profile.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {profile.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.bloodType && (
              <Badge
                variant="outline"
                className="gap-1 border-primary/30 bg-primary/5 text-primary"
              >
                <Droplet className="size-3" />
                {bloodLabel(profile.bloodType)}
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <Medal className="size-3" />
              {profile.donationCount} donation
              {profile.donationCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>
            Your email {`can't`} be changed here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service areas</CardTitle>
          <CardDescription>
            You are alerted when a request in one of these areas needs your
            blood type. Choosing a whole upazila covers every union in it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceAreasEditor
            initial={profile.donorServiceAreas}
            divisions={divisions.data ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
