'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface OrderDetails {
  orderId: string
  amount: string
  method: string
  timestamp: string
  status: 'processing' | 'completed' | 'pending'
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const method = searchParams.get('method')
      const orderId = searchParams.get('orderId')
      const paypalOrderId = searchParams.get('token') // PayPal order ID

      // Set order details
      setOrderDetails({
        orderId: orderId || 'Unknown',
        amount: 'Processing...', // Will be updated
        method: method || 'Unknown',
        timestamp: new Date().toLocaleString('vi-VN'),
        status: 'processing'
      })

      if (method === 'paypal' && paypalOrderId) {
        try {
          // Capture PayPal payment
          const response = await fetch('/api/paypal/capture', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paypalOrderId,
              orderId
            }),
          })

          const result = await response.json()

          if (result.success) {
            setStatus('success')
            setMessage('🎉 Thanh toán PayPal thành công! Đơn hàng của bạn đang được xử lý.')
            setOrderDetails(prev => prev ? {
              ...prev,
              amount: result.amount || prev.amount,
              status: 'processing'
            } : null)
            setShowConfetti(true)
          } else {
            setStatus('error')
            setMessage('❌ Thanh toán PayPal thất bại. Vui lòng liên hệ hỗ trợ.')
          }
        } catch (error) {
          setStatus('error')
          setMessage('❌ Lỗi xử lý thanh toán PayPal. Vui lòng liên hệ hỗ trợ.')
        }
      } else if (method === 'payos') {
        // PayOS payment success
        setStatus('success')
        setMessage('🎉 Thanh toán PayOS thành công! Đơn hàng của bạn đang được xử lý.')
        setOrderDetails(prev => prev ? {
          ...prev,
          status: 'processing'
        } : null)
        setShowConfetti(true)
      } else {
        setStatus('success')
        setMessage('🎉 Thanh toán thành công!')
        setShowConfetti(true)
      }
    }

    handlePaymentSuccess()
  }, [searchParams])

  // Hide confetti after 3 seconds
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showConfetti])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl animate-bounce">🎉</div>
            </div>
          </div>
        )}

        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600"></div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Đang xử lý thanh toán</h2>
              <p className="text-gray-600 text-lg">Vui lòng đợi trong giây lát...</p>
              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">Chúng tôi đang xác nhận thanh toán của bạn</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Thanh toán thành công!</h2>
              <p className="text-gray-600 text-lg mb-6">{message}</p>

              {/* Order Details Card */}
              {orderDetails && (
                <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📋</span>
                    Chi tiết đơn hàng
                  </h3>
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã đơn hàng:</span>
                      <span className="font-medium text-gray-900">{orderDetails.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phương thức:</span>
                      <span className="font-medium text-gray-900 capitalize">{orderDetails.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời gian:</span>
                      <span className="font-medium text-gray-900">{orderDetails.timestamp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {orderDetails.status === 'processing' ? 'Đang xử lý' : orderDetails.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Timeline */}
              <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">⏱️</span>
                  Quy trình xử lý
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Thanh toán thành công</p>
                      <p className="text-xs text-gray-500">Đã nhận thanh toán của bạn</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">⏳</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Đang xử lý đơn hàng</p>
                      <p className="text-xs text-gray-500">Kích hoạt eSIM/USIM trên hệ thống</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm">○</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Gửi thông tin kích hoạt</p>
                      <p className="text-xs text-gray-500">Email với hướng dẫn sử dụng</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-3">📧</span>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Thông báo qua email</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Bạn sẽ nhận được email xác nhận đơn hàng và hướng dẫn kích hoạt trong vòng 5-10 phút.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/orders'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  📋 Xem đơn hàng của tôi
                </button>
                <button
                  onClick={() => window.location.href = '/products'}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  🛒 Tiếp tục mua sắm
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200"
                >
                  🏠 Về trang chủ
                </button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">❌</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Lỗi thanh toán</h2>
              <p className="text-gray-600 text-lg mb-6">{message}</p>

              <div className="bg-red-50 p-4 rounded-lg mb-6 border border-red-200">
                <div className="flex items-start">
                  <span className="text-red-600 mr-3">⚠️</span>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Cần hỗ trợ?</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Vui lòng liên hệ bộ phận hỗ trợ để được giải quyết vấn đề.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/products'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  🔄 Thử lại
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200"
                >
                  🏠 Về trang chủ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}