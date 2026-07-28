
"use client"

import * as React from "react"
import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

function Dialog({ open, onOpenChange, children, ...props }: React.ComponentProps<typeof BaseDialog.Root>) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange} {...props}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <BaseDialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-auto rounded-xl bg-white dark:bg-gray-950 p-6 shadow-lg ring-1 ring-gray-200 dark:ring-gray-800">
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}

function DialogContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-4", className)} {...props} />
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 border-b pb-4", className)} {...props} />
}

function DialogTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <BaseDialog.Title className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <BaseDialog.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center justify-end gap-2 pt-4 border-t", className)} {...props} />
}

function DialogClose({ className, variant = "icon", ...props }: React.ComponentProps<"button"> & { variant?: "icon" | "button" }) {
  if (variant === "button") {
    return (
      <BaseDialog.Close
        className={cn("inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground", className)}
        {...props}
      >
        İptal
      </BaseDialog.Close>
    )
  }
  return (
    <BaseDialog.Close
      className={cn("absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100", className)}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Kapat</span>
    </BaseDialog.Close>
  )
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose }
