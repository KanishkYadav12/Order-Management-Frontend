import api, { getErrorMessage } from "@/lib/api";
import { dashboardActions } from "@/redux/slices/dashboardSlice";

export const getDashboard =
  ({ from, to } = {}) =>
  async (dispatch) => {
    try {
      dispatch(dashboardActions.getDashboardRequest());

      const { data } = await api.get("/dashboard", {
        params: {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      });

      dispatch(dashboardActions.getDashboardSuccess(data?.data));
      return { ok: true, data: data?.data };
    } catch (error) {
      dispatch(dashboardActions.getDashboardFailure(getErrorMessage(error)));
      return { ok: false };
    }
  };

export default getDashboard;
