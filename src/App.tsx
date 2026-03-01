import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[380px]">
        <CardHeader>
          <CardTitle className="text-2xl">FitViewer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Browser-based FIT file viewer for runners.
          </p>
          <Button>Get Started</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
