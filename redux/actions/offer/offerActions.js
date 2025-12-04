import api from "@/lib/api";
import { offerActions } from "@/redux/slices/offerSlice";
import { getActionErrorMessage } from "@/utils";

// Get all offers
export const getAllOffers = () => async (dispatch) => {
  console.log("action-get-all-offers-req:");
  try {
    dispatch(offerActions.getAllOffersRequest());

    const response = await api.get("/offers", {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-all-offers-res:", data);

    if (status === "success") {
      dispatch(offerActions.getAllOffersSuccess(data));
    } else {
      dispatch(offerActions.getAllOffersFailure(message));
    }
  } catch (error) {
    console.log("action-get-all-offers-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(offerActions.getAllOffersFailure(errorMessage));
  }
};

// Update offer
export const updateOffer = (offerId, offerData) => async (dispatch) => {
  console.log("action-update-offer-req:", offerId);
  try {
    dispatch(offerActions.updateOfferRequest());

    const response = await api.put(`/offers/${offerId}`, offerData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-update-offer-res:", data);

    if (status === "success") {
      dispatch(offerActions.updateOfferSuccess(data));
    } else {
      dispatch(offerActions.updateOfferFailure(message));
    }
  } catch (error) {
    console.log("action-update-offer-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(offerActions.updateOfferFailure(errorMessage));
  }
};

// Get single offer
export const getOffer = (offerId) => async (dispatch) => {
  console.log("action-get-offer-req:", offerId);
  try {
    dispatch(offerActions.getOfferRequest());

    const response = await api.get(`/offers/${offerId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-offer-res:", data);

    if (status === "success") {
      dispatch(offerActions.getOfferSuccess(data));
    } else {
      dispatch(offerActions.getOfferFailure(message));
    }
  } catch (error) {
    console.log("action-get-offer-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(offerActions.getOfferFailure(errorMessage));
  }
};

// Create offer
export const createOffer = (offerData) => async (dispatch) => {
  console.log("action-create-offer-req:", offerData);
  try {
    dispatch(offerActions.createOfferRequest());

    const response = await api.post("/offers", offerData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-create-offer-res:", data);

    if (status === "success") {
      dispatch(offerActions.createOfferSuccess(data));
    } else {
      dispatch(offerActions.createOfferFailure(message));
    }
  } catch (error) {
    console.log("action-create-offer-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(offerActions.createOfferFailure(errorMessage));
  }
};

// Delete offer
export const deleteOffer = (offerId) => async (dispatch) => {
  console.log("action-delete-offer-req:", offerId);
  try {
    dispatch(offerActions.deleteOfferRequest());

    const response = await api.delete(`/offers/${offerId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-delete-offer-res:", data);

    if (status === "success") {
      dispatch(offerActions.deleteOfferSuccess(data));
      dispatch(offerActions.closeDeleteOfferDialog());
    } else {
      dispatch(offerActions.deleteOfferFailure(message));
    }
  } catch (error) {
    console.log("action-delete-offer-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(offerActions.deleteOfferFailure(errorMessage));
  }
};
