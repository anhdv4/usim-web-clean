'use client'

import { useState, useEffect } from 'react'

interface Order {
  id: string
  productName: string
  country: string
  duration: number
  price: number
  priceVND: number
  simType: 'esim' | 'physical'
  contactInfo: string
  orderDate: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  paymentId?: string
  orderCode?: number
}

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  todayOrders: number
  todayRevenue: number
  topCountries: { country: string; count: number; revenue: number }[]
  recentOrders: Order[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
    topCountries: [],
    recentOrders: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [filteredStats, setFilteredStats] = useState<DashboardStats | null>(null)
  const [allOrders, setAllOrders] = useState<Order[]>([])

  useEffect(() => {
    // Check authentication
    const savedUser = localStorage.getItem('usim_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setIsLoggedIn(true)
        setUserRole(user.role || 'user')

        // Only admin can access dashboard
        if (user.role !== 'admin') {
          window.location.href = '/countries'
          return
        }
      } catch (error) {
        window.location.href = '/login'
        return
      }
    } else {
      window.location.href = '/login'
      return
    }

    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/orders')
      const orders: Order[] = await response.json()
      setAllOrders(orders)

      // Calculate statistics for all data
      calculateStats(orders)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (orders: Order[]) => {
    // Calculate statistics
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.priceVND, 0)
    const pendingOrders = orders.filter(order => order.status === 'pending').length
    const completedOrders = orders.filter(order => order.status === 'completed').length

    // Today's statistics
    const today = new Date().toDateString()
    const todayOrdersData = orders.filter(order =>
      new Date(order.orderDate).toDateString() === today
    )
    const todayOrders = todayOrdersData.length
    const todayRevenue = todayOrdersData.reduce((sum, order) => sum + order.priceVND, 0)

    // Top countries
    const countryStats = orders.reduce((acc, order) => {
      const country = order.country
      if (!acc[country]) {
        acc[country] = { count: 0, revenue: 0 }
      }
      acc[country].count++
      acc[country].revenue += order.priceVND
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    const topCountries = Object.entries(countryStats)
      .map(([country, data]) => ({ country, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Recent orders (last 10)
    const recentOrders = orders
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 10)

    const newStats = {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      todayOrders,
      todayRevenue,
      topCountries,
      recentOrders
    }

    setStats(newStats)
    return newStats
  }

  const filterByDate = (date: string) => {
    if (!date) {
      setFilteredStats(null)
      return
    }

    const selectedDate = new Date(date).toDateString()
    const filteredOrders = allOrders.filter(order =>
      new Date(order.orderDate).toDateString() === selectedDate
    )

    const filteredStats = calculateStats(filteredOrders)
    setFilteredStats(filteredStats)
  }

  const filterByDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
      setFilteredStats(null)
      return
    }

    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()

    const filteredOrders = allOrders.filter(order => {
      const orderDate = new Date(order.orderDate).getTime()
      return orderDate >= start && orderDate <= end
    })

    const filteredStats = calculateStats(filteredOrders)
    setFilteredStats(filteredStats)
  }

  const clearFilters = () => {
    setSelectedDate('')
    setDateRange({ startDate: '', endDate: '' })
    setFilteredStats(null)
  }

  // Use filtered stats if available, otherwise use main stats
  const displayStats = filteredStats || stats

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu báo cáo...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Truy cập bị từ chối</h1>
          <p className="text-gray-600 mb-4">Chỉ quản trị viên mới có thể truy cập trang này</p>
          <a href="/countries" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg">
            Quay lại
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-lg">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 Báo cáo tổng quan</h1>
            <p className="text-gray-600">Thống kê chi tiết về đơn hàng và doanh thu</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={loadDashboardData}
              className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md"
            >
              🔄 Làm mới
            </button>
          </div>
        </div>

        {/* Date Filters - Google AdWords Style */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Thời gian:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => {
                      const newRange = { ...dateRange, startDate: e.target.value }
                      setDateRange(newRange)
                      if (newRange.startDate && newRange.endDate) {
                        filterByDateRange(newRange.startDate, newRange.endDate)
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">→</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => {
                      const newRange = { ...dateRange, endDate: e.target.value }
                      setDateRange(newRange)
                      if (newRange.startDate && newRange.endDate) {
                        filterByDateRange(newRange.startDate, newRange.endDate)
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Single Date Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Ngày cụ thể:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    filterByDate(e.target.value)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter Status */}
              {filteredStats && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-md">
                  <span className="text-xs text-blue-700 font-medium">
                    Đã lọc: {displayStats.totalOrders} đơn hàng
                  </span>
                </div>
              )}

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                <p className="text-3xl font-bold text-gray-900">{displayStats.totalOrders}</p>
                {filteredStats && (
                  <p className="text-xs text-blue-600 mt-1">Đã lọc</p>
                )}
              </div>
              <div className="text-blue-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(displayStats.totalRevenue)}</p>
                {filteredStats && (
                  <p className="text-xs text-green-600 mt-1">Đã lọc</p>
                )}
              </div>
              <div className="text-green-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đơn chờ xử lý</p>
                <p className="text-3xl font-bold text-gray-900">{displayStats.pendingOrders}</p>
                {filteredStats && (
                  <p className="text-xs text-yellow-600 mt-1">Đã lọc</p>
                )}
              </div>
              <div className="text-yellow-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đơn hoàn thành</p>
                <p className="text-3xl font-bold text-gray-900">{displayStats.completedOrders}</p>
                {filteredStats && (
                  <p className="text-xs text-purple-600 mt-1">Đã lọc</p>
                )}
              </div>
              <div className="text-purple-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Performance */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📈 Hiệu suất {filteredStats ? 'đã lọc' : 'hôm nay'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Đơn hàng {filteredStats ? 'trong khoảng' : 'hôm nay'}
              </h3>
              <p className="text-3xl font-bold text-blue-600">{displayStats.todayOrders}</p>
              <p className="text-sm text-blue-600 mt-1">đơn hàng {filteredStats ? 'đã lọc' : 'mới'}</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Doanh thu {filteredStats ? 'trong khoảng' : 'hôm nay'}
              </h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(displayStats.todayRevenue)}</p>
              <p className="text-sm text-green-600 mt-1">tổng thu nhập</p>
            </div>
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🌍 Top quốc gia theo doanh thu {filteredStats ? '(đã lọc)' : ''}
          </h2>
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Quốc gia</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Số đơn</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Doanh thu</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayStats.topCountries.map((country, index) => (
                  <tr key={country.country} className={`hover:bg-indigo-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{country.country}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{country.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{formatCurrency(country.revenue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {displayStats.totalRevenue > 0 ? ((country.revenue / displayStats.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📋 Đơn hàng {filteredStats ? 'đã lọc' : 'gần đây'}
          </h2>
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead className="bg-gradient-to-r from-teal-600 to-cyan-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Mã đơn</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Quốc gia</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Giá</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayStats.recentOrders.map((order, index) => (
                  <tr key={order.id} className={`hover:bg-teal-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.country}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{formatCurrency(order.priceVND)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'completed' ? 'Hoàn thành' :
                         order.status === 'pending' ? 'Chờ xử lý' :
                         order.status === 'processing' ? 'Đang xử lý' :
                         'Đã hủy'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(order.orderDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}