"use client";

import { cn } from "@/lib/utils";
import {
  CircleDashed,
  Clock,
  Flame,
  BellRing,
  CheckCircle2,
  XCircle,
  CircleDot,
  Users,
  CalendarClock,
  Sparkles,
} from "lucide-react";

/**
 * Status pills.
 *
 * Each state ships an icon and a written label alongside its colour, so the
 * board is readable without relying on hue — which matters for the ~8% of men
 * with a colour-vision deficiency, and on a glare-washed kitchen screen.
 */

const ORDER_STATES = {
  draft: { label: "Draft", Icon: CircleDashed, tone: "draft" },
  pending: { label: "New", Icon: Clock, tone: "pending" },
  preparing: { label: "Preparing", Icon: Flame, tone: "preparing" },
  ready: { label: "Ready", Icon: BellRing, tone: "ready" },
  completed: { label: "Served", Icon: CheckCircle2, tone: "completed" },
  cancelled: { label: "Cancelled", Icon: XCircle, tone: "cancelled" },
};

const TABLE_STATES = {
  free: { label: "Free", Icon: CircleDot, tone: "free" },
  occupied: { label: "Seated", Icon: Users, tone: "occupied" },
  reserved: { label: "Reserved", Icon: CalendarClock, tone: "reserved" },
  cleaning: { label: "Cleaning", Icon: Sparkles, tone: "cleaning" },
};

const BILL_STATES = {
  unpaid: { label: "Unpaid", Icon: Clock, tone: "pending" },
  paid: { label: "Paid", Icon: CheckCircle2, tone: "ready" },
  payLater: { label: "Pay later", Icon: CalendarClock, tone: "preparing" },
  refunded: { label: "Refunded", Icon: XCircle, tone: "draft" },
  void: { label: "Void", Icon: XCircle, tone: "cancelled" },
};

/* Explicit class strings so Tailwind's scanner can see them — a template
   literal like `bg-status-${tone}/10` would be purged from the build. */
const TONES = {
  draft: "border-status-draft/30 bg-status-draft/10 text-status-draft",
  pending: "border-status-pending/35 bg-status-pending/12 text-status-pending",
  preparing:
    "border-status-preparing/35 bg-status-preparing/12 text-status-preparing",
  ready: "border-status-ready/35 bg-status-ready/12 text-status-ready",
  completed:
    "border-status-completed/30 bg-status-completed/10 text-status-completed",
  cancelled:
    "border-status-cancelled/35 bg-status-cancelled/12 text-status-cancelled",
  free: "border-table-free/35 bg-table-free/12 text-table-free",
  occupied: "border-table-occupied/35 bg-table-occupied/12 text-table-occupied",
  reserved: "border-table-reserved/35 bg-table-reserved/12 text-table-reserved",
  cleaning: "border-table-cleaning/35 bg-table-cleaning/12 text-table-cleaning",
};

const SIZES = {
  sm: "px-1.5 py-0.5 text-2xs gap-1",
  md: "px-2 py-1 text-xs gap-1.5",
  lg: "px-2.5 py-1.5 text-sm gap-2",
};

const ICON_SIZES = { sm: "h-3 w-3", md: "h-3.5 w-3.5", lg: "h-4 w-4" };

const Badge = ({ state, size = "md", className, showIcon = true }) => {
  if (!state) return null;
  const { label, Icon, tone } = state;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        TONES[tone],
        SIZES[size],
        className
      )}
    >
      {showIcon && <Icon className={ICON_SIZES[size]} aria-hidden="true" />}
      {label}
    </span>
  );
};

export const OrderStatusBadge = ({ status, ...props }) => (
  <Badge state={ORDER_STATES[status] ?? ORDER_STATES.draft} {...props} />
);

export const TableStatusBadge = ({ status, ...props }) => (
  <Badge state={TABLE_STATES[status] ?? TABLE_STATES.free} {...props} />
);

export const BillStatusBadge = ({ status, ...props }) => (
  <Badge state={BILL_STATES[status] ?? BILL_STATES.unpaid} {...props} />
);

export { ORDER_STATES, TABLE_STATES, BILL_STATES };
