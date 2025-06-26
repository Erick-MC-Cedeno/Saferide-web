import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Allowed image formats
const ALLOWED_FORMATS = ["image/png", "image/jpeg", "image/jpg"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
const MAX_BASE64_SIZE = 7 * 1024 * 1024 // ~5MB image becomes ~7MB in base64

// Utility function to validate image format
function isValidImageFormat(mimeType: string): boolean {
  return ALLOWED_FORMATS.includes(mimeType.toLowerCase())
}

// Utility function to convert file to base64 using arrayBuffer (more reliable)
async function fileToBase64(file: File): Promise<string> {
  try {
    console.log("🔄 Converting file to base64, size:", file.size, "type:", file.type)

    // Use arrayBuffer method which is more reliable
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    // Convert to base64
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    // Create data URL
    const dataUrl = `data:${file.type};base64,${base64}`

    console.log("✅ Base64 conversion successful, length:", dataUrl.length)
    return dataUrl
  } catch (error) {
    console.error("❌ Base64 conversion failed:", error)
    throw new Error("Failed to convert file to base64")
  }
}

// Utility function to validate base64 image
function validateBase64Image(base64String: string): { isValid: boolean; format?: string; size?: number } {
  try {
    // Check if it's a valid base64 data URL
    if (!base64String.startsWith("data:image/")) {
      console.log("❌ Invalid data URL format")
      return { isValid: false }
    }

    // Extract format from data URL
    const formatMatch = base64String.match(/^data:image\/([a-zA-Z]+);base64,/)
    if (!formatMatch) {
      console.log("❌ Could not extract format from data URL")
      return { isValid: false }
    }

    const format = formatMatch[1].toLowerCase()

    // Validate format
    if (!["png", "jpeg", "jpg"].includes(format)) {
      console.log("❌ Invalid image format:", format)
      return { isValid: false }
    }

    // Calculate approximate size
    const base64Data = base64String.split(",")[1]
    if (!base64Data) {
      console.log("❌ No base64 data found")
      return { isValid: false }
    }

    const sizeInBytes = (base64Data.length * 3) / 4

    console.log("✅ Base64 validation successful:", { format, size: sizeInBytes })
    return {
      isValid: true,
      format,
      size: sizeInBytes,
    }
  } catch (error) {
    console.error("❌ Base64 validation error:", error)
    return { isValid: false }
  }
}

export async function POST(request: NextRequest) {
  console.log("🚀 Profile image upload API called")

  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const userType = formData.get("userType") as string

    console.log("📝 Form data received:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId: userId ? "present" : "missing",
      userType,
    })

    // Validate required fields
    if (!file) {
      console.log("❌ No file provided")
      return NextResponse.json(
        {
          error: "No file provided",
          code: "MISSING_FILE",
        },
        { status: 400 },
      )
    }

    if (!userId) {
      console.log("❌ No user ID provided")
      return NextResponse.json(
        {
          error: "User ID is required",
          code: "MISSING_USER_ID",
        },
        { status: 400 },
      )
    }

    if (!userType || !["driver", "passenger"].includes(userType)) {
      console.log("❌ Invalid user type:", userType)
      return NextResponse.json(
        {
          error: "Valid user type is required (driver or passenger)",
          code: "INVALID_USER_TYPE",
        },
        { status: 400 },
      )
    }

    // Validate file is actually a File object
    if (!(file instanceof File)) {
      console.log("❌ Invalid file object")
      return NextResponse.json(
        {
          error: "Invalid file format",
          code: "INVALID_FILE_OBJECT",
        },
        { status: 400 },
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log("❌ File too large:", file.size)
      return NextResponse.json(
        {
          error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          code: "FILE_TOO_LARGE",
          maxSize: MAX_FILE_SIZE,
        },
        { status: 400 },
      )
    }

    // Validate file format
    if (!isValidImageFormat(file.type)) {
      console.log("❌ Invalid file format:", file.type)
      return NextResponse.json(
        {
          error: "Only PNG and JPG/JPEG images are allowed",
          code: "INVALID_FORMAT",
          allowedFormats: ["PNG", "JPG", "JPEG"],
        },
        { status: 400 },
      )
    }

    // Additional validation: check file extension
    const fileName = file.name.toLowerCase()
    const validExtensions = [".png", ".jpg", ".jpeg"]
    const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext))

    if (!hasValidExtension) {
      console.log("❌ Invalid file extension:", fileName)
      return NextResponse.json(
        {
          error: "File must have a valid extension (.png, .jpg, .jpeg)",
          code: "INVALID_EXTENSION",
        },
        { status: 400 },
      )
    }

    console.log("✅ File validation passed")

    // Convert file to base64
    let base64String: string
    try {
      base64String = await fileToBase64(file)
    } catch (error) {
      console.error("❌ File conversion error:", error)
      return NextResponse.json(
        {
          error: "Failed to process image file",
          code: "CONVERSION_ERROR",
          details: error instanceof Error ? error.message : "Unknown conversion error",
        },
        { status: 500 },
      )
    }

    // Validate the generated base64
    const validation = validateBase64Image(base64String)
    if (!validation.isValid) {
      console.log("❌ Invalid base64 generated")
      return NextResponse.json(
        {
          error: "Generated image data is invalid",
          code: "INVALID_BASE64",
        },
        { status: 400 },
      )
    }

    // Check base64 size
    if (validation.size && validation.size > MAX_BASE64_SIZE) {
      console.log("❌ Base64 too large:", validation.size)
      return NextResponse.json(
        {
          error: "Processed image is too large",
          code: "PROCESSED_IMAGE_TOO_LARGE",
        },
        { status: 400 },
      )
    }

    console.log("✅ Base64 validation passed")

    // Validate Supabase connection
    if (!supabase) {
      console.log("❌ Supabase not available")
      return NextResponse.json(
        {
          error: "Database connection unavailable",
          code: "DATABASE_UNAVAILABLE",
        },
        { status: 500 },
      )
    }

    // Update user profile in database
    const table = userType === "driver" ? "drivers" : "passengers"
    console.log("🔄 Updating database table:", table)

    try {
      // First, check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from(table)
        .select("uid, name")
        .eq("uid", userId)
        .single()

      if (fetchError) {
        console.error("❌ Database fetch error:", fetchError)
        return NextResponse.json(
          {
            error: "Failed to verify user",
            code: "USER_FETCH_ERROR",
            details: fetchError.message,
          },
          { status: 500 },
        )
      }

      if (!existingUser) {
        console.log("❌ User not found:", userId)
        return NextResponse.json(
          {
            error: "User not found in database",
            code: "USER_NOT_FOUND",
          },
          { status: 404 },
        )
      }

      console.log("✅ User found:", existingUser.name)

      // Update profile image
      const { error: updateError } = await supabase
        .from(table)
        .update({
          profile_image: base64String,
          updated_at: new Date().toISOString(),
        })
        .eq("uid", userId)

      if (updateError) {
        console.error("❌ Database update error:", updateError)
        return NextResponse.json(
          {
            error: "Failed to update profile in database",
            code: "DATABASE_UPDATE_ERROR",
            details: updateError.message,
          },
          { status: 500 },
        )
      }

      console.log("✅ Profile image updated successfully")
    } catch (dbError) {
      console.error("❌ Database operation error:", dbError)
      return NextResponse.json(
        {
          error: "Database operation failed",
          code: "DATABASE_OPERATION_ERROR",
        },
        { status: 500 },
      )
    }

    // Return success response
    console.log("🎉 Upload completed successfully")
    return NextResponse.json({
      success: true,
      message: "Profile image updated successfully",
      imageFormat: validation.format,
      imageSize: validation.size,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Unexpected error in upload API:", error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("FormData")) {
        return NextResponse.json(
          {
            error: "Invalid form data",
            code: "INVALID_FORM_DATA",
          },
          { status: 400 },
        )
      }

      if (error.message.includes("JSON")) {
        return NextResponse.json(
          {
            error: "Invalid JSON data",
            code: "INVALID_JSON",
          },
          { status: 400 },
        )
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error occurred",
        code: "INTERNAL_ERROR",
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}
