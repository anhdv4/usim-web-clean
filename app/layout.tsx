import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from './components/ClientLayout'

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
    <html lang="vi">
      <body className="min-h-screen bg-gray-50">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}