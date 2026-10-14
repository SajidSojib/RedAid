import { AuthShell } from "@/components/module/auth/auth-shell";
import { SignupView } from "@/components/module/auth/signup-view";
import Link from "next/link";

export default function SignupPage() {
  return (
    <AuthShell
      contentClassName="max-w-xl"
      topRight={
        <>
          Already registered?{" "}
          <Link
            href="/login"
            className="font-bold underline-offset-4 text-primary hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <SignupView />
    </AuthShell>
  );
}
