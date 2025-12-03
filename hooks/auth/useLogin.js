import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { authActions } from "@/redux/slices/authSlice";
import { login } from "@/redux/actions/auth";
import { useToast } from "@/hooks/use-toast";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const { toast } = useToast();

  const { data, status, error } = useSelector(
    (state) => state.auth.authDetails
  );

  useEffect(() => {
    if (status === "pending") {
      setLoading(true);
    } else if (status === "success") {
      setLoading(false);
      toast({
        title: "Success",
        description: "Login successful! Redirecting...",
        variant: "success",
      });
      if (authActions.checkAuthSuccess) {
        dispatch(authActions.checkAuthSuccess(data));
      }
      if (data?.role === "superadmin") {
        router.push("/admin-dashboard");
      } else {
        router.push("/dashboard");
      }
      if (authActions.clearAuthDetailsStatus) {
        dispatch(authActions.clearAuthDetailsStatus());
      }
    } else if (status === "failed") {
      setLoading(false);
      toast({
        title: "Error",
        description: error || "Incorrect credentials!",
        variant: "destructive",
      });
      if (authActions.clearAuthDetailsStatus) {
        dispatch(authActions.clearAuthDetailsStatus());
      }
      if (authActions.clearAuthDetailsError) {
        dispatch(authActions.clearAuthDetailsError());
      }
    }
  }, [status, error, data, dispatch, router, toast]);

  const handleLogin = (values) => {
    dispatch(login(values));
  };

  return { loading, handleLogin };
};
