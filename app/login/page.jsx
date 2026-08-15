"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { ChefHat, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/auth/useLogin";
import { useAuth } from "@/hooks/auth/useAuth";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import OtpVerification from "@/components/auth/OtpVerification";

const formSchema = z.object({
  email: z.string().min(1, "Enter your email").email("That's not a valid email"),
  password: z.string().min(1, "Enter your password"),
});

function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { loading, handleLogin, needsVerification, setNeedsVerification } =
    useLogin();
  const { isAuthenticated, loading: restoring } = useAuth();

  // An already-signed-in visitor should never see the form.
  useEffect(() => {
    if (!restoring && isAuthenticated) router.replace("/dashboard");
  }, [restoring, isAuthenticated, router]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  /**
   * The account type dropdown is gone. The email identifies the account, and
   * asking people to pick "Super Admin" or "Hotel Owner" before signing in
   * meant choosing wrong looked exactly like a wrong password.
   */
  if (needsVerification) {
    return (
      <OtpVerification
        email={needsVerification}
        onBack={() => setNeedsVerification(null)}
      />
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleLogin)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@restaurant.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-baseline justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel — desktop only, so it never crowds a phone. */}
      <aside className="relative hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/15">
            <ChefHat className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight">QR-Dine</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-balance">
            Every table, every order, every rupee — on one screen.
          </h2>
          <p className="mt-4 text-primary-foreground/75 text-pretty">
            Contactless ordering straight from the table, a live kitchen board,
            and GST-ready billing that reconciles itself.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-6">
          {[
            ["Live", "kitchen board"],
            ["GST", "ready invoices"],
            ["QR", "table ordering"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="text-xl font-bold tracking-tight">{value}</dt>
              <dd className="mt-0.5 text-xs text-primary-foreground/65">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </aside>

      {/* Form panel */}
      <main className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <ChefHat
                  className="h-4 w-4 text-primary-foreground"
                  aria-hidden="true"
                />
              </span>
              <span className="text-lg font-bold tracking-tight">QR-Dine</span>
            </div>
            <ThemeToggle className="ml-auto" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your restaurant dashboard.
          </p>

          <div className="mt-7">
            {/* useSearchParams reads the `next` redirect target, so the form
                needs a boundary for static prerendering. */}
            <Suspense
              fallback={
                <div className="flex justify-center py-10">
                  <Loader2
                    className="h-5 w-5 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-7 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
