import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authActions } from "@/redux/slices/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  // Read from redux
  const { currentUser, isAuthenticated: reduxIsAuthenticated, token: reduxToken } =
    useSelector((state) => state.auth.authDetails || {});

  // safe localStorage read (fallback for reloads)
  const getLocalToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    const token = reduxToken || getLocalToken();

    if (!token) {
      // Clear current user in redux and redirect to login if not already there
      dispatch(authActions.clearCurrentUser());
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        router.push("/login");
      }
    }
    // We intentionally only depend on reduxToken here so effect runs when token changes in redux.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, router, reduxToken]);

  return {
    user: currentUser,
    // isAuthenticated true if redux says so OR localStorage has token (covers reload edge)
    isAuthenticated: !!reduxIsAuthenticated || !!getLocalToken(),
  };
};
