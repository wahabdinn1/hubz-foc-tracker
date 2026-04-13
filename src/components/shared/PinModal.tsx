"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { verifyPin } from "@/server/auth";
import { Loader2 } from "lucide-react";

export function PinModal() {
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const onComplete = (value: string) => {
        startTransition(async () => {
            setError("");
            try {
                const res = await verifyPin(value);
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
        <Dialog open={true} onOpenChange={() => { }}>
            <DialogContent
                className="sm:max-w-md [&>button]:hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 transition-colors"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-center text-neutral-900 dark:text-white transition-colors">Enter Access PIN</DialogTitle>
                    <DialogDescription className="text-center text-neutral-500 dark:text-neutral-400 transition-colors">
                        Please enter your 6-digit authorized PIN to access the Hubz FOC Tracker.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center py-6 space-y-4 relative">
                    {/* Loading overlay (#10) */}
                    {isPending && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm rounded-xl">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    )}
                    <InputOTP maxLength={6} onComplete={onComplete} disabled={isPending}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                    {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                </div>
            </DialogContent>
        </Dialog>
    );
}
