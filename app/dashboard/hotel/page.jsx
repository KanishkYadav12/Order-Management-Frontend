"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  MapPin,
  Phone,
  Mail,
  Pencil,
  Check,
  X,
  Loader2,
  Building2,
  Receipt,
  Clock,
  ImageIcon,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/ui/empty-state";
import { useHotelProfile } from "@/hooks/hotel/useHotelProfile";
import { cn } from "@/lib/utils";

/** A labelled fact with an icon; renders nothing when there's nothing to say. */
function Fact({ Icon, label, value, href }) {
  if (!value) return null;

  const body = (
    <>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="block text-sm font-medium text-pretty">{value}</span>
      </span>
    </>
  );

  return href ? (
    <a href={href} className="flex gap-3 rounded-lg p-2 -m-2 transition-colors hover:bg-muted/60">
      {body}
    </a>
  ) : (
    <div className="flex gap-3">{body}</div>
  );
}

/** Click-to-edit field. Reading is the common case, so reading is the default. */
function Editable({
  label,
  value,
  placeholder,
  multiline,
  saving,
  onSave,
  className,
  display,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const start = () => {
    setDraft(value ?? "");
    setEditing(true);
  };

  const commit = async () => {
    if (draft === (value ?? "")) return setEditing(false);
    const result = await onSave(draft);
    if (result?.ok !== false) setEditing(false);
  };

  if (!editing) {
    return (
      <div className={cn("group/edit relative", className)}>
        {display ?? (
          <p className={cn("text-pretty", !value && "italic text-muted-foreground")}>
            {value || placeholder}
          </p>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={start}
          className="absolute -right-1 -top-1 h-7 w-7 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/edit:opacity-100"
          aria-label={`Edit ${label}`}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  const Field = multiline ? Textarea : Input;

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <Field
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        rows={multiline ? 4 : undefined}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Escape") setEditing(false);
          if (event.key === "Enter" && !multiline) commit();
        }}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={commit} disabled={saving} className="gap-1.5">
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="gap-1.5">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

/** Overlays a file picker on an image. */
function PhotoPicker({ onPick, saving, className, children, label }) {
  const input = useRef(null);

  return (
    <div className={cn("group/photo relative", className)}>
      {children}

      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={saving}
        className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/photo:opacity-100 disabled:cursor-wait"
      >
        <span className="flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-xs font-semibold shadow-sm">
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {label}
        </span>
      </button>

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onPick(file);
        }}
      />
    </div>
  );
}

export default function HotelProfilePage() {
  const { hotel, loading, error, saving, refetch, update, uploadImage } =
    useHotelProfile();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-48 rounded-xl sm:h-60" />
        <div className="shimmer h-32 rounded-xl" />
        <div className="shimmer h-40 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn't load your restaurant"
        description={error}
        onRetry={refetch}
      />
    );
  }

  if (!hotel) return null;

  const billing = hotel.billing ?? {};
  const hours = hotel.serviceHours ?? {};

  return (
    <div className="space-y-4">
      {/* Banner + logo. The hotel already stored both and neither was ever
          rendered, so every restaurant looked identical in its own dashboard. */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <PhotoPicker
          label={hotel.banner ? "Change cover" : "Add a cover photo"}
          saving={saving}
          onPick={(file) => uploadImage("banner", file)}
          className="h-44 w-full sm:h-56"
        >
          {hotel.banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hotel.banner}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-muted to-muted">
              <span className="flex flex-col items-center gap-1.5 text-muted-foreground">
                <ImageIcon className="h-7 w-7" aria-hidden="true" />
                <span className="text-xs font-medium">No cover photo yet</span>
              </span>
            </div>
          )}
        </PhotoPicker>

        <div className="px-5 pb-5">
          <div className="flex flex-wrap items-end gap-4">
            <PhotoPicker
              label="Change"
              saving={saving}
              onPick={(file) => uploadImage("logo", file)}
              className="-mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-xl border-4 border-card bg-muted shadow-sm"
            >
              {hotel.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hotel.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
              )}
            </PhotoPicker>

            <div className="min-w-0 flex-1 pt-2">
              <Editable
                label="Restaurant name"
                value={hotel.name}
                placeholder="Name your restaurant"
                saving={saving}
                onSave={(name) => update({ name })}
                display={
                  <h1 className="truncate text-2xl font-bold tracking-tight">
                    {hotel.name || "Your restaurant"}
                  </h1>
                }
              />
              {hotel.location && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{hotel.location}</span>
                </p>
              )}
            </div>

            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/dashboard/configuration">
                <Settings className="h-4 w-4" aria-hidden="true" />
                Billing settings
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* About */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">About</h2>
          <Editable
            label="Description"
            value={hotel.description}
            placeholder="Tell guests what your kitchen is known for — the cuisine, the story, what to order."
            multiline
            saving={saving}
            onSave={(description) => update({ description })}
            display={
              <p
                className={cn(
                  "text-sm leading-relaxed text-pretty",
                  !hotel.description && "italic text-muted-foreground"
                )}
              >
                {hotel.description ||
                  "Tell guests what your kitchen is known for — the cuisine, the story, what to order."}
              </p>
            }
          />

          <div className="mt-5 space-y-4 border-t pt-5">
            <Editable
              label="Address"
              value={hotel.location}
              placeholder="Street, area, city"
              saving={saving}
              onSave={(location) => update({ location })}
              display={<Fact Icon={MapPin} label="Address" value={hotel.location || "—"} />}
            />
            <Editable
              label="Phone"
              value={hotel.phone}
              placeholder="+91 …"
              saving={saving}
              onSave={(phone) => update({ phone })}
              display={
                <Fact
                  Icon={Phone}
                  label="Phone"
                  value={hotel.phone || "—"}
                  href={hotel.phone ? `tel:${hotel.phone}` : undefined}
                />
              }
            />
            <Editable
              label="Email"
              value={hotel.email}
              placeholder="hello@restaurant.com"
              saving={saving}
              onSave={(email) => update({ email })}
              display={
                <Fact
                  Icon={Mail}
                  label="Email"
                  value={hotel.email || "—"}
                  href={hotel.email ? `mailto:${hotel.email}` : undefined}
                />
              }
            />
          </div>
        </section>

        {/* Read-only summary of what's set elsewhere, so this page shows the
            whole restaurant without becoming a second settings screen. */}
        <section className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Billing
            </h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">GSTIN</dt>
                <dd className="truncate font-mono text-xs font-medium">
                  {billing.gstin || "Not set"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tax rate</dt>
                <dd className="font-medium tabular">{billing.taxRatePercent ?? 0}%</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Service charge</dt>
                <dd className="font-medium tabular">
                  {billing.serviceChargePercent ?? 0}%
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Invoice prefix</dt>
                <dd className="font-mono text-xs font-medium">
                  {billing.invoicePrefix || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Service
            </h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Opens</dt>
                <dd className="font-medium tabular">{hours.opensAt || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Closes</dt>
                <dd className="font-medium tabular">{hours.closesAt || "—"}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
