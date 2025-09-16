import { NextRequest, NextResponse } from 'next/server'

// Global users store (simplified approach)
declare global {
  var usersStore: any[]
}

if (!global.usersStore) {
  global.usersStore = []
  // Add default users
  global.usersStore.push({
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    email: 'admin@usim.vn'
  })
  global.usersStore.push({
    username: 'user',
    password: 'user123',
    role: 'user',
    email: 'user@usim.vn'
  })
  global.usersStore.push({
    username: 'superadmin',
    password: 'super123',
    role: 'admin',
    email: 'superadmin@usim.vn'
  })
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    const cleanUsername = username.trim().toLowerCase()
    const cleanPassword = password.trim()

    // Find user
    const user = global.usersStore.find(u => u.username === cleanUsername && u.password === cleanPassword)

    if (user) {
      return NextResponse.json({
        success: true,
        user: {
          username: user.username,
          role: user.role,
          email: user.email
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Login failed'
    }, { status: 500 })
  }
}

// Add user API
export async function PUT(request: NextRequest) {
  try {
    const { username, password, role, email } = await request.json()

    const cleanUsername = username.trim().toLowerCase()

    // Check if user exists
    const existingUser = global.usersStore.find(u => u.username === cleanUsername)
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists'
      }, { status: 400 })
    }

    // Add user
    global.usersStore.push({
      username: cleanUsername,
      password: password.trim(),
      role: role || 'user',
      email: email.trim()
    })

    return NextResponse.json({
      success: true,
      message: 'User added successfully'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to add user'
    }, { status: 500 })
  }
}