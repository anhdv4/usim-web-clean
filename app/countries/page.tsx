'use client'

import { useState, useEffect } from 'react'

export default function CountriesPage() {
  const [data, setData] = useState<any[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // Always call this useEffect
  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('usim_user')
      if (savedUser) {
        setIsLoggedIn(true)
      } else {
        window.location.href = '/login'
        return
      }
      setAuthChecked(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [])


  // Always call this useEffect
  useEffect(() => {
    const fetchData = async () => {
      if (authChecked && isLoggedIn && !isLoading) {
        try {
          const res = await fetch('/api/data')
          const jsonData = await res.json()
          setData(jsonData)
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
    }

    fetchData()
  }, [authChecked, isLoggedIn, isLoading])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    )
  }

  // Show loading if not authenticated (shouldn't reach here due to redirect)
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


  const uniqueCountries = Array.from(new Set(data.map(item => item[1].replace(/[^\x00-\x7F]+/g, '').trim()))).sort()

  const getFlagUrl = (country: string) => {
    const flagMap: { [key: string]: string } = {
      'Australia': 'au',
      'Canada': 'ca',
      'China': 'cn',
      'France': 'fr',
      'Germany': 'de',
      'Hong Kong': 'hk',
      'Indonesia': 'id',
      'Italy': 'it',
      'Japan': 'jp',
      'Korea': 'kr',
      'Malaysia': 'my',
      'Philippines': 'ph',
      'Singapore': 'sg',
      'Spain': 'es',
      'Taiwan': 'tw',
      'Thailand': 'th',
      'United Kingdom': 'gb',
      'United States': 'us',
      'Vietnam': 'vn',
      'Viet Nam': 'vn',
      'VietNam': 'vn',
      'Laos': 'la',
      'Cambodia': 'kh',
      'Europe': 'eu',
      'Europe(42countries)': 'eu',
      'Guam': 'gu',
      'Saipan': 'mp',
      'Macao': 'mo',
      'Macau': 'mo',
      'HongKong': 'hk'
    }
    const code = flagMap[country] || 'us'
    return `https://flagcdn.com/w40/${code}.png`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Main Content */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 drop-shadow-sm">🌍 Select Your Country</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Choose a country to explore available SIM card products and services</p>
          <div className="mt-4 text-sm text-gray-500 bg-gray-100 inline-block px-3 py-1 rounded-full">
            🚀 Deployed: {new Date().toLocaleString('vi-VN')}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {uniqueCountries.map((country, index) => {
            const countryParts = country.split('/');
            return (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:scale-102 flex flex-col items-center border border-gray-100 group"
                onClick={() => {
                  // Navigate to products page with selected country
                  window.location.href = `/products?country=${encodeURIComponent(country)}`
                }}
              >
                <div className="flex mb-4 space-x-1 justify-center">
                  {countryParts.map((part: string, i: number) => (
                    <img
                      key={i}
                      src={getFlagUrl(part.trim())}
                      alt={`${part.trim()} flag`}
                      className="w-12 h-8 rounded-md shadow-sm border border-gray-200 group-hover:border-blue-300 transition-all duration-300"
                    />
                  ))}
                </div>
                <h2 className="text-lg font-bold text-gray-800 text-center leading-tight group-hover:text-blue-600 transition-colors duration-300">{country}</h2>
                <div className="mt-3 w-8 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}