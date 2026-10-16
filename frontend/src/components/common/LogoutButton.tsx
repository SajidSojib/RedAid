"use client";

import React from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader, LogOut } from "lucide-react";

export default function LogoutButton({ className, icon=false }: { className?: string; icon?: boolean }) {
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
      className={className}
      onClick={handleLogout}
      disabled={isSubmitting}
    >
      {isSubmitting && (
        <Loader className="h-4 w-4 animate-spin" />
      )}
      {(icon && !isSubmitting) && <LogOut className="h-4 w-4" />}
      Logout
    </Button>
  );
}
