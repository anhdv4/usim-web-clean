'use client'

import { useState, useEffect } from 'react'

// Simple authentication component
const LoginPage = ({ onLogin }: { onLogin: (username: string, password: string) => void }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username && password) {
      onLogin(username, password)
    } else {
      setError('Vui lòng nhập đầy đủ thông tin')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Chỉ dành cho người dùng được ủy quyền
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Tên đăng nhập
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// User Management Modal
const UserManagementModal = ({
  users,
  newUser,
  setNewUser,
  addUser,
  removeUser,
  onClose
}: {
  users: {username: string, password: string, role: string}[],
  newUser: {username: string, password: string, role: string},
  setNewUser: (user: {username: string, password: string, role: string}) => void,
  addUser: () => void,
  removeUser: (username: string) => void,
  onClose: () => void
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-xl">👥</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Quản lý User</h2>
            <p className="text-gray-600 text-sm">Tạo tài khoản cho đại lý</p>
          </div>
        </div>

        {/* Add New User Form */}
        <div className="bg-gray-50 p-6 rounded-xl mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Thêm User Mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="agent">Agent (Đại lý)</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            onClick={addUser}
            className="mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            ➕ Thêm User
          </button>
        </div>

        {/* User List */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Danh sách User</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {users.map((user, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{user.username}</div>
                  <div className="text-sm text-gray-500">Role: {user.role}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                  {user.username !== 'admin' && (
                    <button
                      onClick={() => removeUser(user.username)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl transition-all duration-200 font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

// Cart Modal Component
const CartModal = ({
  cart,
  updateQuantity,
  removeFromCart,
  clearCart,
  onClose,
  onCheckout
}: {
  cart: any[],
  updateQuantity: (id: string, quantity: number) => void,
  removeFromCart: (id: string) => void,
  clearCart: () => void,
  onClose: () => void,
  onCheckout: () => void
}) => {
  const total = cart.reduce((sum, item) => {
    const price = parseFloat(item[3]) * 27000
    return sum + (price * item.quantity)
  }, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-xl">🛒</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Giỏ hàng của bạn</h2>
            <p className="text-gray-600 text-sm">{cart.length} sản phẩm</p>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Giỏ hàng trống</h3>
            <p className="text-gray-500">Hãy thêm sản phẩm vào giỏ hàng</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart.map((item) => {
                const price = parseFloat(item[3]) * 27000
                const subtotal = price * item.quantity

                return (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{item[2]}</h4>
                        <p className="text-sm text-gray-600">
                          Loại: {item.cartType === 'esim' ? 'eSIM' : 'Sim Vật Lý'} |
                          Giá: {price.toLocaleString()} VND |
                          Thời hạn: {item[5]} ngày
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600"
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right min-w-[100px]">
                          <p className="font-bold text-green-600">{subtotal.toLocaleString()} VND</p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Cart Summary */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Tổng cộng</h3>
                  <p className="text-sm text-gray-600">{cart.length} sản phẩm</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{total.toLocaleString()} VND</p>
                  <p className="text-sm text-gray-500">Đã bao gồm VAT</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between space-x-4">
              <div className="flex space-x-3">
                <button
                  onClick={clearCart}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl transition-all duration-200 font-semibold"
                >
                  🗑️ Xóa tất cả
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl transition-all duration-200 font-semibold"
                >
                  Tiếp tục mua sắm
                </button>
              </div>

              <button
                onClick={onCheckout}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-8 rounded-xl transition-all duration-200 font-semibold transform hover:scale-105 shadow-lg"
              >
                💳 Thanh toán ({total.toLocaleString()} VND)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  // Authentication state - moved to top
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<string>('')

  // BIDV VietQR Configuration
  const bankConfig = {
    accountNumber: '8864555896',
    bankName: 'BIDV',
    accountHolder: 'DAO VIET ANH',
    bankCode: 'BIDV',
    qrTemplate: '00020101021238540010A00000072701240006970418011088645558960208QRIBFTTA53037045405100005802VN63040517',
  }

  // Generate QR data with dynamic amount
  const generateQrData = (amount: number) => {
    const amountStr = Math.round(amount).toString()
    const amountLength = amountStr.length.toString().padStart(2, '0')
    const amountField = `54${amountLength}${amountStr}`
    return bankConfig.qrTemplate.replace('540510000', amountField)
  }

  const [data, setData] = useState<any[]>([])
  const [selectedCountry, setSelectedCountry] = useState('')
  const [searchDays, setSearchDays] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: ''
  })
  const [showPayment, setShowPayment] = useState(false)
  const [currentQrData, setCurrentQrData] = useState<string>('')
  const [cart, setCart] = useState<any[]>([])
  const [showCart, setShowCart] = useState(false)
  const [quantities, setQuantities] = useState<{[key: string]: number}>({})

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('usim_user')
    if (savedUser) {
      setIsLoggedIn(true)
      setUser(savedUser)
    }
  }, [])

  // User management system
  const [users, setUsers] = useState<{username: string, password: string, role: string}[]>([
    { username: 'admin', password: 'admin123', role: 'admin' }
  ])
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'agent' })

  // Load users from localStorage
  useEffect(() => {
    const savedUsers = localStorage.getItem('usim_users')
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers))
    }
  }, [])

  // Save users to localStorage
  const saveUsers = (userList: {username: string, password: string, role: string}[]) => {
    localStorage.setItem('usim_users', JSON.stringify(userList))
    setUsers(userList)
  }

  // Simple authentication with user database
  const handleLogin = (username: string, password: string) => {
    const foundUser = users.find(u => u.username === username && u.password === password)
    if (foundUser) {
      setIsLoggedIn(true)
      setUser(username)
      localStorage.setItem('usim_user', username)
      localStorage.setItem('usim_user_role', foundUser.role)
    } else {
      alert('Tên đăng nhập hoặc mật khẩu không đúng!')
    }
  }

  // Add new user
  const addUser = () => {
    if (newUser.username && newUser.password) {
      const updatedUsers = [...users, newUser]
      saveUsers(updatedUsers)
      setNewUser({ username: '', password: '', role: 'agent' })
      alert('Đã thêm user thành công!')
    } else {
      alert('Vui lòng nhập đầy đủ thông tin!')
    }
  }

  // Remove user
  const removeUser = (username: string) => {
    if (username === 'admin') {
      alert('Không thể xóa tài khoản admin!')
      return
    }
    const updatedUsers = users.filter(u => u.username !== username)
    saveUsers(updatedUsers)
    alert('Đã xóa user thành công!')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUser('')
    localStorage.removeItem('usim_user')
    localStorage.removeItem('usim_user_role')
    // Reset all states
    setSelectedCountry('')
    setSearchDays('')
    setShowForm(false)
    setSelectedProduct(null)
    setShowPayment(false)
    setCurrentQrData('')
    setShowUserManagement(false)
  }

  // Check if current user is admin
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('usim_user_role') === 'admin')
    }
  }, [])

  // Cart functions
  const addToCart = (product: any, type: 'esim' | 'physical', quantity: number = 1) => {
    if (quantity <= 0) return

    const cartItem = {
      ...product,
      cartType: type,
      quantity: quantity,
      id: `${product[2]}_${type}_${Date.now()}`
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item =>
        item[2] === product[2] && item.cartType === type
      )

      if (existingItem) {
        return prevCart.map(item =>
          item[2] === product[2] && item.cartType === type
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        return [...prevCart, cartItem]
      }
    })

    alert(`Đã thêm ${quantity} x ${product[2]} (${type === 'esim' ? 'eSIM' : 'Sim Vật Lý'}) vào giỏ hàng!`)
  }

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item[3]) * 27000
      return total + (price * item.quantity)
    }, 0)
  }

  const clearCart = () => {
    setCart([])
  }

  // Product quantity management (for adding to cart)
  const getProductQuantity = (productId: string, type: string) => {
    return quantities[`${productId}_${type}`] || 1
  }

  const updateProductQuantity = (productId: string, type: string, newQuantity: number) => {
    if (newQuantity < 1) newQuantity = 1
    if (newQuantity > 99) newQuantity = 99 // Max 99 items

    setQuantities(prev => ({
      ...prev,
      [`${productId}_${type}`]: newQuantity
    }))
  }

  const incrementProductQuantity = (productId: string, type: string) => {
    const current = getProductQuantity(productId, type)
    updateProductQuantity(productId, type, current + 1)
  }

  const decrementProductQuantity = (productId: string, type: string) => {
    const current = getProductQuantity(productId, type)
    if (current > 1) {
      updateProductQuantity(productId, type, current - 1)
    }
  }

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [])

  // Generate QR when payment modal opens
  useEffect(() => {
    const generateQrForPayment = async () => {
      if (showPayment && selectedProduct && !currentQrData) {
        // Try API first, fallback to original QR
        const qrData = await generateVietQr(Math.round(parseFloat(selectedProduct[3]) * 27000))
        setCurrentQrData(qrData || bankConfig.qrTemplate)
      }
    }
    generateQrForPayment()
  }, [showPayment, selectedProduct, currentQrData])

  const uniqueCountries = Array.from(new Set(data.map(item => item[1].replace(/[^\x00-\x7F]+/g, '').trim()))).sort()

  // VietQR API Integration with real credentials
  const generateVietQr = async (amount: number) => {
    try {
      const response = await fetch('https://api.vietqr.io/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 9b443b3a-18b7-417e-a15b-9fdf0db9d0c5',
          'x-client-id': '851d88da-09cb-47b6-8934-0da9166568b7'
        },
        body: JSON.stringify({
          bank: 'BIDV',
          account: '8864555896',
          amount: amount,
          description: `Thanh toan SIM - ${selectedProduct?.[2]}`,
          template: 'compact'
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('VietQR API Response:', data)
        return data.qrData || data.qr_string || data.qr
      } else {
        console.log('VietQR API Error:', response.status, response.statusText)
      }
    } catch (error) {
      console.log('VietQR API failed:', error)
    }

    // Fallback to local generation
    console.log('Using fallback QR generation')
    return generateQrData(amount)
  }

  const getFlagUrl = (country: string) => {
    const flagMap: { [key: string]: string } = {
      'Australia': 'au',
      'Austria': 'at',
      'Belgium': 'be',
      'Brazil': 'br',
      'Canada': 'ca',
      'China': 'cn',
      'Denmark': 'dk',
      'Europe': 'eu',
      'Europe(42countries)': 'eu',
      'Finland': 'fi',
      'France': 'fr',
      'Guam': 'gu',
      'Germany': 'de',
      'Greece': 'gr',
      'Hong Kong': 'hk',
      'HongKong': 'hk',
      'Hungary': 'hu',
      'Iceland': 'is',
      'India': 'in',
      'Indonesia': 'id',
      'Ireland': 'ie',
      'Israel': 'il',
      'Italy': 'it',
      'Japan': 'jp',
      'Jordan': 'jo',
      'Kenya': 'ke',
      'Korea': 'kr',
      'South Korea': 'kr',
      'Lebanon': 'lb',
      'Luxembourg': 'lu',
      'Macao': 'mo',
      'Macau': 'mo',
      'Malaysia': 'my',
      'Mexico': 'mx',
      'Netherlands': 'nl',
      'New Zealand': 'nz',
      'Norway': 'no',
      'Pakistan': 'pk',
      'Philippines': 'ph',
      'Poland': 'pl',
      'Portugal': 'pt',
      'Romania': 'ro',
      'Russia': 'ru',
      'Saipan': 'mp',
      'Saudi Arabia': 'sa',
      'Singapore': 'sg',
      'South Africa': 'za',
      'Spain': 'es',
      'Sweden': 'se',
      'Switzerland': 'ch',
      'Taiwan': 'tw',
      'Thailand': 'th',
      'Turkey': 'tr',
      'Ukraine': 'ua',
      'United Arab Emirates': 'ae',
      'United Kingdom': 'gb',
      'United States': 'us',
      'Vietnam': 'vn',
      'Viet Nam': 'vn',
      'VietNam': 'vn',
      'Laos': 'la',
      'Cambodia': 'kh',
    }
    const code = flagMap[country] || 'us' // default to US
    return `https://flagcdn.com/w40/${code}.png`
  }

  const countryData = data.filter(item =>
    item[1].replace(/[^\x00-\x7F]+/g, '').trim() === selectedCountry
  )
  const uniqueDays = Array.from(new Set(countryData.map(item => item[5]))).sort((a, b) => a - b)
  const filteredData = searchDays ? countryData.filter(item =>
    item[5].toString() === searchDays
  ) : countryData

  const Modal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-xl">📱</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Order Form</h2>
            <p className="text-gray-600 text-sm">for {selectedProduct?.[2]}</p>
          </div>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault()
          setShowForm(false)
          setShowPayment(true)
          setFormData({ email: '' })
        }}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">✉️ Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setCurrentQrData('')
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 px-6 rounded-xl transition-all duration-200 font-semibold transform hover:scale-105 shadow-lg"
            >
              🚀 Submit Order
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // Always redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
    return null
  }

  return null
}