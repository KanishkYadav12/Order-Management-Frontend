"use client";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, IndianRupee, UserCheck, TrendingUp } from "lucide-react";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import TopDishesCard from "@/components/dashboard/top-dishes/TopDishesCard";
import { useFetchDashboard } from "@/hooks/dashboard/useFetchDashboard";
import DashboardLoading from "./loading";

export default function DashboardPage() {
  const { data, loading, error } = useFetchDashboard();

  return (
    <div className="lg:p-6">
      {loading ? (
        <DashboardLoading />
      ) : error ? (
        <div className="p-4 text-red-500 rounded bg-red-50">
          <p className="font-semibold">Error Loading Dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <>
          {/* Dashboard Header */}
          <div className="flex flex-wrap items-center justify-between mb-6">
            <h1 className="text-xl font-bold lg:text-3xl">Dashboard</h1>
            <div className="p-2 mt-4 rounded-full bg-primary/10 sm:mt-0">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Dashboard Cards - Flex/Grid Layout */}
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-4">
            {/* Today's Customers Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-2 pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Today's Customers
                </CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="py-2 lg:py-4">
                <div className="text-2xl font-bold">
                  {data?.customers?.today || 0}
                </div>
              </CardContent>
            </Card>

            {/* Today's Revenue Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-2 pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Today's Revenue
                </CardTitle>
                <IndianRupee className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="py-2 lg:py-4">
                <div className="text-2xl font-bold">
                  ₹{data?.revenue?.today || 0}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Customers Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-2 pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Monthly Customers
                </CardTitle>
                <UserCheck className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="py-2 lg:py-4">
                <div className="text-2xl font-bold">
                  {data?.customers?.monthly || 0}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Revenue Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-2 pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Monthly Revenue
                </CardTitle>
                <div className="flex items-center justify-center w-4 h-4 text-muted-foreground">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="py-2 lg:py-4">
                <div className="text-2xl font-bold">
                  ₹{data?.revenue?.monthly || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Charts */}
          <div className="mt-4">
            <DashboardCharts
              data={{
                revenueByDate: data?.revenueByDate,
                customersByDate: data?.customersByDate,
              }}
            />
          </div>

          {/* Top Dishes */}
          <div className="mt-4">
            <TopDishesCard data={data?.thisMonthDishes} />
          </div>
        </>
      )}
    </div>
  );
}
