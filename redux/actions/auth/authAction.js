import { serverUrl } from "@/config/config";
import { authActions } from "@/redux/slices/authSlice";
import { getActionErrorMessage } from "@/utils";
import axios from "axios";
import axiosInstance from "@/utils/axiosInstance"; // 🔹 NEW

const route = `${process.env.NEXT_PUBLIC_SERVER_URL}/auth`;

export const login = (loginData) => async (dispatch) => {
  try {
    dispatch(authActions.loginRequest());
    console.log("Login request to:", `${route}/login`);

    const response = await axios.post(`${route}/login`, loginData, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // ✅ Allows backend to set cookie via Set-Cookie header
    });

    const { status, message, data } = response.data;
    console.log("Login response:", response.data);

    if (status === "success" && data) {
      // ✅ Backend has already set the 'token' cookie via Set-Cookie header
      // No need to manually create cookies here

      dispatch(
        authActions.loginSuccess({
          id: data.id,
          name: data.name,
          role: data.role,
          email: data.email,
        })
      );

      return true; // ✅ Return true on success
    } else {
      dispatch(authActions.loginFailure(message || "Login failed"));
      return false; // ✅ Return false if status is not success
    }
  } catch (error) {
    console.log("Login error:", error.response?.data || error.message);
    const errorMessage = getActionErrorMessage(error);
    dispatch(authActions.loginFailure(errorMessage));
    return false; // ✅ Return false on error
  }
};

export const verifyEmail = (verifyEmailData) => async (dispatch) => {
  console.log("action-verifyOtp-req : ", verifyEmailData);
  try {
    dispatch(authActions.verifyOTPRequest());
    const response = await axios.post(`${route}/verify`, verifyEmailData, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    const { status, message, data } = response.data;
    console.log("action-verifyOtp-res : ", data);
    if (status == "success") {
      dispatch(authActions.verifyOTPSuccess(data));
    } else {
      dispatch(authActions.verifyOTPFailure(message));
    }
  } catch (error) {
    console.log("action-verifyOtp-error", error);
    let errorMessage = getActionErrorMessage(error);
    dispatch(authActions.verifyOTPFailure(errorMessage));
  }
};

export const resendOtp = (resendOtpData) => async (dispatch) => {
  console.log("action-resendOtp-req : ", resendOtpData);
  try {
    dispatch(authActions.verifyOTPRequest());
    const response = await axios.post(
      `${route}/resend-otp`,
      { email: resendOtpData },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    const { status, message, data } = response.data;
    console.log("action-resendOtp-res : ", data);
    if (status == "success") {
      dispatch(authActions.verifyOTPSuccess(data));
    } else {
      dispatch(authActions.verifyOTPFailure(message));
    }
  } catch (error) {
    console.log("action-resendOtp-error", error);
    let errorMessage = getActionErrorMessage(error);
    dispatch(authActions.verifyOTPFailure(errorMessage));
  }
};

export const signup = (signupData) => async (dispatch) => {
  try {
    dispatch(authActions.signupRequest());
    const response = await axios.post(`${route}/signup`, signupData, {
      headers: {
        "Content-Type": "application/json",
      },
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

export const logout = () => async (dispatch) => {
  try {
    dispatch(authActions.logoutRequest());

    // Call backend logout to clear cookie server-side
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Backend logout failed:", error);
      // Continue with frontend cleanup even if backend fails
    }

    // Clear auth token cookie client-side
    document.cookie =
      "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure";

    // Clear local storage
    localStorage.clear();

    // Clear Redux state
    dispatch(authActions.clearAuthState());

    // Dispatch logout success
    dispatch(authActions.logoutSuccess());

    // Redirect to home page
    window.location.href = "/";

    return true;
  } catch (error) {
    console.error("Logout error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(authActions.logoutFailure(errorMessage));
    return false;
  }
};

export const forgotPassword = (forgotPasswordData) => async (dispatch) => {
  try {
    console.log("action-forgotPassword-req : ", forgotPasswordData);
    dispatch(authActions.forgotPasswordRequest());

    const response = await axios.post(
      `${route}/send-reset-password-email`,
      forgotPasswordData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("action-forgot-password-res", response);
    dispatch(authActions.forgotPasswordSuccess(response));
  } catch (error) {
    console.log("action-forget-password-error", error.response?.data?.message);
    let errorMessage = getActionErrorMessage(error);
    dispatch(authActions.forgotPasswordFailure(errorMessage));
  }
};

export const resetPasswordWithOTP = (otpData) => async (dispatch) => {
  try {
    console.log("action-verifyOTPData-req", otpData);
    dispatch(authActions.verifyOTPRequest());

    const { data } = await axios.post(
      `${route}/reset-password-with-otp`,
      otpData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("action-forgot-password-res", data);
    dispatch(authActions.verifyOTPSuccess(data));
  } catch (error) {
    console.log(
      "action-resetPasswordWIthOtp-error",
      error.response?.data?.message
    );
    let errorMessage = getActionErrorMessage(error);
    dispatch(authActions.verifyOTPFailure(errorMessage));
  }
};

export const changePassword = (data) => async (dispatch) => {
  try {
    console.log("action-change-password-data", data);
    dispatch(authActions.changePasswordRequest());

    // 🔹 Use axiosInstance so Authorization header is auto-added
    const response = await axiosInstance.post("/auth/change-password", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    dispatch(authActions.changePasswordSuccess(response.data));
  } catch (error) {
    console.log("error", error);
    let errorMessage = getActionErrorMessage(error);
    dispatch(authActions.changePasswordSuccess(errorMessage));
  }
};

export const getUser = () => async (dispatch) => {
  try {
    console.log("getUser req");
    dispatch(authActions.getUserRequest());

    // 🔹 Use axiosInstance so Authorization header is auto-added
    const response = await axiosInstance.get("/users/profile");

    const { status, message, data: responseData } = response.data;
    console.log("action-get-user-res:", responseData);
    dispatch(authActions.getUserSuccess(responseData));
  } catch (error) {
    console.log("error", error);
    let errorMessage = getActionErrorMessage(error);
    dispatch(authActions.getUserFailure(errorMessage));
  }
};
