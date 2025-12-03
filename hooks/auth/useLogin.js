import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { authActions } from "@/redux/slices/authSlice";
import { useToast } from "@/hooks/use-toast";
import { login } from "@/redux/actions/auth";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const { status, error, data } = useSelector(
    (state) => state.auth.authDetails
  );

  const { toast } = useToast();

  const handleLogin = async (loginData) => {
    const success = await dispatch(login(loginData));
    return success;
  };

  useEffect(() => {
    if (status === "pending") {
      setLoading(true);
    } else if (status === "success") {
      setLoading(false);
      if (data?.role === "superadmin") {
        router.push("/admin-dashboard");
      } else {
        router.push("/dashboard");
      }
    } else if (status === "failed") {
      setLoading(false);
      toast({
        title: "Error",
        description: error || "Failed to login",
        variant: "destructive",
      });
      dispatch(authActions.clearAuthDetailsStatus());
    }
  }, [status, error, data, dispatch, router, toast]);

  return { loading, handleLogin };
};
