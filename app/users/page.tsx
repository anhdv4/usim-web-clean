'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  role: 'admin' | 'agent' | 'user'
  email?: string
  phone?: string
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user' as 'admin' | 'agent' | 'user',
    email: '',
    phone: ''
  })

  useEffect(() => {
    // Check authentication and role
    const savedUser = localStorage.getItem('usim_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setIsLoggedIn(true)
        setUserRole(user.role || 'user')

        // Only admin can access this page
        if (user.role !== 'admin') {
          window.location.href = '/countries'
          return
        }
      } catch (error) {
        // If JSON is corrupted, clear it and redirect to login
        localStorage.removeItem('usim_user')
        window.location.href = '/login'
        return
      }
    } else {
      window.location.href = '/login'
      return
    }

    setIsLoading(false)
    loadUsers()
  }, [])

  const loadUsers = () => {
    const savedUsers = localStorage.getItem('usim_users')
    let users: User[] = []

    if (savedUsers) {
      users = JSON.parse(savedUsers)
    }

    // Ensure admin user exists
    const adminExists = users.some(user => user.username === 'admin')
    if (!adminExists) {
      const adminUser: User = {
        id: '1',
        username: 'admin',
        role: 'admin',
        email: 'admin@usim.vn',
        phone: '',
        createdAt: new Date().toISOString()
      }
      users = [adminUser, ...users]

      // Store admin credentials
      const adminCredentials = { username: 'admin', password: 'admin123', role: 'admin', email: 'admin@usim.vn' }
      localStorage.setItem('user_admin@usim.vn', JSON.stringify(adminCredentials))
    }

    // Ensure default user exists if no users
    if (users.length === 0 || (users.length === 1 && users[0].username === 'admin')) {
      const defaultUser: User = {
        id: '2',
        username: 'user',
        role: 'user',
        email: 'user@usim.vn',
        phone: '',
        createdAt: new Date().toISOString()
      }
      users.push(defaultUser)

      // Store default user credentials
      const userCredentials = { username: 'user', password: 'user123', role: 'user', email: 'user@usim.vn' }
      localStorage.setItem('user_user@usim.vn', JSON.stringify(userCredentials))
    }

    setUsers(users)
    localStorage.setItem('usim_users', JSON.stringify(users))
  }

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers)
    localStorage.setItem('usim_users', JSON.stringify(updatedUsers))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username || !formData.password || !formData.email) {
      alert('Vui lòng nhập tên đăng nhập, mật khẩu và email')
      return
    }

    if (editingUser) {
      // Update existing user
      const updatedUsers = users.map(user =>
        user.id === editingUser.id
          ? { ...user, ...formData }
          : user
      )
      saveUsers(updatedUsers)

      // Update password if provided
      if (formData.password) {
        const userCredentials = { username: formData.username, password: formData.password, role: formData.role, email: formData.email }
        localStorage.setItem(`user_${formData.email}`, JSON.stringify(userCredentials))
      }

      setEditingUser(null)
    } else {
      // Add new user
      const newUser: User = {
        id: Date.now().toString(),
        username: formData.username,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        createdAt: new Date().toISOString()
      }

      // Store password separately (in real app, this would be hashed)
      const userCredentials = { username: formData.username, password: formData.password, role: formData.role, email: formData.email }
      localStorage.setItem(`user_${formData.email}`, JSON.stringify(userCredentials))

      saveUsers([...users, newUser])
    }

    // Reset form
    setFormData({
      username: '',
      password: '',
      role: 'user',
      email: '',
      phone: ''
    })
    setShowAddForm(false)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '', // Don't show existing password
      role: user.role,
      email: user.email || '',
      phone: user.phone || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = (userId: string, username: string) => {
    if (confirm(`Bạn có chắc muốn xóa người dùng ${username}?`)) {
      const updatedUsers = users.filter(user => user.id !== userId)
      saveUsers(updatedUsers)

      // Find the user to get email
      const userToDelete = users.find(user => user.id === userId)
      if (userToDelete && userToDelete.email) {
        // Remove user credentials
        localStorage.removeItem(`user_${userToDelete.email}`)
      }
    }
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setFormData({
      username: '',
      password: '',
      role: 'user',
      email: '',
      phone: ''
    })
    setShowAddForm(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 bg-white p-6 rounded-2xl shadow-lg">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">👥 Quản lý người dùng</h1>
            <p className="text-gray-600">Quản lý tài khoản đại lý và người dùng hệ thống</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md"
            >
              {showAddForm ? 'Hủy' : '+ Thêm người dùng'}
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mật khẩu {editingUser ? '(để trống nếu không đổi)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                    required={!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vai trò
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'agent' | 'user'})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                  >
                    <option value="user">Người dùng</option>
                    <option value="agent">Đại lý</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  {editingUser ? 'Cập nhật' : 'Thêm người dùng'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
          <table className="table-auto w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Tên đăng nhập</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">SĐT</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user, index) => (
                <tr key={user.id} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'agent' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? 'Quản trị' : user.role === 'agent' ? 'Đại lý' : 'Người dùng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                    >
                      ✏️ Sửa
                    </button>
                    {user.username !== 'admin' && (
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors"
                      >
                        🗑️ Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}