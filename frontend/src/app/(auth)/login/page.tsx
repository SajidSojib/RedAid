import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/module/auth/auth-shell";
import { LoginForm } from "@/components/module/auth/loginForm";

export default function LoginPage() {
  return (
    <AuthShell
      contentClassName="flex max-w-md flex-col justify-center"
      topRight={
        <>
          New to RedAid?{" "}
          <Link
            href="/signup"
            className="font-bold underline-offset-4 text-primary hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
