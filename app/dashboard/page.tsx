import React from 'react'
import { ShoppingCart, Package, CheckCircle, Clock, PlusCircle, AlertCircle, TrendingUp, Activity, User } from 'lucide-react'
import Link from "next/link"

const page = () => {
  // Sample data - replace with your actual data
  const stats = {
    totalOrders: {
      today: 42,
      month: 1280,
    },
    ordersByStatus: {
      pending: 18,
      delivering: 24,
      completed: 980,
    },
    userCount: {
      name: "users",
      count: 5
    },
    revenue: {
      today: 1260,
      month: 38400,
      change: '+12%',
    },
    recentActivity: [
      { type: 'order', message: 'New order #1245 placed', time: '10 min ago' },
      { type: 'stock', message: 'Easter Special preset stock updated', time: '25 min ago' },
      { type: 'order', message: 'Order #1243 marked as completed', time: '1 hour ago' },
      { type: 'preset', message: 'New preset "Spring Collection" added', time: '2 hours ago' },
    ],
    bestSellingPresets: [
      { name: 'Easter Special', sales: 320, revenue: 9600 },
      { name: 'Animal Patterns', sales: 280, revenue: 8400 },
      { name: 'Classic Colors', sales: 210, revenue: 6300 },
    ],
  }

  return (
    <div className="p-6 font-monrape flex items-center justify-center h-full">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
        
        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Orders</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalOrders.today}</h3>
                <p className="text-sm text-gray-500">
                  {stats.totalOrders.month} this month
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Orders by Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                  <span>Pending</span>
                </div>
                <span className="font-medium">{stats.ordersByStatus.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-blue-500 mr-2" />
                  <span>Delivering</span>
                </div>
                <span className="font-medium">{stats.ordersByStatus.delivering}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Completed</span>
                </div>
                <span className="font-medium">{stats.ordersByStatus.completed}</span>
              </div>
            </div>
          </div>

          {/* Users Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Users</p>
                <h3 className="text-2xl font-bold mt-1">{stats.userCount.name}</h3>
                <p className="text-sm text-gray-500">
                  {stats.userCount.count} this month
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <User className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Revenue</p>
                <h3 className="text-2xl font-bold mt-1">${stats.revenue.today}</h3>
                <p className="text-sm text-gray-500">
                  ${stats.revenue.month} this month <span className="text-green-500">{stats.revenue.change}</span>
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/dashboard/presets" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
            <button className='flex items-center justify-between w-full'>
              <div className="flex items-center">
                <PlusCircle className="h-5 w-5 text-amber-600 mr-3" />
                <span className="font-medium">Add New Preset</span>
              </div>
              <span className="text-gray-500">+</span>
            </button>
          </Link>

          <Link href="/dashboard/orders" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
            <button className='flex items-center justify-between w-full'>
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
                <span className="font-medium">View Pending Orders</span>
              </div>
              <span className="text-gray-500">→</span>
            </button>
          </Link>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 text-amber-600 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className={`p-2 rounded-full mr-3 ${
                  activity.type === 'order' ? 'bg-blue-100' :
                  activity.type === 'stock' ? 'bg-purple-100' :
                  'bg-green-100'
                }`}>
                  {activity.type === 'order' ? (
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  ) : activity.type === 'stock' ? (
                    <Package className="h-4 w-4 text-purple-600" />
                  ) : (
                    <PlusCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.message}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default page