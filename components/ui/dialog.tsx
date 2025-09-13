"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Helper: mark background elements inert while dialog is open to prevent
// focus/race issues when aria-hidden is applied. We set the `inert` attribute
// on body children that do not contain the dialog root/portal. We avoid using
// `element.inert` property to stay compatible; use setAttribute instead.
function setInertForBackground(target: HTMLElement | null, inert = true) {
  try {
    if (typeof document === "undefined") return
    const children = Array.from(document.body.children) as HTMLElement[]
    for (const child of children) {
      // Keep the dialog's portal container and any ancestor that contains the
      // dialog element interactive. Everything else becomes inert.
      if (target && (child === target || child.contains(target))) {
        if (!inert) child.removeAttribute("inert")
        continue
      }

      if (inert) {
        child.setAttribute("inert", "")
      } else {
        child.removeAttribute("inert")
      }
    }
  } catch (e) {
    // ignore
  }
}

// Focus-in guard: when an element gains focus and it's inside an ancestor that
// is aria-hidden, blur it immediately to avoid the browser accessibility
// warning about hidden focused descendants. We ignore focus events inside the
// dialog target itself.
function createFocusInGuard(target: HTMLElement | null) {
  const handler = (e: FocusEvent) => {
    try {
      const t = e.target as HTMLElement | null
      if (!t) return

      // If the focused element is inside the dialog target, allow it.
      if (target && target.contains(t)) return

      // Walk up ancestors to see if any has aria-hidden="true"
      let el: HTMLElement | null = t
      while (el) {
        if (el.getAttribute && el.getAttribute("aria-hidden") === "true") {
          // Blur the element to avoid the warning.
          try {
            t.blur()
          } catch (err) {
            // ignore
          }
          break
        }
        el = el.parentElement
      }
    } catch (e) {
      // ignore
    }
  }

  return handler
}

const focusGuardMap = new WeakMap<HTMLElement, (e: FocusEvent) => void>()

const Dialog = DialogPrimitive.Root

const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>(({ onPointerDown, onKeyDown, ...props }, ref) => (
  <DialogPrimitive.Trigger
    ref={ref}
    onPointerDown={(event) => {
      try {
        if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
          ;(document.activeElement as HTMLElement).blur()
        }
      } catch (e) {
        // ignore
      }

      if (typeof onPointerDown === "function") onPointerDown(event)
    }}
    onKeyDown={(event) => {
      try {
        // If activated by keyboard (Enter or Space), blur previous focus first
        if (event.key === "Enter" || event.key === " ") {
          if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
            ;(document.activeElement as HTMLElement).blur()
          }
        }
      } catch (e) {
        // ignore
      }

      if (typeof onKeyDown === "function") onKeyDown(event)
    }}
    {...props}
  />
))
DialogTrigger.displayName = DialogPrimitive.Trigger.displayName

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
        // Prevent Radix from auto-focusing elements while aria-hidden may be
        // applied to the previously focused element. We stop the default focus
        // behavior, blur the previously focused element, then move focus into
        // the dialog on the next microtask so the DOM no longer has aria-hidden
        // on the focused element (avoids the browser accessibility warning).
        onOpenAutoFocus={(event) => {
          try {
            // Stop Radix from focusing an element before we've blurred the
            // previously active element.
            event.preventDefault()

            if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
              const active = document.activeElement as HTMLElement
              const current = event.currentTarget as HTMLElement | null
              if (!current || !current.contains(active)) {
                active.blur()
              }
            }

            // Make background inert so assistive tech and focus won't reach it.
            const target = event.currentTarget as HTMLElement | null
            setInertForBackground(target, true)

            // Attach a focusin guard to blur any element that becomes focused
            // while it's inside an aria-hidden region (prevents browser warning).
            try {
              if (target) {
                const guard = createFocusInGuard(target)
                document.addEventListener("focusin", guard, true)
                focusGuardMap.set(target, guard)
              }
            } catch (e) {
              // ignore
            }

            // Move focus into the dialog after the blur completes. Use setTimeout
            // with 0 to schedule on the next macrotask which is sufficient here.
            if (target) {
              setTimeout(() => {
                try {
                  // Prefer to focus the first focusable element inside the dialog.
                  const firstFocusable = target.querySelector<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
                  )
                  if (firstFocusable) {
                    firstFocusable.focus()
                  } else {
                    // Fallback focus on the dialog container
                    target.focus()
                  }
                } catch (e) {
                  // ignore
                }
              }, 0)
            }
          } catch (e) {
            // ignore
          }
        }}
      onCloseAutoFocus={(event) => {
        try {
          // Prevent Radix from moving focus while we ensure no element inside
          // the dialog remains focused (avoids the aria-hidden focused-descendant warning).
          event.preventDefault()

          if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
            // Blur any focused element so it won't be hidden from assistive tech.
            ;(document.activeElement as HTMLElement).blur()
          }

          // Clear inert on background elements when closing the dialog and
          // remove the focusin guard.
          const target = event.currentTarget as HTMLElement | null
          try {
            if (target) {
              const guard = focusGuardMap.get(target)
              if (guard) {
                document.removeEventListener("focusin", guard, true)
                focusGuardMap.delete(target)
              }
            }
          } catch (e) {
            // ignore
          }
          setInertForBackground(target, false)
        } catch (e) {
          // ignore
        }
      }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
