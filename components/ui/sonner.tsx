"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-600 flex-shrink-0" />
        ),
        info: (
          <InfoIcon className="size-4 text-blue-600 flex-shrink-0" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600 flex-shrink-0" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-rose-600 flex-shrink-0" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-blue-600 flex-shrink-0" />
        ),
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#0f172a",
          "--normal-border": "#e2e8f0",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-white !text-slate-900 !border-slate-200/90 shadow-xl shadow-slate-900/10 rounded-2xl p-4 font-sans border",
          title: "!text-slate-900 text-sm font-semibold",
          description: "!text-slate-500 text-xs mt-0.5",
          actionButton: "!bg-blue-600 !text-white !rounded-xl !text-xs !font-semibold",
          cancelButton: "!bg-slate-100 !text-slate-600 !rounded-xl !text-xs",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
