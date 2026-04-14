"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { verifySettingsPin } from "@/app/actions/settings";
import { Loader2, ShieldCheck } from "lucide-react";

export function PinScreen() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onComplete = (value: string) => {
    startTransition(async () => {
      setError("");
      try {
        const res = await verifySettingsPin(value);
        if (res.success) {
          router.refresh();
        } else {
          setError(res.error || "Invalid PIN");
        }
      } catch {
        setError("Network error — please check your connection and try again.");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20">
      <div className="flex items-center justify-between bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 md:p-5 shadow-sm mb-8 mt-4">
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Settings
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              Admin verification required to continue
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
          <ShieldCheck className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-neutral-900 dark:text-white">
            Admin Verification Required
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Enter your 6-digit authorized PIN to access Settings.
          </p>
        </div>
        <div className="relative">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm rounded-xl">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}
          <InputOTP
            maxLength={6}
            onComplete={onComplete}
            disabled={isPending}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {error && (
          <p className="text-sm text-red-500 font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
