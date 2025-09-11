'use client'

import { useState, useEffect } from 'react'

const LoginForm = ({ onLogin }: { onLogin: (email: string, password: string, captcha: string) => void }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [error, setError] = useState('')
  const [captchaText, setCaptchaText] = useState('')

  useEffect(() => {
    generateCaptcha()
  }, [])

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(result)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Globe Link Data Card - Order System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Login
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex">
              <input
                id="captcha"
                name="captcha"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Verification Code"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
              />
              <div className="ml-2 flex items-center">
                <div className="bg-gray-200 px-3 py-2 rounded text-lg font-mono cursor-pointer" onClick={generateCaptcha}>
                  {captchaText}
                </div>
              </div>
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
              Login
            </button>
          </div>
        </form>
        <div className="text-center text-white">
          <p>環球鏈數據(香港)有限公司</p>
          <p>Globe Link Data(HK)co.,Limited</p>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const handleLogin = (email: string, password: string, captcha: string) => {
    // Trim and convert to lowercase for case-insensitive comparison
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()

    // Check for super admin login (highest privileges)
    if (cleanEmail === 'superadmin@usim.vn' && cleanPassword === 'super123') {
      localStorage.setItem('usim_user', JSON.stringify({
        email: 'superadmin@usim.vn',
        role: 'admin'
      }))
      localStorage.setItem('user_superadmin', JSON.stringify({
        email: 'superadmin@usim.vn',
        password: 'super123',
        role: 'admin'
      }))
      window.location.href = '/countries'
      return
    }

    // Check for admin login
    if (cleanEmail === 'admin@usim.vn' && cleanPassword === 'admin123') {
      localStorage.setItem('usim_user', JSON.stringify({
        email: 'admin@usim.vn',
        role: 'admin'
      }))
      localStorage.setItem('user_admin', JSON.stringify({
        email: 'admin@usim.vn',
        password: 'admin123',
        role: 'admin'
      }))
      window.location.href = '/countries'
      return
    }

    // Check for user login
    if (cleanEmail === 'user@usim.vn' && cleanPassword === 'user123') {
      localStorage.setItem('usim_user', JSON.stringify({
        email: 'user@usim.vn',
        role: 'user'
      }))
      localStorage.setItem('user_user', JSON.stringify({
        email: 'user@usim.vn',
        password: 'user123',
        role: 'user'
      }))
      window.location.href = '/countries'
      return
    }

    // Check stored credentials for custom users
    const userCredentials = localStorage.getItem(`user_${cleanEmail}`)
    if (userCredentials) {
      const user = JSON.parse(userCredentials)
      if (user.password === cleanPassword) {
        localStorage.setItem('usim_user', JSON.stringify({
          email: user.email,
          role: user.role
        }))
        window.location.href = '/countries'
        return
      }
    }

    alert(`Email: "${email}" - Password: "${password}" - Incorrect!`)
  }

  return <LoginForm onLogin={handleLogin} />
}