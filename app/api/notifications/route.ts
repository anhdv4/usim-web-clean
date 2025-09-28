import { NextRequest, NextResponse } from 'next/server'

// Global notifications store
declare global {
  var notificationsStore: any[]
}

declare const global: any

if (!global.notificationsStore) {
  global.notificationsStore = []
}

interface Notification {
  id: string
  orderId: string
  type: 'payment_success' | 'order_processing' | 'order_completed' | 'order_failed'
  title: string
  message: string
  timestamp: string
  read: boolean
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (orderId) {
      // Get notifications for specific order
      const orderNotifications = global.notificationsStore.filter(
        (notification: Notification) => notification.orderId === orderId
      )
      return NextResponse.json(orderNotifications)
    }

    // Get all notifications
    return NextResponse.json(global.notificationsStore)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, type, title, message } = body

    if (!orderId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    }

    // Store notification
    global.notificationsStore.push(notification)

    // Keep only last 100 notifications to prevent memory issues
    if (global.notificationsStore.length > 100) {
      global.notificationsStore = global.notificationsStore.slice(-100)
    }

    console.log('New notification created:', notification)

    return NextResponse.json({
      success: true,
      notificationId: notification.id
    })
  } catch (error) {
    console.error('Notification creation error:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    const notificationIndex = global.notificationsStore.findIndex(
      (notification: Notification) => notification.id === notificationId
    )

    if (notificationIndex === -1) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Mark as read
    global.notificationsStore[notificationIndex].read = true

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}