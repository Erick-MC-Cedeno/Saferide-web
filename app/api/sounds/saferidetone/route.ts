import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.resolve(process.cwd(), "assets", "saferidetone.mp3")
    const data = await fs.promises.readFile(filePath)
    const base64 = data.toString("base64")
    return NextResponse.json({ base64 }, { status: 200 })
  } catch (err) {
    console.error("Could not read saferidetone.mp3:", err)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
