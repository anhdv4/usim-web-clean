'use client'

import { useState, useEffect } from 'react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // Validation
    if (!formData.username || !formData.password || !formData.email) {
      setError('Vui lòng nhập đầy đủ thông tin bắt buộc')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      setIsLoading(false)
      return
    }

    try {
      // Check if user already exists
      const existingUser = localStorage.getItem(`user_${formData.username.trim().toLowerCase()}`)
      if (existingUser) {
        setError('Tên đăng nhập đã tồn tại')
        setIsLoading(false)
        return
      }

      // Create new user
      const userData = {
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
        role: 'user',
        email: formData.email.trim(),
        phone: formData.phone.trim()
      }

      // Store user credentials
      localStorage.setItem(`user_${userData.username}`, JSON.stringify(userData))

      // Add to users list
      let users = JSON.parse(localStorage.getItem('usim_users') || '[]')
      users.push({
        id: Date.now().toString(),
        username: userData.username,
        role: 'user',
        email: userData.email,
        phone: userData.phone,
        createdAt: new Date().toISOString()
      })
      localStorage.setItem('usim_users', JSON.stringify(users))

      setSuccess('Tài khoản đã được tạo thành công! Bạn có thể đăng nhập ngay bây giờ.')

      // Reset form
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: ''
      })

    } catch (error) {
      setError('Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl mb-6">
            <span className="text-3xl">👤</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">Đăng ký tài khoản</h1>
          <p className="text-blue-200">Tạo tài khoản mới để truy cập hệ thống</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👤 Tên đăng nhập *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📧 Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                placeholder="Nhập địa chỉ email"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📱 Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                placeholder="Nhập số điện thoại"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔒 Mật khẩu *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔒 Xác nhận mật khẩu *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <span className="text-red-500 text-lg mr-2">⚠️</span>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-lg mr-2">✅</span>
                  <p className="text-green-700 text-sm font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Đang tạo tài khoản...' : '🚀 Đăng ký ngay'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Đã có tài khoản?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Đăng nhập ngay
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}