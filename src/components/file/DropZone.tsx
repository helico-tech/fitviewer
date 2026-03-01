import { useCallback, useRef, useState } from "react"
import { Upload, FileWarning, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DropZoneProps {
  onFileAccepted: (file: File) => void
  error?: string | null
  onDismissError?: () => void
  onLoadSample?: () => void
  isSampleLoading?: boolean
}

export function DropZone({ onFileAccepted, error, onDismissError, onLoadSample, isSampleLoading }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isFitFile = (file: File): boolean => {
    return file.name.toLowerCase().endsWith(".fit")
  }

  const handleFile = useCallback(
    (file: File) => {
      // Clear any previous file-level error when user tries a new file
      setFileError(null)
      onDismissError?.()

      if (isFitFile(file)) {
        onFileAccepted(file)
      } else {
        setFileError("This doesn't appear to be a FIT file")
      }
    },
    [onFileAccepted, onDismissError]
  )

  const dismissError = useCallback(() => {
    setFileError(null)
    onDismissError?.()
  }, [onDismissError])

  // Show local file error (wrong extension) or store error (parse failure)
  const displayError = fileError || error || null

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
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background"
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
            {onLoadSample && (
              <Button
                onClick={onLoadSample}
                variant="outline"
                size="sm"
                className="w-full max-w-xs"
                disabled={isSampleLoading}
                data-testid="sample-button"
              >
                {isSampleLoading ? "Loading sample…" : "Try with sample data"}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Supports .fit files from Garmin, Wahoo, COROS, and other GPS watches
            </p>
          </div>

          {(displayError) && (
            <Alert variant="destructive" className="w-full max-w-xs" data-testid="parse-error">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="pr-6">Error</AlertTitle>
              <AlertDescription>{displayError}</AlertDescription>
              <button
                onClick={dismissError}
                className="absolute top-3 right-3 text-destructive-foreground/50 hover:text-destructive-foreground"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          )}

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
