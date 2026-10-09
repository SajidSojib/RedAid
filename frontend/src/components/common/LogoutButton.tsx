"use client";

import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader } from "lucide-react";

export default function LogoutButton() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const toastId = toast.loading("Logging you out...");
    setIsSubmitting(true);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // router.push("/login");
            router.refresh();
          },
        },
      });
      toast.success("Logged out successfully", { id: toastId });
      setIsSubmitting(false);
    } catch (error) {
        setIsSubmitting(false);
        toast.error("Something went wrong", { id: toastId });
    }
  };
  return (
    <Button
      className="w-full"
      render={<Link href="/logout" />}
      nativeButton={false}
      onClick={handleLogout}
      disabled={isSubmitting}
    >
      {isSubmitting && (
        <Loader className="h-4 w-4 animate-spin" />
      )}
      Logout
    </Button>
  );
}
