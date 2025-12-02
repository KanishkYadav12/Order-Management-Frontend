"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetAllOrders } from "@/hooks/order/useGetAllOrders";

export default function OrderList() {
  const { orders, loading, refetch } = useGetAllOrders();

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Pending Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {orders?.pending?.map((order) => (
              <OrderCard key={order._id} order={order} status="pending" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preparing Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Preparing Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {orders?.preparing?.map((order) => (
              <OrderCard key={order._id} order={order} status="preparing" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Completed Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {orders?.completed?.map((order) => (
              <OrderCard key={order._id} order={order} status="completed" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderCard({ order, status }) {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">Table #{order.tableNumber}</h3>
          <p className="text-sm text-gray-500">{order.customerName}</p>
        </div>
        <div className="text-right">
          <span
            className={`inline-block px-2 py-1 rounded text-sm ${
              status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : status === "preparing"
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {status}
          </span>
        </div>
      </div>
      <div className="mt-2">
        <h4 className="text-sm font-medium">Dishes:</h4>
        <ul className="text-sm">
          {order.dishes.map((dish) => (
            <li key={dish._id} className="flex justify-between">
              <span>{dish.dishId?.name}</span>
              <span>x{dish.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
