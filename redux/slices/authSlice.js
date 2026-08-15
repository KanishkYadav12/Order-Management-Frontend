import { createSlice } from "@reduxjs/toolkit";

/**
 * Auth state.
 *
 * The shape is unchanged so existing screens keep reading the same paths.
 * What is new is that `forgotPassword` and `changePassword` finally have
 * reducers — the actions dispatched them anyway, which threw
 * `authActions.forgotPasswordRequest is not a function` and broke both
 * screens on submit.
 */

const requestState = () => ({ status: null, error: null, data: null });

const initialState = {
  authDetails: {
    status: null,
    error: null,
    data: null,
    currentUser: null,
    isAuthenticated: false,
    token: null,
  },
  signup: requestState(),
  verifyOTP: requestState(),
  forgotPassword: requestState(),
  resetPassword: requestState(),
  changePassword: requestState(),
  getUser: requestState(),
  logout: { status: null, error: null },
  /** True until the first session-restore attempt settles. */
  bootstrapping: true,
};

/** Generates the request/success/failure trio for a named slice section. */
const asyncReducers = (key) => ({
  [`${key}Request`]: (state) => {
    state[key].status = "pending";
    state[key].error = null;
  },
  [`${key}Success`]: (state, action) => {
    state[key].status = "success";
    state[key].data = action.payload;
    state[key].error = null;
  },
  [`${key}Failure`]: (state, action) => {
    state[key].status = "failed";
    state[key].error = action.payload;
  },
  [`clear${key[0].toUpperCase()}${key.slice(1)}Status`]: (state) => {
    state[key].status = null;
  },
  [`clear${key[0].toUpperCase()}${key.slice(1)}Error`]: (state) => {
    state[key].error = null;
  },
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    ...asyncReducers("signup"),
    ...asyncReducers("verifyOTP"),
    ...asyncReducers("forgotPassword"),
    ...asyncReducers("resetPassword"),
    ...asyncReducers("changePassword"),
    ...asyncReducers("getUser"),

    bootstrapFinished: (state) => {
      state.bootstrapping = false;
    },

    loginRequest: (state) => {
      state.authDetails.status = "pending";
      state.authDetails.error = null;
    },
    loginSuccess: (state, action) => {
      const user = action.payload ?? {};
      state.authDetails.status = "success";
      state.authDetails.data = user;
      state.authDetails.currentUser = user;
      state.authDetails.isAuthenticated = true;
      state.authDetails.error = null;
      state.authDetails.token = user.token ?? user.accessToken ?? null;
      state.bootstrapping = false;
    },
    loginFailure: (state, action) => {
      state.authDetails.status = "failed";
      state.authDetails.error = action.payload;
      state.authDetails.isAuthenticated = false;
      state.authDetails.token = null;
      state.bootstrapping = false;
    },

    /** Silent session restore from a refresh token, on page load. */
    sessionRestored: (state, action) => {
      const user = action.payload ?? {};
      state.authDetails.currentUser = user;
      state.authDetails.data = user;
      state.authDetails.isAuthenticated = true;
      state.authDetails.token = user.token ?? user.accessToken ?? null;
      state.bootstrapping = false;
    },

    logoutRequest: (state) => {
      state.logout.status = "pending";
    },
    logoutSuccess: () => ({ ...initialState, bootstrapping: false }),
    logoutFailure: (state, action) => {
      state.logout.status = "failed";
      state.logout.error = action.payload;
    },

    clearAuthState: () => ({ ...initialState, bootstrapping: false }),

    clearAuthDetailsStatus: (state) => {
      state.authDetails.status = null;
    },
    clearAuthDetailsError: (state) => {
      state.authDetails.error = null;
    },
    clearCurrentUser: (state) => {
      state.authDetails.currentUser = null;
      state.authDetails.isAuthenticated = false;
      state.authDetails.token = null;
    },
    clearLogoutStatus: (state) => {
      state.logout.status = null;
    },
    clearGetUserData: (state) => {
      state.getUser.data = null;
    },

    /** Keeps the cached profile in step after a profile or hotel edit. */
    updateUser: (state, action) => {
      state.getUser.data = { ...state.getUser.data, user: action.payload };
    },
  },
});

export const authActions = authSlice.actions;
export const authReducer = authSlice.reducer;

/* ── Selectors ────────────────────────────────────────────────────────── */

export const selectCurrentUser = (state) => state.auth.authDetails.currentUser;
export const selectIsAuthenticated = (state) =>
  state.auth.authDetails.isAuthenticated;
export const selectBootstrapping = (state) => state.auth.bootstrapping;
export const selectProfile = (state) => state.auth.getUser.data?.user ?? null;
export const selectRole = (state) =>
  state.auth.getUser.data?.user?.role ?? state.auth.authDetails.currentUser?.role ?? null;
export const selectHotelId = (state) =>
  state.auth.getUser.data?.user?.hotelId ??
  state.auth.authDetails.currentUser?.hotelId ??
  null;
