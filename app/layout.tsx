import type { Metadata } from 'next'
import './globals.css'
import Navigation from './components/Navigation'

export const metadata: Metadata = {
  title: 'Sim Du Lịch Toàn Cầu - Hệ thống đặt hàng',
  description: 'Hệ thống đặt hàng Sim Du Lịch Toàn Cầu',
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
            <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
              <div className="text-lg font-semibold text-gray-800">Sim Du Lịch Toàn Cầu - Console</div>
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