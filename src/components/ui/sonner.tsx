"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        style: {
          borderRadius: "var(--radius)",
        },
        classNames: {
          toast: "shadow-lg border !border-opacity-30",
          title: "font-semibold text-[13px]",
          description: "text-[12px] opacity-80",
          success:
            "!bg-emerald-50 !text-emerald-900 !border-emerald-200 dark:!bg-emerald-950 dark:!text-emerald-100 dark:!border-emerald-800",
          error:
            "!bg-red-50 !text-red-900 !border-red-200 dark:!bg-red-950 dark:!text-red-100 dark:!border-red-800",
          warning:
            "!bg-amber-50 !text-amber-900 !border-amber-200 dark:!bg-amber-950 dark:!text-amber-100 dark:!border-amber-800",
          info: "!bg-blue-50 !text-blue-900 !border-blue-200 dark:!bg-blue-950 dark:!text-blue-100 dark:!border-blue-800",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
