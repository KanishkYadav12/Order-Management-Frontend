import api from "@/lib/api";
import { orderActions } from "@/redux/slices/orderSlice";
import { tableActions } from "@/redux/slices/tableSlice";
import { getActionErrorMessage } from "@/utils";

// Get order details
export const getOrderDetails = (orderId) => async (dispatch) => {
  console.log("action-get-order-details-req:", orderId);
  try {
    dispatch(orderActions.getOrderDetailsRequest());

    const response = await api.get(`/orders/${orderId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-order-details-res:", data);

    if (status === "success") {
      dispatch(orderActions.getOrderDetailsSuccess(data));
    } else {
      dispatch(orderActions.getOrderDetailsFailure(message));
    }
  } catch (error) {
    console.log("action-get-order-details-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(orderActions.getOrderDetailsFailure(errorMessage));
  }
};

// Get all orders
export const getAllOrders = () => async (dispatch) => {
  console.log("action-get-all-orders-req:");
  try {
    dispatch(orderActions.getAllOrdersRequest());

    const response = await api.get("/orders", {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-all-orders-res:", data);

    if (status === "success") {
      dispatch(orderActions.getAllOrdersSuccess(data.orders));
    } else {
      dispatch(orderActions.getAllOrdersFailure(message));
    }
  } catch (error) {
    console.log("action-get-all-orders-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(orderActions.getAllOrdersFailure(errorMessage));
  }
};

// Get table orders
export const getTableOrders = (tableId) => async (dispatch) => {
  console.log("action-get-table-orders-req:");
  try {
    dispatch(orderActions.getTableOrdersRequest());

    const response = await api.get(`/orders/table/${tableId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-table-orders-res:", data);

    if (status === "success") {
      dispatch(orderActions.getTableOrderSuccess(data.orders));
    } else {
      dispatch(orderActions.getTableOrderFailure(message));
    }
  } catch (error) {
    console.log("action-get-table-orders-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(orderActions.getTableOrderFailure(errorMessage));
  }
};

// Update order
export const updateOrder = (orderId, orderData) => async (dispatch) => {
  console.log("action-update-order-req:", orderId);
  try {
    dispatch(orderActions.updateOrderRequest());

    const response = await api.put(`/orders/owner/${orderId}`, orderData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-update-order-res:", data);

    if (status === "success") {
      dispatch(orderActions.updateOrderSuccess(data));
    } else {
      dispatch(orderActions.updateOrderFailure(message));
    }
  } catch (error) {
    console.log("action-update-order-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(orderActions.updateOrderFailure(errorMessage));
  }
};

// Update order status
export const updateOrderStatus = (orderId, newStatus) => async (dispatch) => {
  console.log("action-update-order-status-req:", orderId);
  try {
    dispatch(orderActions.updateOrderStatusRequest());

    const response = await api.patch(
      `/orders/${orderId}/${newStatus}`,
      {},
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    const { status, message, data } = response.data;
    console.log("action-update-order-status-res:", data);

    if (status === "success") {
      dispatch(orderActions.updateOrderStatusSuccess(data));
    } else {
      dispatch(orderActions.updateOrderStatusFailure(message));
    }
  } catch (error) {
    console.log("action-update-order-status-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(orderActions.updateOrderStatusFailure(errorMessage));
  }
};

// Create new order
export const createOrder =
  (orderData, hotelId, tableId) => async (dispatch) => {
    console.log("action-create-order-req:", orderData, hotelId, tableId);
    try {
      dispatch(orderActions.createOrderRequest());

      const response = await api.post(`/orders/${tableId}`, orderData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      const { status, message, data } = response.data;
      console.log("action-create-order-res:", data);

      if (status === "success") {
        dispatch(orderActions.createOrderSuccess(data));
        if (data.table) dispatch(tableActions.insertUpdatedTable(data.table));
      } else {
        dispatch(orderActions.createOrderFailure(message));
      }
    } catch (error) {
      console.log("action-create-order-error:", error);
      const errorMessage = getActionErrorMessage(error);
      dispatch(orderActions.createOrderFailure(errorMessage));
    }
  };

// Delete order
export const deleteOrder = (orderId) => async (dispatch) => {
  console.log("action-delete-order-req:", orderId);
  try {
    dispatch(orderActions.deleteOrderRequest());

    const response = await api.delete(`/orders/${orderId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-delete-order-res:", data);

    if (status === "success") {
      if (data.table) {
        dispatch(tableActions.insertUpdatedTable(data.table));
      }
      dispatch(orderActions.deleteOrderSuccess(data));
    } else {
      dispatch(orderActions.deleteOrderFailure(message));
    }
  } catch (error) {
    console.log("action-delete-order-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(orderActions.deleteOrderFailure(errorMessage));
  }
};
