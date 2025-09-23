'use client'

import { useState, useEffect } from 'react'

interface Order {
  id: string
  productName: string
  country: string
  duration: number
  quantity: number
  price: number
  priceVND: number
  simType: 'esim' | 'physical'
  contactInfo: string
  orderDate: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'usim_failed' | 'usim_login_failed' | 'usim_error' | 'failed'
  usimOrderId?: string
  esimData?: any
  usimError?: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Check authentication and role
  useEffect(() => {
    const savedUser = localStorage.getItem('usim_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setIsLoggedIn(true)
        setUserRole(user.role || 'user')
        setCurrentUser(user)
      } catch (e) {
        setIsLoggedIn(true)
        setUserRole('user')
        setCurrentUser(null)
      }
    } else {
      window.location.href = '/login'
      return
    }
    setIsLoading(false)
  }, [])

  // Fetch orders from API
  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders()
    }
  }, [isLoggedIn, userRole])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        let ordersData = await response.json()

        // Filter orders based on user role
        if (userRole !== 'admin' && currentUser) {
          // Regular users only see their own orders
          ordersData = ordersData.filter((order: any) => order.userId === currentUser.username)
        }

        setOrders(ordersData)
      } else {
        console.error('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      })

      if (response.ok) {
        // Refresh orders list
        await fetchOrders()
      } else {
        console.error('Failed to update order status')
        alert('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng!')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng!')
    }
  }

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'usim_failed': return 'bg-orange-100 text-orange-800'
      case 'usim_login_failed': return 'bg-red-100 text-red-800'
      case 'usim_error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý'
      case 'processing': return 'Đang xử lý'
      case 'completed': return 'Hoàn thành'
      case 'cancelled': return 'Đã hủy'
      case 'failed': return 'Thanh toán thất bại'
      case 'usim_failed': return 'Lỗi USIM'
      case 'usim_login_failed': return 'Lỗi đăng nhập USIM'
      case 'usim_error': return 'Lỗi hệ thống USIM'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-red-600">Chưa đăng nhập. Đang chuyển hướng...</p>
        </div>
      </div>
    )
  }

  // Allow both admin and regular users to access, but show different content

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 bg-white p-4 rounded-lg shadow">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              {userRole === 'admin' ? 'All Orders' : 'My Orders'}
            </h1>
            <p className="text-gray-600 text-sm">
              {userRole === 'admin' ? 'View and manage all orders' : 'View your order history'}
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <a
              href="/countries"
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-all duration-200"
            >
              ← Back
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded">
                <span className="text-lg">⏳</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Chờ xử lý</p>
                <p className="text-lg font-bold text-gray-800">{orders.filter(o => o.status === 'pending').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded">
                <span className="text-lg">🔄</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Đang xử lý</p>
                <p className="text-lg font-bold text-gray-800">{orders.filter(o => o.status === 'processing').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded">
                <span className="text-lg">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Hoàn thành</p>
                <p className="text-lg font-bold text-gray-800">{orders.filter(o => o.status === 'completed').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded">
                <span className="text-lg">❌</span>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Lỗi</p>
                <p className="text-lg font-bold text-gray-800">
                  {orders.filter(o => ['failed', 'usim_failed', 'usim_login_failed', 'usim_error'].includes(o.status)).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-semibold text-gray-700">Lọc theo trạng thái:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
              <option value="failed">Thanh toán thất bại</option>
              <option value="usim_failed">Lỗi USIM</option>
              <option value="usim_login_failed">Lỗi đăng nhập USIM</option>
              <option value="usim_error">Lỗi hệ thống USIM</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
          <table className="table-auto w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn hàng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đặt</th>
                {userRole === 'admin' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">{order.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={order.productName}>
                    {order.productName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{order.quantity || 1}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                    ${order.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  {userRole === 'admin' && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 text-xs">View Details</button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No orders found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}