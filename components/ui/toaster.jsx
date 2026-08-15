"use client";

import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * An icon per variant, so the meaning of a message doesn't rest on the colour
 * of a 4px rail alone.
 */
const ICONS = {
  success: { Icon: CheckCircle2, tone: "text-success" },
  destructive: { Icon: AlertCircle, tone: "text-destructive" },
  warning: { Icon: AlertTriangle, tone: "text-warning" },
  info: { Icon: Info, tone: "text-info" },
  default: { Icon: Info, tone: "text-muted-foreground" },
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider swipeDirection="right" duration={4000}>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const { Icon, tone } = ICONS[variant] ?? ICONS.default;

        return (
          // `variant` is forwarded so the card gets its status rail. The old
          // Toaster hardcoded variant="default" here, which meant every
          // toast() call's variant was thrown away.
          <Toast key={id} variant={variant} {...props}>
            <Icon
              className={cn("mt-0.5 h-4 w-4 shrink-0", tone)}
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
              {action}
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
