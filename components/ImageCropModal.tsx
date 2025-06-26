"use client"

import React, { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Crop,
  Upload,
  X,
  Move,
  Square,
  Circle,
  RefreshCw,
  Eye,
  Settings,
} from "lucide-react"

interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  onCrop: (croppedImageBlob: Blob) => void
  imageFile: File | null
  uploading?: boolean
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

type CropShape = "square" | "circle"
type CropRatio = "1:1" | "4:3" | "16:9" | "free"

export function ImageCropModal({ isOpen, onClose, onCrop, imageFile, uploading = false }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Image states
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 })

  // Transform states
  const [scale, setScale] = useState([1])
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  // Crop states
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 })
  const [cropShape, setCropShape] = useState<CropShape>("square")
  const [cropRatio, setCropRatio] = useState<CropRatio>("1:1")

  // Interaction states
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragMode, setDragMode] = useState<"move" | "resize" | null>(null)

  // UI states
  const [showGrid, setShowGrid] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)

  // Load image when file changes
  React.useEffect(() => {
    if (imageFile && isOpen) {
      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)
      setImageLoaded(false)
      resetTransforms()

      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [imageFile, isOpen])

  // Reset all transforms
  const resetTransforms = () => {
    setScale([1])
    setRotation(0)
    setPosition({ x: 0, y: 0 })
    setCropRatio("1:1")
    setCropShape("square")
  }

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const img = imageRef.current
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight })

      // Set initial crop area (centered)
      const size = Math.min(img.naturalWidth, img.naturalHeight) * 0.6
      setCropArea({
        x: (img.naturalWidth - size) / 2,
        y: (img.naturalHeight - size) / 2,
        width: size,
        height: size,
      })

      setImageLoaded(true)
      drawCanvas()
    }
  }, [])

  // Calculate crop dimensions based on ratio
  const calculateCropDimensions = (ratio: CropRatio, maxWidth: number, maxHeight: number) => {
    let width = maxWidth
    let height = maxHeight

    switch (ratio) {
      case "1:1":
        const squareSize = Math.min(maxWidth, maxHeight)
        width = height = squareSize
        break
      case "4:3":
        if (maxWidth / maxHeight > 4 / 3) {
          width = maxHeight * (4 / 3)
        } else {
          height = maxWidth * (3 / 4)
        }
        break
      case "16:9":
        if (maxWidth / maxHeight > 16 / 9) {
          width = maxHeight * (16 / 9)
        } else {
          height = maxWidth * (9 / 16)
        }
        break
      case "free":
        // Keep current dimensions
        break
    }

    return { width, height }
  }

  // Update crop ratio
  const handleCropRatioChange = (newRatio: CropRatio) => {
    setCropRatio(newRatio)

    if (imageRef.current && newRatio !== "free") {
      const img = imageRef.current
      const { width, height } = calculateCropDimensions(newRatio, img.naturalWidth * 0.8, img.naturalHeight * 0.8)

      setCropArea((prev) => ({
        x: Math.max(0, Math.min(img.naturalWidth - width, prev.x)),
        y: Math.max(0, Math.min(img.naturalHeight - height, prev.y)),
        width,
        height,
      }))
    }
  }

  // Get cursor style based on position
  const getCursorStyle = (
    x: number,
    y: number,
    cropX: number,
    cropY: number,
    cropWidth: number,
    cropHeight: number,
  ) => {
    const handleSize = 12
    const tolerance = handleSize

    // Check corners
    if (Math.abs(x - cropX) <= tolerance && Math.abs(y - cropY) <= tolerance) return "nw-resize"
    if (Math.abs(x - (cropX + cropWidth)) <= tolerance && Math.abs(y - cropY) <= tolerance) return "ne-resize"
    if (Math.abs(x - cropX) <= tolerance && Math.abs(y - (cropY + cropHeight)) <= tolerance) return "sw-resize"
    if (Math.abs(x - (cropX + cropWidth)) <= tolerance && Math.abs(y - (cropY + cropHeight)) <= tolerance)
      return "se-resize"

    // Check edges
    if (Math.abs(x - cropX) <= tolerance && y >= cropY && y <= cropY + cropHeight) return "w-resize"
    if (Math.abs(x - (cropX + cropWidth)) <= tolerance && y >= cropY && y <= cropY + cropHeight) return "e-resize"
    if (Math.abs(y - cropY) <= tolerance && x >= cropX && x <= cropX + cropWidth) return "n-resize"
    if (Math.abs(y - (cropY + cropHeight)) <= tolerance && x >= cropX && x <= cropX + cropWidth) return "s-resize"

    // Check inside crop area
    if (x >= cropX && x <= cropX + cropWidth && y >= cropY && y <= cropY + cropHeight) return "move"

    return "default"
  }

  // Draw canvas with image and crop overlay
  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const img = imageRef.current

    if (!ctx) return

    // Set canvas size
    const displaySize = 500
    canvas.width = displaySize
    canvas.height = displaySize

    // Clear canvas
    ctx.clearRect(0, 0, displaySize, displaySize)

    // Save context
    ctx.save()

    // Apply transformations
    ctx.translate(displaySize / 2, displaySize / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale[0], scale[0])
    ctx.translate(position.x, position.y)

    // Draw image centered
    const imgWidth = img.naturalWidth
    const imgHeight = img.naturalHeight
    const scaleFactor = Math.min(displaySize / imgWidth, displaySize / imgHeight) * 0.8

    ctx.drawImage(
      img,
      (-imgWidth * scaleFactor) / 2,
      (-imgHeight * scaleFactor) / 2,
      imgWidth * scaleFactor,
      imgHeight * scaleFactor,
    )

    // Restore context
    ctx.restore()

    if (!previewMode) {
      // Calculate crop area position on canvas
      const cropX = displaySize / 2 - (imgWidth * scaleFactor) / 2 + cropArea.x * scaleFactor * scale[0]
      const cropY = displaySize / 2 - (imgHeight * scaleFactor) / 2 + cropArea.y * scaleFactor * scale[0]
      const cropWidth = cropArea.width * scaleFactor * scale[0]
      const cropHeight = cropArea.height * scaleFactor * scale[0]

      // Draw semi-transparent overlay everywhere except crop area
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(0, 0, displaySize, displaySize)

      // Clear crop area (make it transparent)
      ctx.save()
      ctx.globalCompositeOperation = "destination-out"

      if (cropShape === "circle") {
        ctx.beginPath()
        ctx.arc(cropX + cropWidth / 2, cropY + cropHeight / 2, Math.min(cropWidth, cropHeight) / 2, 0, 2 * Math.PI)
        ctx.fill()
      } else {
        ctx.fillRect(cropX, cropY, cropWidth, cropHeight)
      }

      ctx.restore()

      // Draw crop border
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2
      ctx.setLineDash([])

      if (cropShape === "circle") {
        ctx.beginPath()
        ctx.arc(cropX + cropWidth / 2, cropY + cropHeight / 2, Math.min(cropWidth, cropHeight) / 2, 0, 2 * Math.PI)
        ctx.stroke()
      } else {
        ctx.strokeRect(cropX, cropY, cropWidth, cropHeight)
      }

      // Draw grid if enabled and square
      if (showGrid && cropShape === "square") {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.4)"
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5])

        // Vertical lines
        for (let i = 1; i < 3; i++) {
          const x = cropX + (cropWidth / 3) * i
          ctx.beginPath()
          ctx.moveTo(x, cropY)
          ctx.lineTo(x, cropY + cropHeight)
          ctx.stroke()
        }

        // Horizontal lines
        for (let i = 1; i < 3; i++) {
          const y = cropY + (cropHeight / 3) * i
          ctx.beginPath()
          ctx.moveTo(cropX, y)
          ctx.lineTo(cropX + cropWidth, y)
          ctx.stroke()
        }
      }

      // Draw resize handles for square crop
      if (cropShape === "square") {
        const handleSize = 10
        ctx.fillStyle = "#3b82f6"
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.setLineDash([])

        const handles = [
          { x: cropX - handleSize / 2, y: cropY - handleSize / 2 }, // top-left
          { x: cropX + cropWidth - handleSize / 2, y: cropY - handleSize / 2 }, // top-right
          { x: cropX - handleSize / 2, y: cropY + cropHeight - handleSize / 2 }, // bottom-left
          { x: cropX + cropWidth - handleSize / 2, y: cropY + cropHeight - handleSize / 2 }, // bottom-right
          { x: cropX + cropWidth / 2 - handleSize / 2, y: cropY - handleSize / 2 }, // top-center
          { x: cropX + cropWidth / 2 - handleSize / 2, y: cropY + cropHeight - handleSize / 2 }, // bottom-center
          { x: cropX - handleSize / 2, y: cropY + cropHeight / 2 - handleSize / 2 }, // left-center
          { x: cropX + cropWidth - handleSize / 2, y: cropY + cropHeight / 2 - handleSize / 2 }, // right-center
        ]

        handles.forEach((handle) => {
          ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
          ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
        })
      }

      // Draw center point for circle
      if (cropShape === "circle") {
        ctx.fillStyle = "#3b82f6"
        ctx.beginPath()
        ctx.arc(cropX + cropWidth / 2, cropY + cropHeight / 2, 3, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }, [imageLoaded, scale, rotation, position, cropArea, cropShape, showGrid, previewMode])

  // Redraw canvas when parameters change
  React.useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || previewMode || !imageRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate crop area position on canvas
    const img = imageRef.current
    const displaySize = 500
    const scaleFactor = Math.min(displaySize / img.naturalWidth, displaySize / img.naturalHeight) * 0.8
    const cropX = displaySize / 2 - (img.naturalWidth * scaleFactor) / 2 + cropArea.x * scaleFactor * scale[0]
    const cropY = displaySize / 2 - (img.naturalHeight * scaleFactor) / 2 + cropArea.y * scaleFactor * scale[0]
    const cropWidth = cropArea.width * scaleFactor * scale[0]
    const cropHeight = cropArea.height * scaleFactor * scale[0]

    const cursor = getCursorStyle(x, y, cropX, cropY, cropWidth, cropHeight)

    if (cursor.includes("resize")) {
      setIsResizing(true)
      setResizeHandle(cursor)
      setDragMode("resize")
    } else if (cursor === "move") {
      setIsDragging(true)
      setDragMode("move")
    }

    setDragStart({ x, y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageRef.current || previewMode) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate crop area position for cursor
    const img = imageRef.current
    const displaySize = 500
    const scaleFactor = Math.min(displaySize / img.naturalWidth, displaySize / img.naturalHeight) * 0.8
    const cropX = displaySize / 2 - (img.naturalWidth * scaleFactor) / 2 + cropArea.x * scaleFactor * scale[0]
    const cropY = displaySize / 2 - (img.naturalHeight * scaleFactor) / 2 + cropArea.y * scaleFactor * scale[0]
    const cropWidth = cropArea.width * scaleFactor * scale[0]
    const cropHeight = cropArea.height * scaleFactor * scale[0]

    // Update cursor
    if (!isDragging && !isResizing) {
      const cursor = getCursorStyle(x, y, cropX, cropY, cropWidth, cropHeight)
      canvas.style.cursor = cursor
    }

    // Handle dragging/resizing
    if ((isDragging || isResizing) && dragMode) {
      const deltaX = x - dragStart.x
      const deltaY = y - dragStart.y

      const adjustedDeltaX = deltaX / (scaleFactor * scale[0])
      const adjustedDeltaY = deltaY / (scaleFactor * scale[0])

      if (dragMode === "move") {
        setCropArea((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(img.naturalWidth - prev.width, prev.x + adjustedDeltaX)),
          y: Math.max(0, Math.min(img.naturalHeight - prev.height, prev.y + adjustedDeltaY)),
        }))
      } else if (dragMode === "resize" && resizeHandle) {
        setCropArea((prev) => {
          const newArea = { ...prev }

          switch (resizeHandle) {
            case "nw-resize":
              newArea.x = Math.max(0, prev.x + adjustedDeltaX)
              newArea.y = Math.max(0, prev.y + adjustedDeltaY)
              newArea.width = Math.max(20, prev.width - adjustedDeltaX)
              newArea.height = Math.max(20, prev.height - adjustedDeltaY)
              break
            case "ne-resize":
              newArea.y = Math.max(0, prev.y + adjustedDeltaY)
              newArea.width = Math.max(20, prev.width + adjustedDeltaX)
              newArea.height = Math.max(20, prev.height - adjustedDeltaY)
              break
            case "sw-resize":
              newArea.x = Math.max(0, prev.x + adjustedDeltaX)
              newArea.width = Math.max(20, prev.width - adjustedDeltaX)
              newArea.height = Math.max(20, prev.height + adjustedDeltaY)
              break
            case "se-resize":
              newArea.width = Math.max(20, prev.width + adjustedDeltaX)
              newArea.height = Math.max(20, prev.height + adjustedDeltaY)
              break
            case "n-resize":
              newArea.y = Math.max(0, prev.y + adjustedDeltaY)
              newArea.height = Math.max(20, prev.height - adjustedDeltaY)
              break
            case "s-resize":
              newArea.height = Math.max(20, prev.height + adjustedDeltaY)
              break
            case "w-resize":
              newArea.x = Math.max(0, prev.x + adjustedDeltaX)
              newArea.width = Math.max(20, prev.width - adjustedDeltaX)
              break
            case "e-resize":
              newArea.width = Math.max(20, prev.width + adjustedDeltaX)
              break
          }

          // Keep aspect ratio for certain ratios
          if (cropRatio === "1:1") {
            const size = Math.min(newArea.width, newArea.height)
            newArea.width = size
            newArea.height = size
          }

          // Ensure crop area stays within image bounds
          newArea.x = Math.max(0, Math.min(img.naturalWidth - newArea.width, newArea.x))
          newArea.y = Math.max(0, Math.min(img.naturalHeight - newArea.height, newArea.y))
          newArea.width = Math.min(img.naturalWidth - newArea.x, newArea.width)
          newArea.height = Math.min(img.naturalHeight - newArea.y, newArea.height)

          return newArea
        })
      }

      setDragStart({ x, y })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    setDragMode(null)
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "default"
    }
  }

  // Handle crop size change
  const handleCropSizeChange = (newSize: number[]) => {
    if (!imageRef.current) return

    const img = imageRef.current
    const size = newSize[0]
    const maxSize = Math.min(img.naturalWidth, img.naturalHeight)
    const actualSize = (size / 100) * maxSize

    if (cropRatio === "1:1") {
      setCropArea((prev) => ({
        x: Math.max(0, Math.min(img.naturalWidth - actualSize, prev.x)),
        y: Math.max(0, Math.min(img.naturalHeight - actualSize, prev.y)),
        width: actualSize,
        height: actualSize,
      }))
    }
  }

  // Handle transformations
  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360)
  }

  const handleZoom = (delta: number) => {
    setScale((prev) => [Math.max(0.1, Math.min(5, prev[0] + delta))])
  }

  const handlePositionChange = (axis: "x" | "y", value: number[]) => {
    setPosition((prev) => ({
      ...prev,
      [axis]: value[0],
    }))
  }

  // Reset all transformations
  const handleReset = () => {
    resetTransforms()
    if (imageRef.current) {
      const img = imageRef.current
      const size = Math.min(img.naturalWidth, img.naturalHeight) * 0.6
      setCropArea({
        x: (img.naturalWidth - size) / 2,
        y: (img.naturalHeight - size) / 2,
        width: size,
        height: size,
      })
    }
  }

  // Crop and return the image
  const handleCropConfirm = async () => {
    if (!imageRef.current || !canvasRef.current) return

    const img = imageRef.current
    const cropCanvas = document.createElement("canvas")
    const cropCtx = cropCanvas.getContext("2d")

    if (!cropCtx) return

    // Set output size
    const outputSize = 400
    cropCanvas.width = outputSize
    cropCanvas.height = outputSize

    // Save context
    cropCtx.save()

    // Apply transformations
    cropCtx.translate(outputSize / 2, outputSize / 2)
    cropCtx.rotate((rotation * Math.PI) / 180)
    cropCtx.scale(scale[0], scale[0])
    cropCtx.translate(position.x, position.y)

    // Create clipping path for circle crop
    if (cropShape === "circle") {
      cropCtx.beginPath()
      cropCtx.arc(0, 0, outputSize / 2, 0, 2 * Math.PI)
      cropCtx.clip()
    }

    // Draw cropped image
    const sourceX = cropArea.x
    const sourceY = cropArea.y
    const sourceWidth = cropArea.width
    const sourceHeight = cropArea.height

    cropCtx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      -outputSize / 2,
      -outputSize / 2,
      outputSize,
      outputSize,
    )

    cropCtx.restore()

    // Convert to blob
    cropCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCrop(blob)
        }
      },
      "image/jpeg",
      0.95,
    )
  }

  const cropSizePercentage = imageRef.current
    ? Math.round((cropArea.width / Math.min(imageRef.current.naturalWidth, imageRef.current.naturalHeight)) * 100)
    : 50

  const fileSize = imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) : "0"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crop className="h-5 w-5" />
              <span>Editor de Imagen</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {originalDimensions.width}×{originalDimensions.height}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {fileSize}MB
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-[60vh]">
          {/* Canvas Area */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                className="border border-gray-300 rounded-lg shadow-lg"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              {imageUrl && (
                <img
                  ref={imageRef}
                  src={imageUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="hidden"
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                />
              )}

              {/* Preview Mode Toggle */}
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => handleRotate(-90)}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleRotate(90)}>
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleZoom(-0.1)}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleZoom(0.1)}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-80 bg-white rounded-lg border p-4 overflow-y-auto">
            <Tabs defaultValue="crop" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="crop">
                  <Crop className="h-4 w-4 mr-1" />
                  Recorte
                </TabsTrigger>
                <TabsTrigger value="transform">
                  <Move className="h-4 w-4 mr-1" />
                  Ajustes
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-1" />
                  Opciones
                </TabsTrigger>
              </TabsList>

              <TabsContent value="crop" className="space-y-4 mt-4">
                {/* Crop Shape */}
                <div className="space-y-2">
                  <Label>Forma del recorte</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={cropShape === "square" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCropShape("square")}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Cuadrado
                    </Button>
                    <Button
                      variant={cropShape === "circle" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCropShape("circle")}
                    >
                      <Circle className="h-4 w-4 mr-1" />
                      Círculo
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <Label>Proporción</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["1:1", "4:3", "16:9", "free"] as CropRatio[]).map((ratio) => (
                      <Button
                        key={ratio}
                        variant={cropRatio === ratio ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCropRatioChange(ratio)}
                      >
                        {ratio === "free" ? "Libre" : ratio}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Crop Size */}
                <div className="space-y-2">
                  <Label>Tamaño: {cropSizePercentage}%</Label>
                  <Slider
                    value={[cropSizePercentage]}
                    onValueChange={handleCropSizeChange}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                <Separator />

                {/* Instructions */}
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">💡 Cómo usar:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Arrastra dentro del área para mover</li>
                    <li>Arrastra los bordes para redimensionar</li>
                    <li>Usa las esquinas para mantener proporción</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="transform" className="space-y-4 mt-4">
                {/* Zoom */}
                <div className="space-y-2">
                  <Label>Zoom: {Math.round(scale[0] * 100)}%</Label>
                  <Slider value={scale} onValueChange={setScale} min={0.1} max={5} step={0.1} className="w-full" />
                </div>

                <Separator />

                {/* Position */}
                <div className="space-y-2">
                  <Label>Posición X</Label>
                  <Slider
                    value={[position.x]}
                    onValueChange={(value) => handlePositionChange("x", value)}
                    min={-200}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Posición Y</Label>
                  <Slider
                    value={[position.y]}
                    onValueChange={(value) => handlePositionChange("y", value)}
                    min={-200}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                </div>

                <Separator />

                {/* Rotation */}
                <div className="space-y-2">
                  <Label>Rotación: {rotation}°</Label>
                  <Slider
                    value={[rotation]}
                    onValueChange={(value) => setRotation(value[0])}
                    min={-180}
                    max={180}
                    step={15}
                    className="w-full"
                  />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                {/* Grid Toggle */}
                <div className="flex items-center justify-between">
                  <Label>Mostrar cuadrícula</Label>
                  <Button variant={showGrid ? "default" : "outline"} size="sm" onClick={() => setShowGrid(!showGrid)}>
                    {showGrid ? "Activada" : "Desactivada"}
                  </Button>
                </div>

                <Separator />

                {/* Image Info */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Dimensiones originales:</span>
                    <span>
                      {originalDimensions.width}×{originalDimensions.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tamaño del archivo:</span>
                    <span>{fileSize} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Formato:</span>
                    <span>{imageFile?.type.split("/")[1].toUpperCase()}</span>
                  </div>
                </div>

                <Separator />

                {/* Output Settings */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="font-medium">Configuración de salida:</div>
                  <div className="flex justify-between">
                    <span>Tamaño final:</span>
                    <span>400×400 px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Formato:</span>
                    <span>JPEG</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calidad:</span>
                    <span>95%</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleCropConfirm} disabled={!imageLoaded || uploading} size="lg">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir Imagen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
