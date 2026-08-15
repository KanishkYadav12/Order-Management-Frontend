import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/redux/actions/auth/authAction";
import { useToast } from "@/hooks/use-toast";
import { ROLES } from "@/config/config";

/**
 * Drives the sign-in form.
 *
 * The old version ran its navigation from a `useEffect` watching redux
 * status, which fired on every status change and could redirect twice. The
 * thunk resolves with the outcome, so the flow is handled inline where it
 * happens.
 */
export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  /** Set when the account exists but the email was never confirmed. */
  const [needsVerification, setNeedsVerification] = useState(null);

  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleLogin = async (values) => {
    setLoading(true);
    setNeedsVerification(null);

    const result = await dispatch(login(values));
    setLoading(false);

    if (result.ok) {
      toast({ title: "Welcome back", description: "Signing you in…" });

      // Honour the page the guard bounced them from, when there was one.
      const next = searchParams.get("next");
      const destination =
        next && next.startsWith("/")
          ? next
          : result.user?.role === ROLES.SUPER_ADMIN
            ? "/admin-dashboard"
            : "/dashboard";

      router.replace(destination);
      return true;
    }

    // An unverified account is a recoverable state, not a failure — route
    // the user to the OTP screen instead of showing a dead end.
    if (result.code === "EMAIL_NOT_VERIFIED") {
      setNeedsVerification(result.email ?? values.email);
      toast({
        title: "Confirm your email",
        description: "Enter the code we sent you to finish signing in.",
      });
      return false;
    }

    return false;
  };

  return { loading, handleLogin, needsVerification, setNeedsVerification };
};

export default useLogin;
