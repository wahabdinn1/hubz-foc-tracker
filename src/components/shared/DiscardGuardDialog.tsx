"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DiscardGuardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onDiscard: () => void
}

export function DiscardGuardDialog({ open, onOpenChange, onDiscard }: DiscardGuardDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                <AlertDialogHeader>
                    <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You have unsaved changes. Are you sure you want to discard them?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onDiscard}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Discard
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
