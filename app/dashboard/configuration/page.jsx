"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Save, Store, Percent, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ErrorState } from "@/components/ui/empty-state";
import api, { getErrorMessage, getFieldErrors } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { formatMoney } from "@/lib/format";

/**
 * Restaurant settings.
 *
 * This page used to be a grid of links to Dishes, Tables, Ingredients,
 * Categories and Offers — every one of which is already a sidebar item, so it
 * duplicated the navigation and settled nothing. It now holds the settings
 * that genuinely had no home: the restaurant's details and its billing rules.
 */

function Field({ label, hint, error, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Section({ title, description, Icon, children }) {
  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-start gap-3 border-b p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="grid gap-4 p-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { hotelId } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/hotels/me");
      const record = data?.data?.hotel;
      setHotel(record);
      reset({
        name: record?.name ?? "",
        location: record?.location ?? "",
        phone: record?.phone ?? "",
        email: record?.email ?? "",
        description: record?.description ?? "",
        gstin: record?.billing?.gstin ?? "",
        taxRatePercent: record?.billing?.taxRatePercent ?? 5,
        serviceChargePercent: record?.billing?.serviceChargePercent ?? 0,
        invoicePrefix: record?.billing?.invoicePrefix ?? "INV",
        footerNote: record?.billing?.footerNote ?? "",
        pricesIncludeTax: record?.billing?.pricesIncludeTax ?? false,
        roundOffEnabled: record?.billing?.roundOffEnabled ?? true,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values) => {
    setSaving(true);
    setFieldErrors({});
    try {
      await api.put(`/hotels/${hotelId}`, {
        name: values.name,
        location: values.location,
        phone: values.phone || undefined,
        email: values.email || "",
        description: values.description,
        billing: {
          gstin: values.gstin || "",
          taxRatePercent: Number(values.taxRatePercent),
          serviceChargePercent: Number(values.serviceChargePercent),
          invoicePrefix: values.invoicePrefix,
          footerNote: values.footerNote,
          pricesIncludeTax: Boolean(values.pricesIncludeTax),
          roundOffEnabled: Boolean(values.roundOffEnabled),
        },
      });
      toast({ title: "Settings saved", variant: "success" });
      load();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      toast({
        title: "Couldn't save",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState description={error} onRetry={load} />;

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="shimmer h-56 rounded-xl" />
        ))}
      </div>
    );
  }

  const tax = Number(watch("taxRatePercent")) || 0;
  const service = Number(watch("serviceChargePercent")) || 0;
  const inclusive = watch("pricesIncludeTax");

  // A worked example on a round number, because "5% GST, prices exclude tax"
  // is much harder to reason about than seeing what ₹1,000 becomes.
  const sample = 1000;
  const serviceAmount = (sample * service) / 100;
  const taxAmount = inclusive ? 0 : (sample * tax) / 100;
  const sampleTotal = sample + taxAmount + serviceAmount;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your restaurant's details and how bills are calculated.
        </p>
      </div>

      <Section
        title="Restaurant"
        description="Shown on the QR menu and printed on every bill."
        Icon={Store}
      >
        <Field label="Name" error={fieldErrors.name}>
          <Input {...register("name")} placeholder="Spice Garden" />
        </Field>
        <Field label="Phone" error={fieldErrors.phone}>
          <Input {...register("phone")} placeholder="+91 22 2640 1234" />
        </Field>
        <Field label="Address" className="sm:col-span-2" error={fieldErrors.location}>
          <Input {...register("location")} placeholder="12 Linking Road, Mumbai" />
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <Input type="email" {...register("email")} placeholder="hello@restaurant.com" />
        </Field>
        <Field
          label="Description"
          className="sm:col-span-2"
          hint="A line or two for the top of the QR menu."
        >
          <Textarea rows={2} {...register("description")} />
        </Field>
      </Section>

      <Section
        title="Tax & charges"
        description="Applied to every bill as it's generated."
        Icon={Percent}
      >
        <Field
          label="GSTIN"
          hint="Printed on the invoice. Leave blank if not registered."
          error={fieldErrors["billing.gstin"]}
        >
          <Input {...register("gstin")} placeholder="27AABCS1429B1ZX" className="font-mono" />
        </Field>

        <Field label="GST rate" hint="Split evenly into CGST and SGST.">
          <div className="relative">
            <Input
              type="number"
              step="0.5"
              min="0"
              max="100"
              className="pr-8 tabular"
              {...register("taxRatePercent")}
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              %
            </span>
          </div>
        </Field>

        <Field label="Service charge" hint="Set to 0 if you don't levy one.">
          <div className="relative">
            <Input
              type="number"
              step="0.5"
              min="0"
              max="100"
              className="pr-8 tabular"
              {...register("serviceChargePercent")}
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              %
            </span>
          </div>
        </Field>

        <div className="space-y-3 sm:col-span-2">
          <label className="flex items-start gap-3 rounded-lg border p-3">
            <Switch
              checked={Boolean(watch("pricesIncludeTax"))}
              onCheckedChange={(v) => setValue("pricesIncludeTax", v)}
            />
            <span className="text-sm">
              <span className="font-medium">Menu prices already include tax</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                On, tax is extracted from the price shown. Off, it's added on top.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-lg border p-3">
            <Switch
              checked={Boolean(watch("roundOffEnabled"))}
              onCheckedChange={(v) => setValue("roundOffEnabled", v)}
            />
            <span className="text-sm">
              <span className="font-medium">Round the payable amount</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Rounds the total to the nearest rupee and shows the adjustment.
              </span>
            </span>
          </label>
        </div>

        {/* The settings are abstract; the arithmetic is not. */}
        <div className="rounded-lg border bg-muted/40 p-3 text-sm sm:col-span-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            On a {formatMoney(sample)} order
          </p>
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Items</dt>
              <dd className="tabular">{formatMoney(sample)}</dd>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">GST at {tax}%</dt>
                <dd className="tabular">{formatMoney(taxAmount)}</dd>
              </div>
            )}
            {serviceAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Service at {service}%</dt>
                <dd className="tabular">{formatMoney(serviceAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-semibold">
              <dt>Guest pays</dt>
              <dd className="tabular">{formatMoney(Math.round(sampleTotal))}</dd>
            </div>
          </dl>
        </div>
      </Section>

      <Section
        title="Invoices"
        description="How receipts are numbered and signed off."
        Icon={ReceiptText}
      >
        <Field
          label="Invoice prefix"
          hint={`Numbers look like ${watch("invoicePrefix") || "INV"}/2026-27/0001`}
        >
          <Input {...register("invoicePrefix")} maxLength={8} className="font-mono" />
        </Field>
        <Field label="Next number" hint="Assigned when a bill is settled.">
          <Input
            disabled
            className="tabular"
            value={(hotel?.billing?.invoiceCounter ?? 0) + 1}
          />
        </Field>
        <Field label="Footer note" className="sm:col-span-2" hint="Printed at the bottom of every bill.">
          <Input {...register("footerNote")} placeholder="Thank you for dining with us!" />
        </Field>
      </Section>

      {/* Sticky so the button is reachable without scrolling a long form. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 backdrop-blur lg:pl-64">
        <div className="mx-auto flex max-w-7xl justify-end gap-2 px-1 sm:px-3">
          <Button type="button" variant="outline" onClick={load} disabled={saving}>
            Discard
          </Button>
          <Button type="submit" disabled={saving} className="gap-1.5">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
