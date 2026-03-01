import { useCallback, useRef, useState } from "react"
import { Upload, FileWarning } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface DropZoneProps {
  onFileAccepted: (file: File) => void
}

export function DropZone({ onFileAccepted }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isFitFile = (file: File): boolean => {
    return file.name.toLowerCase().endsWith(".fit")
  }

  const handleFile = useCallback(
    (file: File) => {
      if (isFitFile(file)) {
        onFileAccepted(file)
      } else {
        toast.error("Invalid file type", {
          description: "Please select a .fit file from your GPS watch.",
        })
      }
    },
    [onFileAccepted]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDragOver) setIsDragOver(true)
    },
    [isDragOver]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
      // Reset so the same file can be selected again
      e.target.value = ""
    },
    [handleFile]
  )

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-background"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Card
        className={`w-full max-w-lg transition-colors duration-200 ${
          isDragOver
            ? "border-primary border-2 bg-primary/5"
            : "border-dashed border-2 border-muted-foreground/25"
        }`}
      >
        <CardContent className="flex flex-col items-center gap-6 py-16 px-8">
          <div
            className={`rounded-full p-4 transition-colors duration-200 ${
              isDragOver
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isDragOver ? (
              <FileWarning className="size-10" />
            ) : (
              <Upload className="size-10" />
            )}
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">FitViewer</h1>
            <p className="text-muted-foreground">
              {isDragOver
                ? "Drop your .fit file here"
                : "Drag & drop a .fit file to analyze your run"}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 w-full">
            <Button onClick={handleBrowseClick} size="lg" className="w-full max-w-xs">
              Browse files
            </Button>
            <p className="text-xs text-muted-foreground">
              Supports .fit files from Garmin, Wahoo, COROS, and other GPS watches
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".fit"
            className="hidden"
            onChange={handleFileInputChange}
            data-testid="file-input"
          />
        </CardContent>
      </Card>
    </div>
  )
}
