import { useCallback, useState } from "react"
import { Toaster } from "@/components/ui/sonner"
import { DropZone } from "@/components/file/DropZone"
import { LoadingState } from "@/components/file/LoadingState"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { useRunStore } from "@/store/useRunStore"

function App() {
  const { runData, isLoading, error, loadFile, reset } = useRunStore()
  const [isSampleLoading, setIsSampleLoading] = useState(false)

  const clearError = useCallback(() => {
    useRunStore.setState({ error: null })
  }, [])

  const loadSample = useCallback(async () => {
    setIsSampleLoading(true)
    try {
      const response = await fetch(import.meta.env.BASE_URL + "sample.fit")
      if (!response.ok) throw new Error("Failed to fetch sample file")
      const blob = await response.blob()
      const file = new File([blob], "sample.fit", { type: "application/octet-stream" })
      await loadFile(file)
    } catch {
      useRunStore.setState({ error: "Could not load sample file" })
    } finally {
      setIsSampleLoading(false)
    }
  }, [loadFile])

  let content
  if (isLoading) {
    content = <LoadingState />
  } else if (runData) {
    content = <DashboardLayout onLoadNew={reset} />
  } else {
    content = (
      <DropZone
        onFileAccepted={loadFile}
        error={error}
        onDismissError={clearError}
        onLoadSample={loadSample}
        isSampleLoading={isSampleLoading}
      />
    )
  }

  return (
    <>
      {content}
      <Toaster />
    </>
  )
}

export default App
