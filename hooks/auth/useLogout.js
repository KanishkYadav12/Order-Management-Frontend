import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { authActions } from "@/redux/slices/authSlice";
import { logout } from "@/redux/actions/auth";
import { useToast } from "@/hooks/use-toast";

export const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const { status: logoutStatus, error: logoutError } = useSelector(
    (state) => state.auth.logout
  );
  const { toast } = useToast();

  useEffect(() => {
    if (logoutStatus === "pending") {
      setLoading(true);
    } else if (logoutStatus === "success") {
      setLoading(false);

      // NOTE:
      // Your logout action already does a full-page redirect:
      // window.location.href = '/'
      // So we do NOT call router.push here to avoid duplicate navigation.
      toast({
        title: "Success",
        description: "Logged out successfully.",
        variant: "success",
      });

      // Clear the logout status so the hook can be reused later
      dispatch(authActions.clearLogoutStatus());
    } else if (logoutStatus === "failed") {
      setLoading(false);
      toast({
        title: "Error",
        description: logoutError || "Failed to logout.",
        variant: "destructive",
      });
      dispatch(authActions.clearLogoutStatus());
    }
  }, [logoutStatus, logoutError, dispatch, router, toast]);

  const handleLogout = () => {
    dispatch(logout());
  };

  return { loading, handleLogout };
};
