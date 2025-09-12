'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [settingsName, setSettingsName] = useState('')
  const [settingsPassword, setSettingsPassword] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    // Check authentication status
    const savedUser = localStorage.getItem('usim_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setIsLoggedIn(true)
        setUserRole(user.role || 'user')
        setUserEmail(user.email || user.username || 'user@usim.vn')
      } catch (e) {
        setIsLoggedIn(true)
        setUserRole(savedUser === 'admin' ? 'admin' : 'user')
        setUserEmail('user@usim.vn')
      }
    }

  }, [])

  const handleLogout = () => {
    localStorage.removeItem('usim_user')
    setIsLoggedIn(false)
    setUserRole('')
    window.location.href = '/login'
  }

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your API
    alert(`Settings updated!\nName: ${settingsName}\nPassword: ${settingsPassword ? 'Changed' : 'Not changed'}`)
    setShowSettingsModal(false)
    setSettingsName('')
    setSettingsPassword('')
  }

  const openSettingsModal = () => {
    setShowSettingsModal(true)
    setShowUserMenu(false)
  }

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null
  }

  if (!isLoggedIn) {
    return (
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">Globe Link Data Card</h1>
        </div>
        <div className="flex-1 p-4">
          <Link
            href="/login"
            className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-center"
          >
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">Globe Link Data Card</h1>
      </div>


      {/* Navigation Menu */}
      <div className="flex-1 p-4">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Workspace</h2>
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                className={`block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors ${
                  pathname === '/' ? 'bg-blue-600' : ''
                }`}
              >
                🏠 Homepage
              </Link>
            </li>
            <li>
              <Link
                href="/products"
                className={`block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors ${
                  pathname === '/products' ? 'bg-blue-600' : ''
                }`}
              >
                🛒 Product Center
              </Link>
            </li>
            <li>
              <Link
                href="/orders"
                className={`block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors ${
                  pathname === '/orders' ? 'bg-blue-600' : ''
                }`}
              >
                📋 My Orders
              </Link>
            </li>
            <li>
              <Link
                href="/wallet"
                className={`block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors ${
                  pathname === '/wallet' ? 'bg-blue-600' : ''
                }`}
              >
                💰 Wallet Transactions
              </Link>
            </li>
            {userRole === 'admin' && (
              <>
                <li>
                  <Link
                    href="/users"
                    className={`block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors ${
                      pathname === '/users' ? 'bg-blue-600' : ''
                    }`}
                  >
                    👥 Users
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* User Menu */}
      <div className="p-4 border-t border-gray-700">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-700 rounded"
          >
            <span>{userEmail}</span>
            <svg className="ml-auto w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {showUserMenu && (
            <div className="absolute bottom-full left-0 w-full mb-1 bg-gray-700 rounded shadow-lg">
              <button
                onClick={openSettingsModal}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-600"
              >
                Account Settings
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-600 text-red-400"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Account Settings</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSettingsSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account:</label>
                  <input
                    type="text"
                    value={userEmail}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nickname:</label>
                  <input
                    type="text"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    placeholder="Enter nickname"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password:</label>
                  <input
                    type="password"
                    value={settingsPassword}
                    onChange={(e) => setSettingsPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Confirm Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}