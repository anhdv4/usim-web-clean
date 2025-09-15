'use client'

import { useState, useEffect } from 'react'

// PayPal type declarations
declare global {
  interface Window {
    paypal?: any
  }
}

interface Product {
  id: string
  type: 'esim' | 'usim' | 'alls'
  country: string
  name: string
  price: number
  code: string
  duration: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchCountry, setSearchCountry] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchDuration, setSearchDuration] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [orderType, setOrderType] = useState<'esim' | 'usim'>('esim')
  const [isBulkOrder, setIsBulkOrder] = useState(false)
  const [orderEmail, setOrderEmail] = useState('')
  const [orderIccid, setOrderIccid] = useState('')
  const [orderId, setOrderId] = useState('')
  const [qrCodeData, setQrCodeData] = useState('')
  const [paymentUrl, setPaymentUrl] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'payos' | 'paypal'>('payos')
  const [paypalOrderId, setPaypalOrderId] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Check authentication on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('usim_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setIsLoggedIn(true)
        setCurrentUser(user)
      } catch (error) {
        window.location.href = '/login'
        return
      }
    } else {
      window.location.href = '/login'
      return
    }
    setIsLoading(false)
  }, [])

  // Read country from URL query parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const countryParam = urlParams.get('country')
      if (countryParam) {
        setSearchCountry(countryParam)
      }
    }
  }, [])

  // Load PayPal SDK and render buttons when PayPal order is created
  useEffect(() => {
    if (paypalOrderId && showPaymentModal && paymentMethod === 'paypal') {
      // Load PayPal SDK if not already loaded
      if (!window.paypal) {
        const script = document.createElement('script')
        script.src = `https://www.paypal.com/sdk/js?client-id=ARvMhCqmKmADF8lE1oc_qex-ztX6MWN3QIJMLEzno2k7QtMyKGaTU71BBHEkD7YYb3XsBFh3WO0qZhm2&currency=USD&intent=capture`
        script.async = true
        script.onload = () => renderPayPalButtons()
        document.head.appendChild(script)
      } else {
        renderPayPalButtons()
      }
    }
  }, [paypalOrderId, showPaymentModal, paymentMethod])

  const renderPayPalButtons = () => {
    if (!window.paypal || !paypalOrderId) return

    const container = document.getElementById('paypal-button-container')
    if (!container) return

    // Clear existing buttons
    container.innerHTML = ''

    window.paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return paypalOrderId
      },
      onApprove: async (data: any, actions: any) => {
        try {
          // Capture the payment
          const captureResponse = await fetch('/api/paypal/capture', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paypalOrderId: data.orderID,
              orderId: `paypal-${data.orderID}`
            }),
          })

          const captureResult = await captureResponse.json()

          if (captureResult.success) {
            // Payment successful - redirect to success page
            window.location.href = `/payment/success?method=paypal&orderId=${data.orderID}`
          } else {
            alert('Payment failed. Please try again.')
          }
        } catch (error) {
          console.error('PayPal capture error:', error)
          alert('Payment processing failed. Please try again.')
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err)
        alert('PayPal payment failed. Please try again.')
      }
    }).render('#paypal-button-container')
  }

  // Function to parse duration from product name
  const parseDuration = (name: string): number => {
    const match = name.match(/(\d+)day/)
    return match ? parseInt(match[1]) : 1 // Default to 1 day if not found
  }

  // Fetch products
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      fetch('/api/data')
        .then(res => res.json())
        .then(data => {
          // Transform data to match usim.vn format
          const transformedProducts: Product[] = data.map((item: any, index: number) => {
            const itemText = item[0].toLowerCase()
            let productType: 'esim' | 'usim' | 'alls' = 'alls' // Default to 'alls' to show both options

            // Check if product supports both esim and usim
            if (itemText.includes('esim') && itemText.includes('usim')) {
              productType = 'alls'
            } else if (itemText.includes('esim')) {
              productType = 'esim'
            } else if (itemText.includes('usim')) {
              productType = 'usim'
            }
            // Keep 'alls' as default for products that don't specify

            const productName = item[2]
            const duration = parseDuration(productName)

            return {
              id: index.toString(),
              type: productType,
              country: item[1].replace(/[^\x00-\x7F]+/g, '').trim(),
              name: productName,
              price: parseFloat(item[3]) * 1.15,
              code: `PROD-${index}`,
              duration: duration
            }
          })
          setProducts(transformedProducts)
          setFilteredProducts(transformedProducts)
        })
    }
  }, [isLoggedIn, isLoading])

  // Filter products
  useEffect(() => {
    let filtered = products

    if (searchCountry && searchCountry !== '') {
      filtered = filtered.filter(product => product.country.toLowerCase().includes(searchCountry.toLowerCase()))
    }

    if (searchName && searchName !== '') {
      filtered = filtered.filter(product => product.name.toLowerCase().includes(searchName.toLowerCase()))
    }

    if (searchDuration && searchDuration !== '') {
      filtered = filtered.filter(product => product.duration === parseInt(searchDuration))
    }

    setFilteredProducts(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [products, searchCountry, searchName, searchDuration])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSearch = () => {
    setCurrentPage(1)
  }

  const handleOrder = (product: Product, orderType: 'esim' | 'usim', isBulk: boolean) => {
    setSelectedProduct(product)
    setOrderType(orderType)
    setIsBulkOrder(isBulk)
    setShowOrderModal(true)
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProduct) return

    if (orderType === 'esim' && !orderEmail) {
      alert('Vui lòng nhập email!')
      return
    }

    if (orderType === 'usim' && !orderIccid) {
      alert('Vui lòng nhập ICCID!')
      return
    }

    try {
      const orderData: any = {
        productName: selectedProduct.name,
        country: selectedProduct.country,
        price: selectedProduct.price,
        priceVND: selectedProduct.price * 27000,
        simType: orderType,
        contactInfo: orderType === 'esim' ? `Email: ${orderEmail}` : `ICCID: ${orderIccid}`,
        paymentMethod: paymentMethod,
        userId: currentUser?.username || 'unknown'
      }

      if (paymentMethod === 'payos') {
        // PayOS payment flow
        const qrResponse = await fetch('/api/generate-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: selectedProduct.price * 27000, // Convert to VND
            orderId: `temp-${Date.now()}`, // Temporary ID for QR generation
            description: `Thanh toán đơn hàng ${selectedProduct.name}`
          }),
        })

        if (!qrResponse.ok) {
          throw new Error('Failed to generate payment QR code')
        }

        const qrResult = await qrResponse.json()

        orderData.paymentId = qrResult.paymentId
        orderData.orderCode = parseInt(qrResult.paymentId.replace('PAY-', '').slice(-10))

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        })

        if (response.ok) {
          const result = await response.json()

          console.log('QR Code result:', qrResult)
          console.log('Order result:', result)

          // Show payment modal with QR code
          setQrCodeData(qrResult.qrCode)
          setPaymentUrl(qrResult.paymentUrl)
          setPaymentAmount(orderData.priceVND)
          setOrderId(result.orderId)

          // Close order modal and show payment modal
          setShowOrderModal(false)
          setShowPaymentModal(true)
        } else {
          throw new Error('Failed to submit order')
        }
      } else if (paymentMethod === 'paypal') {
        // PayPal payment flow - create order and show PayPal buttons
        const paypalResponse = await fetch('/api/paypal/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: selectedProduct.price,
            orderId: `temp-${Date.now()}`,
            description: `Payment for ${selectedProduct.name}`,
            currency: 'USD'
          }),
        })

        if (!paypalResponse.ok) {
          throw new Error('Failed to create PayPal payment')
        }

        const paypalResult = await paypalResponse.json()

        orderData.paypalOrderId = paypalResult.paypalOrderId

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        })

        if (response.ok) {
          const result = await response.json()

          console.log('PayPal result:', paypalResult)
          console.log('Order result:', result)

          // Show PayPal buttons instead of redirecting
          setPaypalOrderId(paypalResult.paypalOrderId)
          setShowOrderModal(false)
          setShowPaymentModal(true)
        } else {
          throw new Error('Failed to submit order')
        }
      }
    } catch (error) {
      console.error('Order submission error:', error)
      alert('Có lỗi xảy ra khi gửi đơn hàng. Vui lòng thử lại!')
    }
  }

  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setQrCodeData('')
    setPaymentUrl('')
    setPaymentAmount(0)
    setOrderId('')
    setOrderEmail('')
    setOrderIccid('')
    setSelectedProduct(null)
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
                <span className="text-gray-700 hover:text-blue-600">Product List</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Search Form */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <form className="flex flex-col lg:flex-row gap-4" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Country:</label>
            <select
              value={searchCountry}
              onChange={(e) => setSearchCountry(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="New Zealand">New Zealand</option>
              <option value="Mexico">Mexico</option>
              <option value="Canada">Canada</option>
              <option value="Brazil">Brazil</option>
              <option value="Australia">Australia</option>
              <option value="Cambodia">Cambodia</option>
              <option value="Laos">Laos</option>
              <option value="Guam">Guam</option>
              <option value="HongKong">HongKong</option>
              <option value="Europe">Europe</option>
              <option value="USA">USA</option>
              <option value="Indonesia">Indonesia</option>
              <option value="Taiwan">Taiwan</option>
              <option value="VietNam">VietNam</option>
              <option value="Philippines">Philippines</option>
              <option value="Malaysia">Malaysia</option>
              <option value="Singapore">Singapore</option>
              <option value="China">China</option>
              <option value="Japan">Japan</option>
              <option value="Korea">Korea</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Duration:</label>
            <select
              value={searchDuration}
              onChange={(e) => setSearchDuration(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="1">1 Day</option>
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Package:</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search product name"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            Search
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VNĐ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Operations</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.type === 'esim' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.country}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{product.duration} Day{product.duration > 1 ? 's' : ''}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{(product.price * 27000000).toLocaleString()} VNĐ</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {(product.type === 'esim' || product.type === 'alls') && (
                    <>
                      <button
                        onClick={() => handleOrder(product, 'esim', false)}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Esim Single
                      </button>
                      <button
                        onClick={() => handleOrder(product, 'esim', true)}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Esim Bulk
                      </button>
                    </>
                  )}
                  {(product.type === 'usim' || product.type === 'alls') && (
                    <>
                      <button
                        onClick={() => handleOrder(product, 'usim', false)}
                        className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                      >
                        Usim Single
                      </button>
                      <button
                        onClick={() => handleOrder(product, 'usim', true)}
                        className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                      >
                        Usim Bulk
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
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

      {/* Order Modal */}
      {showOrderModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Ordering {isBulkOrder ? 'bulk' : 'single'} {orderType} for {selectedProduct.name}
                </h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Order Details</h4>
                  <p className="text-sm text-blue-700 mb-1">Product: {selectedProduct.name}</p>
                  <p className="text-sm text-blue-700 mb-1">Country: {selectedProduct.country}</p>
                  <p className="text-sm text-blue-700 mb-1">Type: {orderType.toUpperCase()}</p>
                  <p className="text-sm text-blue-700 mb-1">Order Type: {isBulkOrder ? 'Bulk' : 'Single'}</p>
                  <p className="text-sm text-blue-700 font-bold">Price: ${selectedProduct.price.toFixed(2)} (${(selectedProduct.price * 27000).toLocaleString()} VND)</p>
                </div>
              </div>

              <form onSubmit={handleOrderSubmit}>
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="payos"
                        checked={paymentMethod === 'payos'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'payos' | 'paypal')}
                        className="mr-2"
                      />
                      <span className="text-sm">🇻🇳 PayOS (Vietnamese Banking)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'payos' | 'paypal')}
                        className="mr-2"
                      />
                      <span className="text-sm">💳 PayPal (International)</span>
                    </label>
                  </div>
                </div>

                {orderType === 'esim' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={orderEmail}
                      onChange={(e) => setOrderEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email for eSIM delivery"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">eSIM will be sent to this email address</p>
                  </div>
                )}

                {orderType === 'usim' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ICCID Number</label>
                    <input
                      type="text"
                      value={orderIccid}
                      onChange={(e) => setOrderIccid(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter ICCID for physical SIM"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">ICCID of the physical SIM card</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-xl transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl transition-all duration-200"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {paymentMethod === 'paypal' ? '💳 PayPal Payment' : '💳 Payment'}
                </h3>
                <button
                  onClick={closePaymentModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Order Created Successfully!</h4>
                  <p className="text-sm text-green-700 mb-1">Order ID: <strong>{orderId}</strong></p>
                  <p className="text-sm text-green-700 mb-1">Product: {selectedProduct?.name}</p>
                  <p className="text-sm text-green-700">
                    Amount: <strong>
                      {paymentMethod === 'paypal'
                        ? `$${selectedProduct?.price.toFixed(2)}`
                        : `${paymentAmount.toLocaleString()} VND`
                      }
                    </strong>
                  </p>
                </div>
              </div>

              {paymentMethod === 'payos' && (
                <>
                  <div className="mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                      <h4 className="font-semibold text-green-800 mb-3 text-center">✅ Order Created Successfully!</h4>
                      <div className="text-center mb-4">
                        <p className="text-sm text-green-700 mb-3">
                          Your order has been saved. Please complete payment using one of the methods below.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h5 className="font-semibold text-blue-800 mb-3 text-center">💳 Payment Methods</h5>

                    {/* Bank Transfer */}
                    <div className="mb-4 p-3 bg-white rounded border">
                      <h6 className="font-medium text-gray-800 mb-2">🏦 Bank Transfer (Recommended)</h6>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><strong>Bank:</strong> [Your Bank Name]</p>
                        <p><strong>Account Number:</strong> [Your Account Number]</p>
                        <p><strong>Account Holder:</strong> [Your Name]</p>
                        <p><strong>Amount:</strong> {paymentAmount.toLocaleString()} VND</p>
                        <p><strong>Content:</strong> {orderId}</p>
                      </div>
                      <button
                        onClick={() => {
                          const paymentInfo = `Bank Transfer Details:\nAmount: ${paymentAmount.toLocaleString()} VND\nOrder ID: ${orderId}\nContent: ${orderId}`
                          navigator.clipboard.writeText(paymentInfo)
                          alert('Payment details copied to clipboard!')
                        }}
                        className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        📋 Copy Payment Info
                      </button>
                    </div>

                    {/* MoMo/ZaloPay */}
                    <div className="mb-4 p-3 bg-white rounded border">
                      <h6 className="font-medium text-gray-800 mb-2">📱 E-wallet (MoMo/ZaloPay)</h6>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><strong>Phone Number:</strong> [Your Phone Number]</p>
                        <p><strong>Amount:</strong> {paymentAmount.toLocaleString()} VND</p>
                        <p><strong>Message:</strong> {orderId}</p>
                      </div>
                      <button
                        onClick={() => {
                          const paymentInfo = `E-wallet Payment:\nAmount: ${paymentAmount.toLocaleString()} VND\nOrder ID: ${orderId}`
                          navigator.clipboard.writeText(paymentInfo)
                          alert('Payment details copied to clipboard!')
                        }}
                        className="mt-2 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                      >
                        📋 Copy Payment Info
                      </button>
                    </div>

                    {/* Contact Info */}
                    <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                      <h6 className="font-medium text-yellow-800 mb-2">📞 Contact for Payment Confirmation</h6>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <p><strong>WhatsApp/Phone:</strong> [Your Contact Number]</p>
                        <p><strong>Email:</strong> [Your Email]</p>
                        <p className="text-xs mt-2">
                          After payment, send screenshot/receipt to the contact above with Order ID: <strong>{orderId}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h5 className="font-semibold text-gray-800 mb-2">📋 Order Summary</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Order ID:</strong> {orderId}</p>
                      <p><strong>Product:</strong> {selectedProduct?.name}</p>
                      <p><strong>Amount:</strong> {paymentAmount.toLocaleString()} VND</p>
                      <p><strong>Status:</strong> <span className="text-orange-600 font-medium">Pending Payment</span></p>
                      <p className="text-xs text-gray-600 mt-2">
                        Order will be processed after payment confirmation.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {paymentMethod === 'paypal' && paypalOrderId && (
                <div className="mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-3 text-center">💳 PayPal Payment</h4>
                    <div className="text-center mb-4">
                      <p className="text-sm text-blue-700 mb-3">Click the PayPal button below to complete your payment</p>
                      <div id="paypal-button-container" className="max-w-xs mx-auto"></div>
                    </div>
                    <div className="text-xs text-blue-600 text-center">
                      <p>🔒 Secure payment powered by PayPal</p>
                      <p>Your payment information is protected</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={closePaymentModal}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md font-semibold"
                >
                  ✅ Complete
                </button>
                <button
                  onClick={() => {
                    closePaymentModal()
                    window.location.href = '/orders'
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md font-semibold"
                >
                  📋 View Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}