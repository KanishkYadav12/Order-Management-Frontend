import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";
import { getAllOrders } from "@/redux/actions/order/orderActions";
import { orderActions } from "@/redux/slices/orderSlice";

export const useGetAllOrders = (type="order", params = {}) => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const { refresh = false, setRefresh = null } = params;

    const { status, error, data } = useSelector((state) => state.order.getAllOrders);
    const { toast } = useToast();

    // Cleanup function to reset states
    useEffect(() => {
        return () => {
            dispatch(orderActions.clearGetAllOrdersStatus());
            dispatch(orderActions.clearGetAllOrdersError());
        };
    }, [dispatch]);

    const fetchAllOrders = useCallback(() => {
        if ( type === 'order') {
            dispatch(getAllOrders());
        }
    }, [dispatch, type]);

    /**
     * Fetch on mount, every mount.
     *
     * The guard was `if (refresh || !data)`, so once anything had been loaded
     * into the store the board never asked again. Settling a bill deletes that
     * table's orders server-side, but navigating back from the bill screen
     * re-rendered the cached buckets — so a paid order sat in "Served" until a
     * hard reload, and the floor and the board disagreed about who was seated.
     */
    useEffect(() => {
        fetchAllOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchAllOrders]);

    useEffect(() => {
        if (refresh) {
            if (setRefresh) setRefresh(false);
            fetchAllOrders();
        }
    }, [refresh, fetchAllOrders, setRefresh]);

    // Status handling
    useEffect(() => {
        switch (status) {
            case "pending":
                setLoading(true);
                break;
            case "success":
                setLoading(false);
                if (setRefresh) setRefresh(false);
                if (refresh) {
                }
                dispatch(orderActions.clearGetAllOrdersStatus());
                dispatch(orderActions.clearGetAllOrdersError());
                break;
            case "failed":
                setLoading(false);
                toast({
                    title: "Error",
                    description: error || "Failed to Fetch Orders.",
                    variant: "destructive",
                });
                dispatch(orderActions.clearGetAllOrdersStatus());
                dispatch(orderActions.clearGetAllOrdersError());
                break;
        }
    }, [status, error, dispatch, toast, setRefresh, refresh]);

    const transformedOrders = useMemo(() => {
        return data || {
            draft: [],
            pending: [],
            preparing: [],
            completed: [],
        };
    }, [data]);

    return { 
        orders: transformedOrders, 
        loading,
        refetch: fetchAllOrders
    };
};
