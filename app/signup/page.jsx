"use client";

import { useState } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChefHat, Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import OtpVerification from "@/components/auth/OtpVerification";
import { signup } from "@/redux/actions/auth/authAction";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/** Mirrors the API's policy exactly, so the form never accepts what the server will reject. */
const RULES = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /\d/.test(v) },
];

const formSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name"),
    email: z.string().min(1, "Enter your email").email("That's not a valid email"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .refine((v) => /[a-z]/.test(v), "Include a lowercase letter")
      .refine((v) => /[A-Z]/.test(v), "Include an uppercase letter")
      .refine((v) => /\d/.test(v), "Include a number"),
    confirmPassword: z.string(),
    devKey: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Those passwords don't match",
    path: ["confirmPassword"],
  });

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [isAdminSignup, setIsAdminSignup] = useState(false);

  const dispatch = useDispatch();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      devKey: "",
    },
  });

  const password = form.watch("password") ?? "";

  const onSubmit = async (values) => {
    setLoading(true);
    const result = await dispatch(
      signup({
        name: values.name,
        email: values.email,
        password: values.password,
        role: isAdminSignup ? "superadmin" : "hotelowner",
        ...(isAdminSignup && values.devKey ? { devKey: values.devKey } : {}),
      })
    );
    setLoading(false);

    if (result.ok) {
      setPendingEmail(values.email);
    } else {
      toast({
        title: "Couldn't create your account",
        description:
          form.formState.errors.root?.message ??
          "Check the details and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/15">
            <ChefHat className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight">QR-Dine</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-balance">
            Set up your restaurant in about five minutes.
          </h2>
          <p className="mt-4 text-primary-foreground/75 text-pretty">
            Add your menu, print the table QR codes, and start taking orders.
            Your first two weeks are on us.
          </p>
        </div>

        <ul className="space-y-2.5 text-sm text-primary-foreground/80">
          {[
            "Unlimited tables and menu items",
            "GST-ready invoices out of the box",
            "Live kitchen board on any tablet",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </aside>

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

          {pendingEmail ? (
            <OtpVerification
              email={pendingEmail}
              onBack={() => setPendingEmail(null)}
            />
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                No card needed to get started.
              </p>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-7 space-y-4"
                  noValidate
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your name</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="name"
                            placeholder="Priya Sharma"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="••••••••"
                              className="pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
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

                        {/* Live requirements beat a rejection after submit. */}
                        {password.length > 0 && (
                          <ul className="mt-2 grid grid-cols-2 gap-1">
                            {RULES.map((rule) => {
                              const met = rule.test(password);
                              return (
                                <li
                                  key={rule.id}
                                  className={cn(
                                    "flex items-center gap-1.5 text-xs",
                                    met
                                      ? "text-success"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {met ? (
                                    <Check
                                      className="h-3 w-3 shrink-0"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <X
                                      className="h-3 w-3 shrink-0"
                                      aria-hidden="true"
                                    />
                                  )}
                                  {rule.label}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isAdminSignup && (
                    <FormField
                      control={form.control}
                      name="devKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Administrator key</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Paste your single-use key"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Issued by an existing administrator.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && (
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    {loading ? "Creating…" : "Create account"}
                  </Button>
                </form>
              </Form>

              <button
                type="button"
                onClick={() => setIsAdminSignup((value) => !value)}
                className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                {isAdminSignup
                  ? "Sign up as a restaurant instead"
                  : "I have an administrator key"}
              </button>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
