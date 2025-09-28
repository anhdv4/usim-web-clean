'use client'

import { useState } from 'react'

export default function TestUsimPage() {
  const [productCode, setProductCode] = useState('test-esim')
  const [customerEmail, setCustomerEmail] = useState('test@example.com')
  const [customerName, setCustomerName] = useState('Test Customer')
  const [isTesting, setIsTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleTest = async () => {
    setIsTesting(true)
    setResult(null)
    setError('')

    try {
      const response = await fetch('/api/test-usim-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productCode,
          customerEmail,
          customerName,
          simulatePayment: true
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Test failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🧪 Test USIM Automation</h1>
          <p className="text-gray-600">Test the automated purchasing system from USIM.VN</p>
        </div>

        {/* Test Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Test Parameters</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Code
              </label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., test-esim"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="customer@example.com"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Customer Name"
            />
          </div>

          <button
            onClick={handleTest}
            disabled={isTesting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
          >
            {isTesting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Testing USIM Automation...
              </>
            ) : (
              <>
                🚀 Test USIM Automation
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-8">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">✅</span>
              <h3 className="text-xl font-semibold text-green-800">Test Successful!</h3>
            </div>

            <div className="space-y-3">
              <p className="text-green-700">{result.message}</p>

              {result.orderId && (
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Order ID:</p>
                  <p className="font-mono text-green-600">{result.orderId}</p>
                </div>
              )}

              {result.esimData && (
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">eSIM Data:</p>
                  <pre className="text-xs text-green-600 whitespace-pre-wrap">{JSON.stringify(result.esimData, null, 2)}</pre>
                </div>
              )}

              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Details:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {Object.entries(result.details).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-sm font-medium text-gray-700">{key}</p>
                      <p className="text-lg">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">❌</span>
              <h3 className="text-xl font-semibold text-red-800">Test Failed</h3>
            </div>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">📋 How to Use</h3>
          <div className="space-y-3 text-blue-700">
            <p>1. <strong>Fill in test parameters:</strong> Product code, customer email, and name</p>
            <p>2. <strong>Click "Test USIM Automation"</strong> to run the test</p>
            <p>3. <strong>Check results:</strong> The system will attempt to login to USIM.VN and place an order</p>
            <p>4. <strong>Monitor console logs</strong> in the terminal for detailed automation steps</p>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">🔍 What This Test Does:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Initializes browser automation</li>
              <li>• Logs into USIM.VN with your credentials</li>
              <li>• Navigates to product center</li>
              <li>• Attempts to place a test order</li>
              <li>• Extracts order information and eSIM data</li>
              <li>• Returns results and closes automation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}