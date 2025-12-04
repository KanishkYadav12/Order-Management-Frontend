import api from "@/lib/api";
import { tableActions } from "@/redux/slices/tableSlice";
import { getActionErrorMessage } from "@/utils";

// Get all tables
export const getAllTables = () => async (dispatch) => {
  console.log("action-get-all-tables-req:");
  try {
    dispatch(tableActions.getAllTablesRequest());

    const response = await api.get("/tables", {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-get-all-tables-res:", data);

    if (status === "success") {
      dispatch(tableActions.getAllTablesSuccess(data));
    } else {
      dispatch(tableActions.getAllTablesFailure(message));
    }
  } catch (error) {
    console.log("action-get-all-tables-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(tableActions.getAllTablesFailure(errorMessage));
  }
};

// Update a table
export const updateTable = (tableId, tableData) => async (dispatch) => {
  console.log("action-update-table-req:", tableId);
  try {
    dispatch(tableActions.updateTableRequest());

    const response = await api.put(`/tables/${tableId}`, tableData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-update-table-res:", data);

    if (status === "success") {
      dispatch(tableActions.updateTableSuccess(data));
    } else {
      dispatch(tableActions.updateTableFailure(message));
    }
  } catch (error) {
    console.log("action-update-table-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(tableActions.updateTableFailure(errorMessage));
  }
};

// Create a table
export const createTable = (tableData) => async (dispatch) => {
  console.log("action-create-table-req:", tableData);
  try {
    dispatch(tableActions.createTableRequest());

    const response = await api.post("/tables", tableData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-create-table-res:", data);

    if (status === "success") {
      dispatch(tableActions.createTableSuccess(data));
    } else {
      dispatch(tableActions.createTableFailure(message));
    }
  } catch (error) {
    console.log("action-create-table-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(tableActions.createTableFailure(errorMessage));
  }
};

// Delete a table
export const deleteTable = (tableId) => async (dispatch) => {
  console.log("action-delete-table-req:", tableId);
  try {
    dispatch(tableActions.deleteTableRequest());

    const response = await api.delete(`/tables/${tableId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { status, message, data } = response.data;
    console.log("action-delete-table-res:", data);

    if (status === "success") {
      dispatch(tableActions.deleteTableSuccess(data));
    } else {
      dispatch(tableActions.deleteTableFailure(message));
    }
  } catch (error) {
    console.log("action-delete-table-error:", error);
    const errorMessage = getActionErrorMessage(error);
    dispatch(tableActions.deleteTableFailure(errorMessage));
  }
};
