import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Users store file
const usersFile = path.join(process.cwd(), 'users.json')

// Load users from file
function loadUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading users:', error)
  }

  // Default users
  const defaultUsers = [
    {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      email: 'admin@usim.vn'
    },
    {
      username: 'user',
      password: 'user123',
      role: 'user',
      email: 'user@usim.vn'
    },
    {
      username: 'superadmin',
      password: 'super123',
      role: 'admin',
      email: 'superadmin@usim.vn'
    }
  ]

  saveUsers(defaultUsers)
  return defaultUsers
}

// Save users to file
function saveUsers(users: any[]) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('Error saving users:', error)
  }
}

// Global users store (for runtime)
declare global {
  var usersStore: any[]
}

if (!global.usersStore) {
  global.usersStore = loadUsers()
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
    const newUser = {
      username: cleanUsername,
      password: password.trim(),
      role: role || 'user',
      email: email.trim()
    }

    global.usersStore.push(newUser)
    saveUsers(global.usersStore)

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