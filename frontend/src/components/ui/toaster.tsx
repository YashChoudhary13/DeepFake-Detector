// src/components/ui/toaster.tsx
"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastItem,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <ToastProvider>
      {toasts.map((t: ToastItem) => {
        const { id, title, description, action, ...props } = t;

        // props will contain optional fields like open, variant, className
        // but NOT title/description/action — those we render inside the Toast body.
        return (
          <Toast key={id} {...(props as any)}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action && <div>{action}</div>}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
