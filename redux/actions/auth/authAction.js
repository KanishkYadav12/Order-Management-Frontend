import api, {
  setAccessToken,
  clearAccessToken,
  getErrorMessage,
} from "@/lib/api";
import { authActions } from "@/redux/slices/authSlice";

/**
 * Auth thunks.
 *
 * Every request now goes through the shared client with a relative path, so
 * the Authorization header and the refresh interceptor always apply. Several
 * of these previously built absolute URLs, which bypassed the client's
 * baseURL — and with it the auth handling.
 *
 * The endpoints they call also exist now: `/auth/change-password`,
 * `/auth/send-reset-password-email` and `/auth/refresh` all 404'd before.
 */

export const login = (credentials) => async (dispatch) => {
  try {
    dispatch(authActions.loginRequest());

    const { data } = await api.post("/auth/login", credentials);
    const user = data?.data;

    if (!user?.token) {
      dispatch(authActions.loginFailure("Unexpected response from the server."));
      return { ok: false };
    }

    setAccessToken(user.token);
    dispatch(authActions.loginSuccess(user));
    return { ok: true, user };
  } catch (error) {
    const code = error?.response?.data?.code;
    dispatch(authActions.loginFailure(getErrorMessage(error)));
    // Surfaced so the login screen can route to OTP entry rather than just
    // showing an error the user can't act on.
    return { ok: false, code, email: credentials?.email };
  }
};

export const signup = (payload) => async (dispatch) => {
  try {
    dispatch(authActions.signupRequest());
    const { data } = await api.post("/auth/signup", payload);
    dispatch(authActions.signupSuccess(data?.data));
    return { ok: true, data: data?.data };
  } catch (error) {
    dispatch(authActions.signupFailure(getErrorMessage(error)));
    return { ok: false };
  }
};

export const verifyEmail = (payload) => async (dispatch) => {
  try {
    dispatch(authActions.verifyOTPRequest());
    const { data } = await api.post("/auth/verify", payload);
    dispatch(authActions.verifyOTPSuccess(data));
    return { ok: true };
  } catch (error) {
    dispatch(authActions.verifyOTPFailure(getErrorMessage(error)));
    return { ok: false };
  }
};

export const resendOtp = (email) => async (dispatch) => {
  try {
    dispatch(authActions.verifyOTPRequest());
    const { data } = await api.post("/auth/resend-otp", { email });
    dispatch(authActions.verifyOTPSuccess(data));
    return { ok: true };
  } catch (error) {
    dispatch(authActions.verifyOTPFailure(getErrorMessage(error)));
    return { ok: false };
  }
};

export const forgotPassword = (payload) => async (dispatch) => {
  try {
    dispatch(authActions.forgotPasswordRequest());
    const { data } = await api.post("/auth/forgot-password", payload);
    dispatch(authActions.forgotPasswordSuccess(data));
    return { ok: true };
  } catch (error) {
    dispatch(authActions.forgotPasswordFailure(getErrorMessage(error)));
    return { ok: false };
  }
};

export const resetPassword = ({ token, password }) => async (dispatch) => {
  try {
    dispatch(authActions.resetPasswordRequest());
    const { data } = await api.post(`/auth/reset-password/${token}`, {
      password,
    });
    dispatch(authActions.resetPasswordSuccess(data));
    return { ok: true };
  } catch (error) {
    dispatch(authActions.resetPasswordFailure(getErrorMessage(error)));
    return { ok: false };
  }
};

export const changePassword = (payload) => async (dispatch) => {
  try {
    dispatch(authActions.changePasswordRequest());
    const { data } = await api.post("/auth/change-password", payload);

    // Changing a password invalidates every session, so the server hands
    // back a fresh pair to keep the current tab signed in.
    const token = data?.data?.token;
    if (token) setAccessToken(token);

    dispatch(authActions.changePasswordSuccess(data));
    return { ok: true };
  } catch (error) {
    dispatch(authActions.changePasswordFailure(getErrorMessage(error)));
    return { ok: false };
  }
};

export const getUser = () => async (dispatch) => {
  try {
    dispatch(authActions.getUserRequest());
    const { data } = await api.get("/users/profile");
    dispatch(authActions.getUserSuccess(data?.data));
    return { ok: true, user: data?.data?.user };
  } catch (error) {
    dispatch(authActions.getUserFailure(getErrorMessage(error)));
    return { ok: false };
  }
};

/**
 * Restores a session on page load by exchanging the httpOnly refresh cookie
 * for a new access token. Failure is expected and silent — it just means the
 * visitor is signed out.
 */
export const restoreSession = () => async (dispatch) => {
  try {
    const { data } = await api.post("/auth/refresh");
    const user = data?.data;
    if (!user?.token) throw new Error("no token");

    setAccessToken(user.token);
    dispatch(authActions.sessionRestored(user));
    dispatch(getUser());
    return { ok: true };
  } catch {
    clearAccessToken();
    dispatch(authActions.bootstrapFinished());
    return { ok: false };
  }
};

export const logout =
  ({ allDevices = false } = {}) =>
  async (dispatch) => {
    dispatch(authActions.logoutRequest());
    try {
      // Best-effort: the server drops the refresh session, but the client
      // must end up signed out regardless of whether that call succeeds.
      await api.post("/auth/logout", { allDevices });
    } catch {
      // Intentionally ignored.
    } finally {
      clearAccessToken();
      dispatch(authActions.logoutSuccess());
    }
    return { ok: true };
  };
