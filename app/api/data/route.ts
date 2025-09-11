import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'usim_data.json')
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error reading usim_data.json:', error)
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }
}