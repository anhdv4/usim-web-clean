import type { Metadata } from 'next'
import './globals.css'
import Navigation from './components/Navigation'

export const metadata: Metadata = {
  title: 'Globe Link Data Card - Order System',
  description: 'Order system for Globe Link Data Card',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          <Navigation />
          <div className="flex-1 flex flex-col">
            {/* Top Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex justify-between items-center">
              <div className="text-lg font-semibold text-gray-800">Globe Link Data Card - Console</div>
              <div className="text-sm text-gray-600">
                {new Date().toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  weekday: 'long'
                })}
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}