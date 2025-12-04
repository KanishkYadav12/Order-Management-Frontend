import api from "@/lib/api";
import { ownerActions } from "@/redux/slices/ownerSlice";
import { authActions } from "@/redux/slices/authSlice";
import { getActionErrorMessage } from "@/utils/getActionErrorMessage.js";

// Approve hotel owner
export const approveHotelOwner = (hotelOwnerId) => async (dispatch) => {
  console.log("action-approve-owner-req:", hotelOwnerId);
  try {
    dispatch(ownerActions.approveOwnerRequest());

    const response = await api.patch(
      `/users/approve-hotel-owner/${hotelOwnerId}`,
      {},
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    const { status, message, data } = response.data;
    console.log("action-approve-owner-res:", data);

    if (status === "success") {
      dispatch(ownerActions.approveOwnerSuccess(data));
    } else {
      dispatch(ownerActions.approveOwnerFailure(message));
    }
  } catch (error) {
    console.log("action-approve-owner-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(ownerActions.approveOwnerFailure(errorMessage));
  }
};

// Get all hotel owners
export const getAllHotelOwners = () => async (dispatch) => {
  console.log("action-get-all-owner-req:");
  try {
    dispatch(ownerActions.getAllOwnersRequest());

    const response = await api.get(`/users/hotel-owners`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-all-owner-res:", data);

    if (status === "success") {
      dispatch(ownerActions.getAllOwnersSuccess(data));
    } else {
      dispatch(ownerActions.getAllOwnersFailure(message));
    }
  } catch (error) {
    console.log("action-get-all-owner-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(ownerActions.getAllOwnersFailure(errorMessage));
  }
};

// Extend owner membership
export const extendOwnerMembership =
  (ownerId, numberOfDays) => async (dispatch) => {
    console.log("action-extend-owner-membership-req:", ownerId, numberOfDays);
    try {
      dispatch(ownerActions.extendOwnerMembershipRequest());

      const response = await api.patch(
        `/users/membership-extender/${ownerId}`,
        { days: numberOfDays },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const { status, message, data } = response.data;
      console.log("action-extend-owner-membership-res:", data);

      if (status === "success") {
        dispatch(ownerActions.extendOwnerMembershipSuccess(data));
      } else {
        dispatch(ownerActions.extendOwnerMembershipFailure(message));
      }
    } catch (error) {
      console.log("action-extend-owner-membership-error:", error);
      const errorMessage = getActionErrorMessage(error);
      dispatch(ownerActions.extendOwnerMembershipFailure(errorMessage));
    }
  };

// Update owner
export const updateOwner = (ownerId, ownerData) => async (dispatch) => {
  console.log("action-update-owner-req:", ownerId);
  try {
    dispatch(ownerActions.updateOwnerRequest());

    const response = await api.patch(`/users/owner/${ownerId}`, ownerData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-update-owner-res:", data);

    if (status === "success") {
      // Update owner slice
      dispatch(ownerActions.updateOwnerSuccess(data));

      // Update auth user (profile)
      console.log("updating user from updateOwner:", data.owner);
      dispatch(authActions.updateUser(data.owner));

      // Trigger profile refresh
      dispatch(ownerActions.setProfileRefresh(true));
    } else {
      dispatch(ownerActions.updateOwnerFailure(message));
    }
  } catch (error) {
    console.log("action-update-owner-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(ownerActions.updateOwnerFailure(errorMessage));
  }
};
