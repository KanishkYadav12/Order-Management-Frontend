import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";
import { getOrderDetails } from "@/redux/actions/order/orderActions";
import { orderActions } from "@/redux/slices/orderSlice";

export const useGetOrderDetails = (orderId) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { status, error, data } = useSelector(
    (state) => state.order.orderDetails
  );
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      dispatch(orderActions.clearOrderDetails());
    };
  }, [dispatch]);

  useEffect(() => {
    if (status === "pending") {
      setLoading(true);
    } else if (status === "success") {
      setLoading(false);
      toast({
        title: "Success",
        description: "Order details fetched successfully",
        variant: "success",
      });
    } else if (status === "failed") {
      setLoading(false);
      toast({
        title: "Error",
        description: error || "Failed to fetch order details",
        variant: "destructive",
      });
    }
  }, [status, error, toast]);

  const fetchOrderDetails = async (orderId) => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "Order ID is required",
        variant: "destructive",
      });
      return;
    }
    await dispatch(getOrderDetails(orderId));
  };

  // If orderId is provided, fetch order details automatically
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

  return {
    loading,
    error,
    orderDetails: data?.order,
    fetchOrderDetails,
  };
};
