// actions/dashboardActions.js
import axiosInstance from "@/utils/axiosInstance";
import { dashboardActions } from "@/redux/slices/dashboardSlice";
import { getActionErrorMessage } from "@/utils";

// Action to get dashboard
export const getDashboard = () => async (dispatch) => {
  console.log("🎯 getDashboard action - STARTING");
  try {
    dispatch(dashboardActions.getDashboardRequest());
    console.log("📝 getDashboard - Request dispatched");

    // Use axiosInstance so Authorization header (Bearer <token>) is added automatically.
    console.log("🌐 getDashboard - Calling API at: /api/v1/dashboard");
    const response = await axiosInstance.get("/api/v1/dashboard");
    console.log("✅ getDashboard - Response received:", response.data);

    const { status, message, data } = response.data;
    console.log("✅ getDashboard - Response status:", status);

    if (status === "success") {
      console.log("✅ getDashboard - SUCCESS - Dispatching success action");
      dispatch(dashboardActions.getDashboardSuccess(data));
    } else {
      console.log("❌ getDashboard - FAILED - Message:", message);
      dispatch(dashboardActions.getDashboardFailure(message));
    }
  } catch (error) {
    console.log("❌ getDashboard - ERROR:", error);
    console.log("❌ getDashboard - Error response:", error.response?.data);
    console.log("❌ getDashboard - Error status:", error.response?.status);
    const errorMessage = getActionErrorMessage(error);
    dispatch(dashboardActions.getDashboardFailure(errorMessage));
  }
};
