import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDashboard } from "@/redux/actions/dashboard";
import { dashboardActions } from "@/redux/slices/dashboardSlice";

export const useFetchDashboard = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const { status, error, data } = useSelector(
    (state) => state.dashboard.getDashboard
  );

  console.log("📊 useFetchDashboard - Current status:", status);
  console.log("📊 useFetchDashboard - Current data:", data);
  console.log("📊 useFetchDashboard - Current error:", error);

  // Fetch dashboard data on mount
  useEffect(() => {
    console.log("📊 useFetchDashboard - Mounting, calling getDashboard");
    dispatch(getDashboard());
  }, [dispatch]);

  // Handle status changes
  useEffect(() => {
    console.log("📊 useFetchDashboard - Status changed to:", status);
    if (status === "pending") {
      setLoading(true);
    } else if (status === "success") {
      setLoading(false);
      console.log("✅ Dashboard data loaded successfully");
      dispatch(dashboardActions.clearDashboardStats());
    } else if (status === "failed") {
      setLoading(false);
      console.log("❌ Dashboard data failed:", error);
      dispatch(dashboardActions.clearDashboardStats());
    }
  }, [status, dispatch, error]);

  return { data, loading, error };
};
