import api from "@/lib/api";
import { ingredientActions } from "@/redux/slices/ingredientsSlice";
import { getActionErrorMessage } from "@/utils";

// Get all ingredients
export const getAllIngredients = () => async (dispatch) => {
  console.log("action-get-all-ingredients-req:");
  try {
    dispatch(ingredientActions.getAllIngredientsRequest());

    const response = await api.get("/ingredients", {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-all-ingredients-res:", data);

    if (status === "success") {
      dispatch(ingredientActions.getAllIngredientsSuccess(data));
    } else {
      dispatch(ingredientActions.getAllIngredientsFailure(message));
    }
  } catch (error) {
    console.log("action-get-all-ingredients-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(ingredientActions.getAllIngredientsFailure(errorMessage));
  }
};

// Update ingredient
export const updateIngredient =
  (ingredientId, ingredientData) => async (dispatch) => {
    console.log("action-update-ingredient-req:", ingredientId);
    try {
      dispatch(ingredientActions.updateIngredientRequest());

      const response = await api.patch(
        `/ingredients/${ingredientId}`,
        ingredientData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const { status, message, data } = response.data;
      console.log("action-update-ingredient-res:", data);

      if (status === "success") {
        dispatch(ingredientActions.updateIngredientSuccess(data));
      } else {
        dispatch(ingredientActions.updateIngredientFailure(message));
      }
    } catch (error) {
      console.log("action-update-ingredient-error:", error);
      const errorMessage = getActionErrorMessage(error);
      dispatch(ingredientActions.updateIngredientFailure(errorMessage));
    }
  };

// Create ingredient
export const createIngredient = (ingredientData) => async (dispatch) => {
  console.log("action-create-ingredient-req:", ingredientData);
  try {
    dispatch(ingredientActions.createIngredientRequest());

    const response = await api.post("/ingredients", ingredientData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-create-ingredient-res:", data);

    if (status === "success") {
      dispatch(ingredientActions.createIngredientSuccess(data));
    } else {
      dispatch(ingredientActions.createIngredientFailure(message));
    }
  } catch (error) {
    console.log("action-create-ingredient-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(ingredientActions.createIngredientFailure(errorMessage));
  }
};

// Delete ingredient
export const deleteIngredient = (ingredientId) => async (dispatch) => {
  console.log("action-delete-ingredient-req:", ingredientId);
  try {
    dispatch(ingredientActions.deleteIngredientRequest());

    const response = await api.delete(`/ingredients/${ingredientId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-delete-ingredient-res:", data);

    if (status === "success") {
      dispatch(
        ingredientActions.deleteIngredientSuccess({
          deletedIngredientId: ingredientId,
        })
      );
    } else {
      dispatch(ingredientActions.deleteIngredientFailure(message));
    }
  } catch (error) {
    console.log("action-delete-ingredient-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(ingredientActions.deleteIngredientFailure(errorMessage));
  }
};
