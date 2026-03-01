import { useCallback } from "react"
import { Toaster } from "@/components/ui/sonner"
import { DropZone } from "@/components/file/DropZone"

function App() {
  const handleFileAccepted = useCallback((file: File) => {
    // TODO: Wire up to Zustand store / parser in a future story
    console.log("File accepted:", file.name, file.size)
  }, [])

  return (
    <>
      <DropZone onFileAccepted={handleFileAccepted} />
      <Toaster />
    </>
  )
}

export default App
