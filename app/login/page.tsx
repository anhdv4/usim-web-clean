'use client'

import { useState, useEffect } from 'react'

const LoginForm = ({ onLogin }: { onLogin: (email: string, password: string, captcha: string) => void }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [error, setError] = useState('')
  const [captchaText, setCaptchaText] = useState('')

  useEffect(() => {
    console.log('Login component mounted, generating captcha')
    generateCaptcha()
  }, [])

  useEffect(() => {
    console.log('Captcha text updated:', captchaText)
  }, [captchaText])

  const generateCaptcha = () => {
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let result = ''
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      console.log('Generated captcha:', result)
      setCaptchaText(result)
    } catch (error) {
      console.error('Error generating captcha:', error)
      setCaptchaText('ERROR')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password && captcha) {
      if (captcha.toLowerCase() === captchaText.toLowerCase()) {
        onLogin(email, password, captcha)
      } else {
        setError('Mã captcha không đúng')
        generateCaptcha()
      }
    } else {
      setError('Vui lòng nhập đầy đủ thông tin')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-20 h-20 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-16 h-16 bg-indigo-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-purple-500 rounded-full opacity-20 animate-pulse delay-500"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header with Branding */}
        <div className="text-center">
          {/* Logo */}
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-300">
            <span className="text-3xl">📱</span>
          </div>

          {/* Brand Name */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">
              TELEBOX
            </h1>
            <h2 className="text-xl font-semibold text-blue-200 mb-1">
              Sim Du Lịch Toàn Cầu
            </h2>
            <p className="text-sm text-blue-300">
              🌍 Kết nối mọi nơi trên thế giới
            </p>
          </div>

          {/* Login Title */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-2">
              Đăng nhập hệ thống
            </h3>
            <p className="text-blue-200 text-sm">
              Truy cập vào hệ thống quản lý SIM du lịch
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                👤 Tên đăng nhập
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Nhập tên đăng nhập của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <span className="text-lg">👤</span>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                🔒 Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <span className="text-lg">🔑</span>
                </div>
              </div>
            </div>

            {/* Captcha Field */}
            <div>
              <label htmlFor="captcha" className="block text-sm font-semibold text-gray-700 mb-2">
                🛡️ Mã xác minh
              </label>
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    id="captcha"
                    name="captcha"
                    type="text"
                    required
                    className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Nhập mã captcha"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <span className="text-lg">🔒</span>
                  </div>
                </div>
                <div
                  className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl text-lg font-mono font-bold text-gray-900 cursor-pointer hover:from-gray-200 hover:to-gray-300 transition-all duration-200 shadow-md border-2 border-gray-300 select-none"
                  onClick={generateCaptcha}
                  title="Click để tạo mã mới"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    letterSpacing: '2px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  {captchaText || 'ABC123'}
                </div>
              </div>
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

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg"
            >
              🚀 Đăng nhập ngay
            </button>
          </form>

          {/* Demo Credentials & Registration */}
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">🔑 Tài khoản demo:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Admin:</strong> admin / admin123</p>
                <p><strong>User:</strong> user / user123</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600">
                Chưa có tài khoản?{' '}
                <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                  Đăng ký ngay
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <p className="text-blue-200 text-sm font-medium">
              TELEBOX - Sim Du Lịch Toàn Cầu
            </p>
            <p className="text-blue-300 text-xs mt-1">
              © 2024 - Kết nối mọi nơi, mọi lúc
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const handleLogin = (username: string, password: string, captcha: string) => {
    // Trim and convert to lowercase for case-insensitive comparison
    const cleanUsername = username.trim().toLowerCase()
    const cleanPassword = password.trim()

    // Check for super admin login (highest privileges)
    if (cleanUsername === 'superadmin' && cleanPassword === 'super123') {
      localStorage.setItem('usim_user', JSON.stringify({
        username: 'superadmin',
        role: 'admin'
      }))
      localStorage.setItem('user_superadmin', JSON.stringify({
        username: 'superadmin',
        password: 'super123',
        role: 'admin'
      }))
      window.location.href = '/countries'
      return
    }

    // Check for admin login
    if (cleanUsername === 'admin' && cleanPassword === 'admin123') {
      localStorage.setItem('usim_user', JSON.stringify({
        username: 'admin',
        role: 'admin'
      }))
      localStorage.setItem('user_admin', JSON.stringify({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      }))
      window.location.href = '/countries'
      return
    }

    // Check for user login
    if (cleanUsername === 'user' && cleanPassword === 'user123') {
      localStorage.setItem('usim_user', JSON.stringify({
        username: 'user',
        role: 'user'
      }))
      localStorage.setItem('user_user', JSON.stringify({
        username: 'user',
        password: 'user123',
        role: 'user'
      }))
      window.location.href = '/countries'
      return
    }

    // Check stored credentials for custom users
    const userCredentials = localStorage.getItem(`user_${cleanUsername}`)
    if (userCredentials) {
      const user = JSON.parse(userCredentials)
      if (user.password === cleanPassword) {
        localStorage.setItem('usim_user', JSON.stringify({
          username: user.username,
          role: user.role
        }))
        window.location.href = '/countries'
        return
      }
    }

    alert(`Username: "${username}" - Password: "${password}" - Incorrect!`)
  }

  return <LoginForm onLogin={handleLogin} />
}