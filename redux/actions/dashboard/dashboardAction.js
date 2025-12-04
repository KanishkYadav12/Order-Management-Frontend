// redux/actions/dashboardActions.js (update import)
import api from "@/lib/api";
import { dashboardActions } from "@/redux/slices/dashboardSlice";
import { getActionErrorMessage } from "@/utils";

export const getDashboard = () => async (dispatch) => {
  console.log("action-get-dashboard-req:");
  try {
    dispatch(dashboardActions.getDashboardRequest());
    const response = await api.get("/dashboard", {
      headers: {
        "Content-Type": "application/json",
      },
      // withCredentials: true, // keep if you still use cookies; for Authorization header flow it's not needed
    });

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
