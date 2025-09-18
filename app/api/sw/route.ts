import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'sw.js')
    const content = await fs.promises.readFile(filePath, 'utf8')
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    })
  } catch {
    return new NextResponse('/* sw not found */', { status: 404, headers: { 'Content-Type': 'application/javascript' } })
  }
}
