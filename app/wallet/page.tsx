'use client'

import { useState, useEffect } from 'react'

interface Transaction {
  id: string
  g_name: string
  order: string
  message: string
  money: number
  total: number
  add_time: string
  type: 1 | 2 // 1 = Income, 2 = Disburse
}

export default function WalletPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchCode, setSearchCode] = useState('')
  const [searchOrder, setSearchOrder] = useState('')
  const [searchType, setSearchType] = useState('')
  const [searchMessage, setSearchMessage] = useState('')
  const [searchMoney, setSearchMoney] = useState('')
  const [searchTotal, setSearchTotal] = useState('')
  const [searchTime, setSearchTime] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  // Check authentication on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('usim_user')
    if (savedUser) {
      setIsLoggedIn(true)
    } else {
      window.location.href = '/login'
      return
    }
    setIsLoading(false)
  }, [])

  // Mock data for demonstration
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          g_name: '【Canada加拿大】10day / 1GB Daily+Unlimited 512Kbps (Bell / Telus / Sasktel)',
          order: 'ORD-001',
          message: 'Product purchase',
          money: 5.99,
          total: 94.01,
          add_time: '2024-01-15 10:30:00',
          type: 2
        },
        {
          id: '2',
          g_name: '【Australia澳大利亚】10day / 2GB Daily+Unlimited 512Kbps (Optus / Telstra)',
          order: 'ORD-002',
          message: 'Product purchase',
          money: 7.99,
          total: 86.02,
          add_time: '2024-01-14 15:45:00',
          type: 2
        },
        {
          id: '3',
          g_name: 'Commission received',
          order: 'COM-001',
          message: 'Affiliate commission',
          money: 2.50,
          total: 88.52,
          add_time: '2024-01-13 09:20:00',
          type: 1
        }
      ]
      setTransactions(mockTransactions)
      setFilteredTransactions(mockTransactions)
    }
  }, [isLoggedIn, isLoading])

  // Filter transactions
  useEffect(() => {
    let filtered = transactions

    if (searchCode && searchCode !== '') {
      filtered = filtered.filter(t => t.g_name.toLowerCase().includes(searchCode.toLowerCase()))
    }

    if (searchOrder && searchOrder !== '') {
      filtered = filtered.filter(t => t.order.toLowerCase().includes(searchOrder.toLowerCase()))
    }

    if (searchType && searchType !== '') {
      filtered = filtered.filter(t => t.type.toString() === searchType)
    }

    if (searchMessage && searchMessage !== '') {
      filtered = filtered.filter(t => t.message.toLowerCase().includes(searchMessage.toLowerCase()))
    }

    if (searchMoney && searchMoney !== '') {
      filtered = filtered.filter(t => t.money.toString().includes(searchMoney))
    }

    if (searchTotal && searchTotal !== '') {
      filtered = filtered.filter(t => t.total.toString().includes(searchTotal))
    }

    setFilteredTransactions(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [transactions, searchCode, searchOrder, searchType, searchMessage, searchMoney, searchTotal])

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSearch = () => {
    setCurrentPage(1)
  }

  const handleClear = () => {
    setSearchCode('')
    setSearchOrder('')
    setSearchType('')
    setSearchMessage('')
    setSearchMoney('')
    setSearchTotal('')
    setSearchTime('')
    setCurrentPage(1)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-red-600">Not logged in. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <span className="text-gray-700 hover:text-blue-600">Workspace</span>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="text-gray-700 hover:text-blue-600">Wallet Bill</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Search Form */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <form className="flex flex-wrap gap-4" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Package:</label>
            <select
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ALL</option>
              <option value="canada">Canada packages</option>
              <option value="australia">Australia packages</option>
              <option value="commission">Commission</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Order No:</label>
            <input
              type="text"
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search order number"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Bill Type:</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ALL</option>
              <option value="1">Income</option>
              <option value="2">Disburse</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Transaction Details:</label>
            <input
              type="text"
              value={searchMessage}
              onChange={(e) => setSearchMessage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search transaction details"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Amount(USD):</label>
            <input
              type="text"
              value={searchMoney}
              onChange={(e) => setSearchMoney(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search amount"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Account Balance:</label>
            <input
              type="text"
              value={searchTotal}
              onChange={(e) => setSearchTotal(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search balance"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Time:</label>
            <input
              type="text"
              value={searchTime}
              onChange={(e) => setSearchTime(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="YYYY-MM-DD - YYYY-MM-DD"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              Search
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear Options
            </button>
          </div>
        </form>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount(USD)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Balance(USD)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={transaction.g_name}>
                  {transaction.g_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{transaction.order}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{transaction.message}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {transaction.type === 1 ? (
                    <span className="text-green-600 font-bold">+ ${transaction.money.toFixed(2)}</span>
                  ) : (
                    <span className="text-pink-600 font-bold">- ${transaction.money.toFixed(2)}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${transaction.total.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.add_time}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No relevant wallet data available at the moment</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}