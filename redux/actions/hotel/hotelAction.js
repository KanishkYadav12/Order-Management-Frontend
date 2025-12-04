import api from "@/lib/api";
import { hotelActions } from "@/redux/slices/hotelSlice";
import { ownerActions } from "@/redux/slices/ownerSlice";
import { getActionErrorMessage } from "@/utils";

// Get hotel by ID
export const getHotel = (hotelId) => async (dispatch) => {
  console.log("action-get-hotel-req: ", hotelId);
  try {
    dispatch(hotelActions.getHotelRequest());

    const response = await api.get(`/hotels/${hotelId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-hotel-res:", data);

    if (status === "success") {
      dispatch(hotelActions.getHotelSuccess(data));
    } else {
      dispatch(hotelActions.getHotelFailure(message));
    }
  } catch (error) {
    console.log("action-get-hotel-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(hotelActions.getHotelFailure(errorMessage));
  }
};

// Get all hotel owners
export const fetchHotelOwners = () => async (dispatch) => {
  console.log("action-fetch-hotel-owners-req");
  try {
    dispatch(hotelActions.fetchHotelOwnersRequest());

    const response = await api.get(`/users/hotel-owners`, {
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-fetch-hotel-owners-res:", data);

    if (status === "success") {
      dispatch(hotelActions.fetchHotelOwnersSuccess(data));
    } else {
      dispatch(hotelActions.fetchHotelOwnersFailure(message));
    }
  } catch (error) {
    console.log("action-fetch-hotel-owners-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(hotelActions.fetchHotelOwnersFailure(errorMessage));
  }
};

// Fetch all hotels
export const fetchAllHotels = () => async (dispatch) => {
  console.log("action-fetch-all-hotels-req");
  try {
    dispatch(hotelActions.fetchAllHotelsRequest());

    const response = await api.get(`/hotels/getAllHotels`, {
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-fetch-all-hotels-res:", data);

    if (status === "success") {
      dispatch(hotelActions.fetchAllHotelsSuccess(data));
    } else {
      dispatch(hotelActions.fetchAllHotelsFailure(message));
    }
  } catch (error) {
    console.log("action-fetch-all-hotels-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(hotelActions.fetchAllHotelsFailure(errorMessage));
  }
};

// Update hotel
export const updateHotel = (hotelId, updateData) => async (dispatch) => {
  console.log("action-update-hotel-req:", { hotelId, updateData });
  try {
    dispatch(hotelActions.updateHotelRequest());

    const response = await api.put(`/hotels/${hotelId}`, updateData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-update-hotel-res:", data);

    if (status === "success") {
      dispatch(hotelActions.updateHotelSuccess(data));
      dispatch(ownerActions.setProfileRefresh(true));
    } else {
      dispatch(hotelActions.updateHotelFailure(message));
    }
  } catch (error) {
    console.log("action-update-hotel-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(hotelActions.updateHotelFailure(errorMessage));
  }
};
