import { useCallback } from "react"
import { Toaster } from "@/components/ui/sonner"
import { DropZone } from "@/components/file/DropZone"
import { LoadingState } from "@/components/file/LoadingState"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { useRunStore } from "@/store/useRunStore"

function App() {
  const { runData, isLoading, error, loadFile, reset } = useRunStore()

  const clearError = useCallback(() => {
    useRunStore.setState({ error: null })
  }, [])

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
