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
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchType, setSearchType] = useState('')
  const [searchCountry, setSearchCountry] = useState('')
  const [searchName, setSearchName] = useState('')
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

            return {
              id: index.toString(),
              type: productType,
              country: item[1].replace(/[^\x00-\x7F]+/g, '').trim(),
              name: item[2],
              price: parseFloat(item[3]) * 1.15,
              code: `PROD-${index}`
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

    if (searchType && searchType !== '') {
      filtered = filtered.filter(product => product.type === searchType)
    }

    if (searchCountry && searchCountry !== '') {
      filtered = filtered.filter(product => product.country.toLowerCase().includes(searchCountry.toLowerCase()))
    }

    if (searchName && searchName !== '') {
      filtered = filtered.filter(product => product.name.toLowerCase().includes(searchName.toLowerCase()))
    }

    setFilteredProducts(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [products, searchType, searchCountry, searchName])

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
        paymentMethod: paymentMethod
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
        <form className="flex flex-wrap gap-4" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Types:</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="esim">esim</option>
              <option value="usim">usim</option>
            </select>
          </div>

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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Price</th>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">${product.price.toFixed(2)}</td>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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

              {paymentMethod === 'payos' && qrCodeData && (
                <>
                  <div className="mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-3 text-center">🔒 Payment QR Code</h4>
                      <div className="flex justify-center mb-4">
                        {qrCodeData ? (
                          <img
                            src={qrCodeData}
                            alt="Payment QR Code"
                            className="w-48 h-48 border-2 border-gray-200 rounded-lg shadow-md"
                          />
                        ) : (
                          <div className="w-48 h-48 border-2 border-gray-200 rounded-lg shadow-md flex items-center justify-center bg-gray-100">
                            <p className="text-gray-500 text-sm">Generating QR Code...</p>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Scan QR code with banking app</p>
                        <p className="text-xs text-gray-500">Supports all Vietnamese banks</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                    <h5 className="font-semibold text-yellow-800 mb-2">📋 Payment Instructions:</h5>
                    <ol className="text-sm text-yellow-700 space-y-1">
                      <li>1. Open your banking app on phone</li>
                      <li>2. Select "Scan QR" feature</li>
                      <li>3. Scan the QR code above</li>
                      <li>4. Confirm and complete payment</li>
                      <li>5. System will automatically update order status</li>
                    </ol>
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