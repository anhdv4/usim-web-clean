'use client'

import { useState, useEffect } from 'react'

interface Affiliate {
  id: string
  email: string
  name: string
  rebate: number
  status: 1 | 2 | 3 // 1 = Normal, 2 = Disabled, 3 = Cancelled
  wallet: number
  add_time: string
  isadd: 1 | 2 // 1 = Allow, 2 = Not Allow
  token: string
  fid: number
}

export default function AffiliatePage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [filteredAffiliates, setFilteredAffiliates] = useState<Affiliate[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchStatus, setSearchStatus] = useState('')
  const [searchSuperior, setSearchSuperior] = useState('')
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
      const mockAffiliates: Affiliate[] = [
        {
          id: '1',
          email: 'affiliate1@example.com',
          name: 'Affiliate One',
          rebate: 5,
          status: 1,
          wallet: 150.50,
          add_time: '2024-01-10 14:30:00',
          isadd: 1,
          token: 'token123',
          fid: 98
        },
        {
          id: '2',
          email: 'affiliate2@example.com',
          name: 'Affiliate Two',
          rebate: 10,
          status: 2,
          wallet: 75.25,
          add_time: '2024-01-08 09:15:00',
          isadd: 2,
          token: 'token456',
          fid: 98
        },
        {
          id: '3',
          email: 'subaffiliate@example.com',
          name: 'Sub Affiliate',
          rebate: 3,
          status: 1,
          wallet: 25.00,
          add_time: '2024-01-05 16:45:00',
          isadd: 1,
          token: '',
          fid: 1
        }
      ]
      setAffiliates(mockAffiliates)
      setFilteredAffiliates(mockAffiliates)
    }
  }, [isLoggedIn, isLoading])

  // Filter affiliates
  useEffect(() => {
    let filtered = affiliates

    if (searchEmail && searchEmail !== '') {
      filtered = filtered.filter(a => a.email.toLowerCase().includes(searchEmail.toLowerCase()))
    }

    if (searchName && searchName !== '') {
      filtered = filtered.filter(a => a.name.toLowerCase().includes(searchName.toLowerCase()))
    }

    if (searchStatus && searchStatus !== '') {
      filtered = filtered.filter(a => a.status.toString() === searchStatus)
    }

    if (searchSuperior && searchSuperior !== '') {
      filtered = filtered.filter(a => a.fid.toString() === searchSuperior)
    }

    setFilteredAffiliates(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [affiliates, searchEmail, searchName, searchStatus, searchSuperior])

  // Pagination
  const totalPages = Math.ceil(filteredAffiliates.length / pageSize)
  const paginatedAffiliates = filteredAffiliates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSearch = () => {
    setCurrentPage(1)
  }

  const handleClear = () => {
    setSearchEmail('')
    setSearchName('')
    setSearchStatus('')
    setSearchSuperior('')
    setCurrentPage(1)
  }

  const handleWalletBill = (affiliate: Affiliate) => {
    alert(`Viewing wallet bills for ${affiliate.name}`)
    // Implement wallet bill modal
  }

  const handleAddUser = () => {
    alert('Add new affiliate user')
    // Implement add user modal
  }

  const handleModifyUser = (affiliate: Affiliate) => {
    alert(`Modify user ${affiliate.name}`)
    // Implement modify user modal
  }

  const handleWalletOperation = (affiliate: Affiliate) => {
    alert(`Wallet operation for ${affiliate.name}`)
    // Implement wallet operation modal
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Normal'
      case 2: return 'Disabled'
      case 3: return 'Cancelled'
      default: return 'Unknown'
    }
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'text-green-600'
      case 2: return 'text-pink-600'
      case 3: return 'text-pink-600'
      default: return 'text-gray-600'
    }
  }

  const getIsAddText = (isadd: number) => {
    switch (isadd) {
      case 1: return 'Allow'
      case 2: return 'Not Allow'
      default: return 'Unknown'
    }
  }

  const getIsAddColor = (isadd: number) => {
    switch (isadd) {
      case 1: return 'text-green-600'
      case 2: return 'text-pink-600'
      default: return 'text-gray-600'
    }
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
                <span className="text-gray-700 hover:text-blue-600">Affiliate Account</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Search Form */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <form className="flex flex-wrap gap-4" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Email:</label>
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search email"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Nickname:</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search nickname"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="1">Normal</option>
              <option value="2">Disabled</option>
              <option value="3">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Superior:</label>
            <select
              value={searchSuperior}
              onChange={(e) => setSearchSuperior(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">My all subordinates</option>
              <option value="98">Main Account</option>
              <option value="1">Affiliate One</option>
            </select>
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
              Reset
            </button>
            <button
              type="button"
              onClick={handleAddUser}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Add User
            </button>
          </div>
        </form>
      </div>

      {/* Affiliates Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nickname</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Create Sub Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedAffiliates.map((affiliate) => (
              <tr key={affiliate.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{affiliate.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{affiliate.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{affiliate.rebate}%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${getStatusColor(affiliate.status)}`}>
                    {getStatusText(affiliate.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleWalletBill(affiliate)}
                    className="text-blue-600 hover:text-blue-900 underline"
                  >
                    ${affiliate.wallet.toFixed(2)}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{affiliate.add_time}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${getIsAddColor(affiliate.isadd)}`}>
                    {getIsAddText(affiliate.isadd)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {affiliate.fid === 98 ? affiliate.token : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {affiliate.fid === 98 ? (
                    <>
                      <button
                        onClick={() => handleModifyUser(affiliate)}
                        className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                      >
                        Modify
                      </button>
                      <button
                        onClick={() => handleWalletOperation(affiliate)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Wallet
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        disabled
                        className="px-3 py-1 bg-gray-400 text-white text-xs rounded cursor-not-allowed"
                      >
                        Modify
                      </button>
                      <button
                        disabled
                        className="px-3 py-1 bg-gray-400 text-white text-xs rounded cursor-not-allowed"
                      >
                        Wallet
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedAffiliates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No relevant data available</p>
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