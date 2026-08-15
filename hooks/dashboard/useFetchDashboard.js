import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDashboard } from "@/redux/actions/dashboard";

/**
 * Loads dashboard analytics.
 *
 * The previous version cleared the request status on success, which reset it
 * to `null` — so `loading` could never settle correctly and the seven console
 * statements it printed on every render were the only way to tell what was
 * happening.
 */
export const useFetchDashboard = (range = {}) => {
  const dispatch = useDispatch();
  const { status, error, data } = useSelector(
    (state) => state.dashboard.getDashboard
  );

  const { from, to } = range;

  const refetch = useCallback(() => {
    dispatch(getDashboard({ from, to }));
  }, [dispatch, from, to]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    error,
    // `null` means "not started yet", which is still a loading state to the UI.
    loading: status === "pending" || status === null,
    refetch,
  };
};

export default useFetchDashboard;
