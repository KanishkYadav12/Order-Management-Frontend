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

  // Fetch dashboard data on mount
  useEffect(() => {
    dispatch(getDashboard());
  }, [dispatch]);

  // Handle status changes
  useEffect(() => {
    if (status === "pending") {
      setLoading(true);
    } else if (status === "success") {
      setLoading(false);
      dispatch(dashboardActions.clearDashboardStats());
    } else if (status === "failed") {
      setLoading(false);
      dispatch(dashboardActions.clearDashboardStats());
    }
  }, [status, dispatch]);

  return { data, loading, error };
};
