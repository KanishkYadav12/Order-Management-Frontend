import api from "@/lib/api";
import { dishActions } from "@/redux/slices/dishSlice";
import { getActionErrorMessage } from "@/utils";

// Get all dishes
export const getAllDishes = () => async (dispatch) => {
  console.log("action-get-all-dishes-req:");
  try {
    dispatch(dishActions.getAllDishesRequest());

    const response = await api.get("/dishes", {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-all-dishes-res:", data);

    if (status === "success") {
      dispatch(dishActions.getAllDishesSuccess(data));
    } else {
      dispatch(dishActions.getAllDishesFailure(message));
    }
  } catch (error) {
    console.log("action-get-all-dishes-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(dishActions.getAllDishesFailure(errorMessage));
  }
};

// Get single dish
export const getDish = (dishId) => async (dispatch) => {
  console.log("action-get-dish-req: ", dishId);
  try {
    dispatch(dishActions.getDishRequest());

    const response = await api.get(`/dishes/${dishId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-dish-res:", data);

    if (status === "success") {
      dispatch(dishActions.getDishSuccess(data));
    } else {
      dispatch(dishActions.getDishFailure(message));
    }
  } catch (error) {
    console.log("action-get-dish-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(dishActions.getDishFailure(errorMessage));
  }
};

// Update dish
export const updateDish = (dishId, dishData) => async (dispatch) => {
  console.log("action-update-dish-req:", dishId, dishData);
  try {
    dispatch(dishActions.updateDishRequest());

    const response = await api.patch(`/dishes/${dishId}`, dishData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-update-dish-res:", data);

    if (status === "success") {
      dispatch(dishActions.updateDishSuccess(data));
    } else {
      dispatch(dishActions.updateDishFailure(message));
    }
  } catch (error) {
    console.log("action-update-dish-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(dishActions.updateDishFailure(errorMessage));
  }
};

// Remove dish offer
export const removeOffer = (dishId) => async (dispatch) => {
  console.log("action-remove-offer-dish-req:", dishId);
  try {
    dispatch(dishActions.removeOfferRequest());

    const response = await api.put(
      `/dishes/remove-offer/${dishId}`,
      {},
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    const { status, message, data } = response.data;
    console.log("action-remove-offer-dish-res:", data);

    if (status === "success") {
      dispatch(dishActions.removeOfferSuccess(data));
    } else {
      dispatch(dishActions.removeOfferFailure(message));
    }
  } catch (error) {
    console.log("action-remove-offer-dish-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(dishActions.removeOfferFailure(errorMessage));
  }
};

// Create dish
export const createDish = (dishData) => async (dispatch) => {
  console.log("action-create-dish-req:", dishData);
  try {
    dispatch(dishActions.createDishRequest());

    const response = await api.post("/dishes", dishData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-create-dish-res:", data);

    if (status === "success") {
      dispatch(dishActions.createDishSuccess(data));
    } else {
      dispatch(dishActions.createDishFailure(message));
    }
  } catch (error) {
    console.log("action-create-dish-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(dishActions.createDishFailure(errorMessage));
  }
};

// Delete dish
export const deleteDish = (dishId) => async (dispatch) => {
  console.log("action-delete-dish-req:", dishId);
  try {
    dispatch(dishActions.deleteDishRequest());

    const response = await api.delete(`/dishes/${dishId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-delete-dish-res:", data);

    if (status === "success") {
      dispatch(dishActions.deleteDishSuccess(data));
    } else {
      dispatch(dishActions.deleteDishFailure(message));
    }
  } catch (error) {
    console.log("action-delete-dish-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(dishActions.deleteDishFailure(errorMessage));
  }
};
