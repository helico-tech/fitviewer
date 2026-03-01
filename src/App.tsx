import { useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { DropZone } from "@/components/file/DropZone"
import { LoadingState } from "@/components/file/LoadingState"
import { DashboardPlaceholder } from "@/components/dashboard/DashboardPlaceholder"
import { useRunStore } from "@/store/useRunStore"

function App() {
  const { runData, isLoading, error, loadFile, reset } = useRunStore()

  useEffect(() => {
    if (error) {
      toast.error("Failed to load file", {
        description: error,
        action: {
          label: "Dismiss",
          onClick: () => reset(),
        },
      })
    }
  }, [error, reset])

  let content
  if (isLoading) {
    content = <LoadingState />
  } else if (runData) {
    content = <DashboardPlaceholder onLoadNew={reset} />
  } else {
    content = <DropZone onFileAccepted={loadFile} />
  }

  return (
    <>
      {content}
      <Toaster />
    </>
  )
}

export default App
