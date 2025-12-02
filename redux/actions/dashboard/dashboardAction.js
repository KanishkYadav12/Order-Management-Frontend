// actions/dashboardActions.js
import axiosInstance from "@/utils/axiosInstance";
import { dashboardActions } from "@/redux/slices/dashboardSlice";
import { getActionErrorMessage } from "@/utils";

// Action to get dashboard
export const getDashboard = () => async (dispatch) => {
  console.log("action-get-dashboard-req:");
  try {
    dispatch(dashboardActions.getDashboardRequest());

    // Use axiosInstance so Authorization header (Bearer <token>) is added automatically.
    const response = await axiosInstance.get("/api/v1/dashboard");

    const { status, message, data } = response.data;
    console.log("action-get-dashboard-res:", data);
    if (status === "success") {
      dispatch(dashboardActions.getDashboardSuccess(data));
    } else {
      dispatch(dashboardActions.getDashboardFailure(message));
    }
  } catch (error) {
    console.log("action-get-dashboard-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(dashboardActions.getDashboardFailure(errorMessage));
  }
};
