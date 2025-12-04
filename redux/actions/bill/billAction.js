import api from "@/lib/api";
import { billActions } from "@/redux/slices/billSlice";
import { tableActions } from "@/redux/slices/tableSlice";
import { orderActions } from "@/redux/slices/orderSlice";
import { getActionErrorMessage } from "@/utils";

export const getAllBills = () => async (dispatch) => {
  console.log("action-get-all-bills-req:");
  try {
    dispatch(billActions.getAllBillsRequest());

    const response = await api.get("/bills", {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-all-bills-res:", data);

    if (status === "success") {
      dispatch(billActions.getAllBillsSuccess(data));
    } else {
      dispatch(billActions.getAllBillsFailure(message));
    }
  } catch (error) {
    console.log("action-get-all-bills-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(billActions.getAllBillsFailure(errorMessage));
  }
};

// Get bill for a table
export const getTableBill = (tableId) => async (dispatch) => {
  console.log("action-get-Table-bill-req:");
  try {
    dispatch(billActions.getTableBillRequest());

    const response = await api.get(`/tables/bill/${tableId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-Table-bill-res:", data);

    if (status === "success") {
      dispatch(billActions.getTableBillSuccess(data));
    } else {
      dispatch(billActions.getTableBillFailure(message));
    }
  } catch (error) {
    console.log("action-get-Table-bill-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(billActions.getTableBillFailure(errorMessage));
  }
};

// Update a bill
export const updateBill = (billId, billData) => async (dispatch) => {
  console.log("action-update-bill-req:", billId, billData);
  try {
    dispatch(billActions.updateBillRequest());

    const response = await api.put(`/bills/${billId}`, billData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-update-bill-res:", data);

    if (status === "success") {
      dispatch(billActions.updateBillSuccess(data));
    } else {
      dispatch(billActions.updateBillFailure(message));
    }
  } catch (error) {
    console.log("action-update-bill-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(billActions.updateBillFailure(errorMessage));
  }
};

// Pay a bill
export const payBill = (billId) => async (dispatch) => {
  console.log("action-pay-bill-req:", billId);
  try {
    dispatch(billActions.payBillRequest());

    const response = await api.patch(
      `/bills/paid/${billId}`,
      {},
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    const { status, message, data } = response.data;
    console.log("action-pay-bill-res:", data);

    if (status === "success") {
      dispatch(billActions.payBillSuccess(data.bill));
      if (data.table) dispatch(tableActions.insertUpdatedTable(data.table));
      if (data.orders) dispatch(orderActions.deleteBilledOrders(data.orders));
    } else {
      dispatch(billActions.payBillFailure(message));
    }
  } catch (error) {
    console.log("action-pay-bill-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(billActions.payBillFailure(errorMessage));
  }
};

// Create a bill
export const createBill = (billData) => async (dispatch) => {
  console.log("action-create-bill-req:", billData);
  try {
    dispatch(billActions.createBillRequest());

    const response = await api.post("/bills", billData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-create-bill-res:", data);

    if (status === "success") {
      dispatch(billActions.createBillSuccess(data));
    } else {
      dispatch(billActions.createBillFailure(message));
    }
  } catch (error) {
    console.log("action-create-bill-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(billActions.createBillFailure(errorMessage));
  }
};

// Delete a bill
export const deleteBill = (billId) => async (dispatch) => {
  console.log("action-delete-bill-req:", billId);
  try {
    dispatch(billActions.deleteBillRequest());

    const response = await api.delete(`/bills/${billId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-delete-bill-res:", data);

    if (status === "success") {
      dispatch(billActions.deleteBillSuccess(data));
    } else {
      dispatch(billActions.deleteBillFailure(message));
    }
  } catch (error) {
    console.log("action-delete-bill-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(billActions.deleteBillFailure(errorMessage));
  }
};

// Send bill to email
export const sendBillToEmail = (email, billId) => async (dispatch) => {
  console.log("action-send-email-bill-req: ", email, billId);
  try {
    dispatch(billActions.sendBillToEmailRequest());

    const response = await api.post(
      `/bills/send-bill/${billId}/${email}`,
      {},
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    const { status, message, data } = response.data;
    console.log("action-send-email-bill-res:", data);

    if (status === "success") {
      dispatch(billActions.sendBillToEmailSuccess(data));
    } else {
      dispatch(billActions.sendBillToEmailFailure(message));
    }
  } catch (error) {
    console.log("action-send-email-bills-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(billActions.sendBillToEmailFailure(errorMessage));
  }
};
