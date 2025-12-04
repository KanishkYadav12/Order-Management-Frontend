import { serverUrl } from "@/config/config";
import { authActions } from "@/redux/slices/authSlice";
import { getActionErrorMessage } from "@/utils";
import axios from "axios";
import api from "@/lib/api";
import { store } from "@/redux/store";

const route = `${process.env.NEXT_PUBLIC_SERVER_URL}/auth`;

export const verifyEmail = (verifyEmailData) => async (dispatch) => {
  console.log("action-verifyOtp-req : ", verifyEmailData);
  try {
    dispatch(authActions.verifyOTPRequest());

    const response = await api.post(`${route}/verify`, verifyEmailData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-verifyOtp-res : ", data);

    if (status === "success") {
      dispatch(authActions.verifyOTPSuccess(data));
    } else {
      dispatch(authActions.verifyOTPFailure(message));
    }
  } catch (error) {
    console.log("action-verifyOtp-error", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(authActions.verifyOTPFailure(errorMessage));
  }
};

// --- resendOtp ---
export const resendOtp = (resendOtpData) => async (dispatch) => {
  console.log("action-resendOtp-req : ", resendOtpData);
  try {
    dispatch(authActions.verifyOTPRequest());

    const response = await api.post(
      `${route}/resend-otp`,
      { email: resendOtpData },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    const { status, message, data } = response.data;
    console.log("action-resendOtp-res : ", data);

    if (status === "success") {
      dispatch(authActions.verifyOTPSuccess(data));
    } else {
      dispatch(authActions.verifyOTPFailure(message));
    }
  } catch (error) {
    console.log("action-resendOtp-error", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(authActions.verifyOTPFailure(errorMessage));
  }
};

// --- signup ---
export const signup = (signupData) => async (dispatch) => {
  try {
    dispatch(authActions.signupRequest());

    const response = await api.post(`${route}/signup`, signupData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;

    if (status === "success") {
      dispatch(authActions.signupSuccess(data));
      return true;
    } else {
      dispatch(authActions.signupFailure(message));
      return false;
    }
  } catch (error) {
    const errorMessage = getActionErrorMessage(error);
    dispatch(authActions.signupFailure(errorMessage));
    return false;
  }
};

// --- forgotPassword ---
export const forgotPassword = (forgotPasswordData) => async (dispatch) => {
  try {
    console.log("action-forgotPassword-req : ", forgotPasswordData);
    dispatch(authActions.forgotPasswordRequest());

    const response = await api.post(
      `${route}/send-reset-password-email`,
      forgotPasswordData,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("action-forgot-password-res", response.data);
    // dispatch success with response data (keeps it consistent with other actions)
    dispatch(authActions.forgotPasswordSuccess(response.data));
  } catch (error) {
    // safe-guard: error.response may be undefined
    console.log(
      "action-forget-password-error",
      error?.response?.data?.message ?? error.message
    );
    const errorMessage = getActionErrorMessage(error);
    dispatch(authActions.forgotPasswordFailure(errorMessage));
  }
};

// --- resetPasswordWithOTP ---
export const resetPasswordWithOTP = (otpData) => async (dispatch) => {
  try {
    console.log("action-verifyOTPData-req", otpData);
    dispatch(authActions.verifyOTPRequest());

    const response = await api.post(
      `${route}/reset-password-with-otp`,
      otpData,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const { data } = response;
    console.log("action-forgot-password-res", data);
    dispatch(authActions.verifyOTPSuccess(data));
  } catch (error) {
    console.log(
      "action-resetPasswordWIthOtp-error",
      error?.response?.data?.message ?? error.message
    );
    const errorMessage = getActionErrorMessage(error);
    dispatch(authActions.verifyOTPFailure(errorMessage));
  }
};

// --- changePassword ---
export const changePassword = (data) => async (dispatch) => {
  try {
    console.log("action-change-password-data", data);
    dispatch(authActions.changePasswordRequest());

    const response = await api.post(`${route}/change-password`, data, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    // Use response data or original payload depending on your reducer expectations.
    // I dispatch success with response.data to be consistent with other actions.
    dispatch(authActions.changePasswordSuccess(response.data));
  } catch (error) {
    console.log("action-change-password-error", error);
    const errorMessage = getActionErrorMessage(error);
    // fixed: dispatch failure on error
    dispatch(authActions.changePasswordFailure(errorMessage));
  }
};

export const getUser = () => async (dispatch) => {
  try {
    console.log(
      "getUser request to:",
      `${process.env.NEXT_PUBLIC_SERVER_URL}/users/profile`
    );
    dispatch(authActions.getUserRequest());

    const response = await api.get("/users/profile");

    const { status, message, data: responseData } = response.data;
    console.log("action-get-user-res:", responseData);
    dispatch(authActions.getUserSuccess(responseData));
  } catch (error) {
    console.log("getUser error:", error.response?.data || error.message);
    console.log("Full error:", error); // See full error details

    const errorMessage = getActionErrorMessage(error); // Use your existing helper
    dispatch(authActions.getUserFailure(errorMessage));
  }
};

export const login = (loginData) => async (dispatch) => {
  try {
    dispatch(authActions.loginRequest());
    console.log("🔐 ========== LOGIN ACTION ==========");
    console.log(
      "🔐 Login request to:",
      `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/login`
    );

    const response = await api.post("/auth/login", loginData, {
      headers: { "Content-Type": "application/json" },
    });

    const { status, message, data } = response.data;
    console.log("✅ Login response:", response.data);

    if (status === "success" && data) {
      const token = data.token ?? data.accessToken ?? null;

      console.log(
        "🔑 Token from backend:",
        token ? `${token.substring(0, 30)}...` : "❌ NO TOKEN"
      );

      if (typeof window !== "undefined" && token) {
        localStorage.setItem("accessToken", token);
        const savedToken = localStorage.getItem("accessToken");
        console.log(
          "💾 Token saved to localStorage:",
          savedToken ? "✅ YES" : "❌ NO"
        );
      }

      dispatch(
        authActions.loginSuccess({
          id: data.id,
          name: data.name,
          role: data.role,
          email: data.email,
          token,
        })
      );

      console.log("✅ loginSuccess dispatched with token");

      // Verify it's in Redux
      const state = store.getState();
      console.log(
        "📦 Token in Redux after dispatch:",
        state?.auth?.authDetails?.token ? "✅ YES" : "❌ NO"
      );
      console.log("🔐 ===================================");

      return true;
    } else {
      dispatch(authActions.loginFailure(message || "Login failed"));
      return false;
    }
  } catch (error) {
    console.log("❌ Login error:", error.response?.data || error.message);
    const errorMessage = getActionErrorMessage(error);
    dispatch(authActions.loginFailure(errorMessage));
    return false;
  }
};

export const logout = () => async (dispatch) => {
  try {
    dispatch(authActions.logoutRequest());
    // Clear local storage
    localStorage.clear();

    // Clear Redux state (optional, if you have a reset action)
    dispatch(authActions.clearAuthState()); // Replace with your actual Redux reset action if needed

    // Reload the page to ensure all states are cleared
    dispatch(authActions.logoutSuccess());
    window.location.href = "/";

    return true;
  } catch (error) {
    console.error("Logout error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(authActions.logoutFailure(errorMessage));
    return false;
  }
};
