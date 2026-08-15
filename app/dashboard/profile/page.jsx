"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import {
  Camera,
  Loader2,
  Save,
  ShieldCheck,
  KeyRound,
  Store,
  ArrowRight,
  CalendarClock,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/ui/empty-state";
import api, { getErrorMessage, getFieldErrors } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { authActions } from "@/redux/slices/authSlice";
import { changePassword } from "@/redux/actions/auth/authAction";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/config/config";
import { cn } from "@/lib/utils";

/**
 * Personal profile.
 *
 * Only the person, not the restaurant. The old page carried a second "Hotel
 * Profile" tab that edited the restaurant's name, address and logo — the same
 * fields the Settings page now owns, so the two could disagree and there was
 * no way to tell which had won. Restaurant details live in one place; this
 * page links to them.
 */

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

function Card({ title, description, Icon, children, footer }) {
  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-start gap-3 border-b p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </header>
      <div className="p-4">{children}</div>
      {footer && <div className="border-t px-4 py-3">{footer}</div>}
    </section>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div>
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

function PasswordCard() {
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);
  const { register, handleSubmit, reset, watch, formState } = useForm();

  const next = watch("newPassword") ?? "";
  const rules = [
    { label: "8+ characters", ok: next.length >= 8 },
    { label: "lowercase", ok: /[a-z]/.test(next) },
    { label: "uppercase", ok: /[A-Z]/.test(next) },
    { label: "a number", ok: /\d/.test(next) },
  ];

  const onSubmit = async (values) => {
    if (values.newPassword !== values.confirm) {
      toast({ title: "Those passwords don't match", variant: "destructive" });
      return;
    }
    setSaving(true);
    const result = await dispatch(
      changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
    );
    setSaving(false);

    if (result.ok) {
      reset();
      toast({
        title: "Password changed",
        description: "You've been signed out everywhere else.",
        variant: "success",
      });
    }
  };

  return (
    <Card
      title="Password"
      description="Changing it signs you out on every other device."
      Icon={KeyRound}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Current password">
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="pr-10"
              {...register("currentPassword", { required: true })}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide passwords" : "Show passwords"}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {show ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password">
            <Input
              type={show ? "text" : "password"}
              autoComplete="new-password"
              {...register("newPassword", { required: true })}
            />
          </Field>
          <Field label="Confirm new password">
            <Input
              type={show ? "text" : "password"}
              autoComplete="new-password"
              {...register("confirm", { required: true })}
            />
          </Field>
        </div>

        {next.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {rules.map((rule) => (
              <li
                key={rule.label}
                className={cn(
                  "text-xs",
                  rule.ok ? "font-medium text-success" : "text-muted-foreground"
                )}
              >
                {rule.ok ? "✓" : "○"} {rule.label}
              </li>
            ))}
          </ul>
        )}

        <Button type="submit" disabled={saving || !formState.isDirty} className="gap-1.5">
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {saving ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, role, isSuperAdmin } = useAuth();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [avatar, setAvatar] = useState(null);
  const fileRef = useRef(null);

  const { register, handleSubmit, reset, watch, setValue, formState } = useForm();

  useEffect(() => {
    if (!user) return;
    setAvatar(user.logo ?? null);
    reset({
      name: user.name ?? "",
      phone: user.phone ?? "",
      gender: user.gender ?? "M",
    });
  }, [user, reset]);

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-32 rounded-xl" />
        <div className="shimmer h-64 rounded-xl" />
      </div>
    );
  }

  const pickAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "That image is too large",
        description: "Pick one under 5 MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("logo", file);
      form.append("folderName", "profile");
      form.append("fileName", user._id ?? "avatar");

      const { data } = await api.post("/uploads", form);
      setAvatar(data?.data?.url ?? null);
      setValue("logoChanged", true, { shouldDirty: true });
      toast({ title: "Photo uploaded", description: "Save to apply it.", variant: "success" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onSubmit = async (values) => {
    setSaving(true);
    setFieldErrors({});
    try {
      const { data } = await api.patch(`/users/owner/${user._id}`, {
        name: values.name,
        phone: values.phone || undefined,
        gender: values.gender,
        ...(avatar ? { logo: avatar } : {}),
      });

      // Keep the cached profile in step so the header updates immediately
      // rather than after the next full reload.
      dispatch(
        authActions.updateUser({ ...user, ...(data?.data?.owner ?? {}), logo: avatar })
      );
      toast({ title: "Profile saved", variant: "success" });
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

  const expiry = user.membershipExpires ? new Date(user.membershipExpires) : null;
  const daysLeft = expiry
    ? Math.ceil((expiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;
  const expiringSoon = daysLeft != null && daysLeft <= 14;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your personal details and sign-in.
        </p>
      </div>

      {/* Identity */}
      <section className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
        <div className="relative">
          {avatar ? (
            // A plain <img>: avatars are arbitrary remote URLs, which
            // next/image would need each host allow-listed for.
            <img
              src={avatar}
              alt=""
              className="h-16 w-16 rounded-full border object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {initials(user.name)}
            </span>
          )}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <Camera className="h-3 w-3" aria-hidden="true" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pickAvatar}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold tracking-tight">{user.name}</h2>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-semibold text-primary">
              {ROLE_LABELS[role] ?? role}
            </span>
            {user.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-2xs font-semibold text-success">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Verified
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Subscription — owners only; the platform admin has no membership */}
      {!isSuperAdmin && expiry && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border p-3.5",
            expiringSoon
              ? "border-warning/30 bg-warning/10"
              : "border-border bg-card"
          )}
        >
          {expiringSoon ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          ) : (
            <CalendarClock
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-semibold">
              {daysLeft > 0
                ? `Subscription active — ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
                : "Subscription expired"}
            </span>
            <span className="text-muted-foreground"> · renews {formatDate(expiry)}</span>
          </p>
        </div>
      )}

      {/* Editable details */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          title="Details"
          description="How your name appears across the app."
          Icon={ShieldCheck}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  reset({
                    name: user.name ?? "",
                    phone: user.phone ?? "",
                    gender: user.gender ?? "M",
                  })
                }
                disabled={saving}
              >
                Discard
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={fieldErrors.name}>
              <Input {...register("name")} />
            </Field>

            <Field label="Phone" error={fieldErrors.phone}>
              <Input {...register("phone")} placeholder="+91 98765 43210" />
            </Field>

            <Field
              label="Email"
              hint="Contact support to change the address you sign in with."
            >
              <Input value={user.email} disabled />
            </Field>

            <Field label="Gender">
              <Select
                value={watch("gender") ?? "M"}
                onValueChange={(value) =>
                  setValue("gender", value, { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="O">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Card>
      </form>

      <PasswordCard />

      {/* Restaurant details live in Settings, not here */}
      {!isSuperAdmin && (
        <Link
          href="/dashboard/configuration"
          className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Store className="h-4 w-4 text-primary" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Restaurant settings</p>
            <p className="text-xs text-muted-foreground">
              Name, address, GST rate, service charge and invoice numbering.
            </p>
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
}
