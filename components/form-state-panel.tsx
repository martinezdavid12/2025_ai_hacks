import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { FormData } from "@/lib/forms"
import { FileText, Info } from "lucide-react"

interface FormStatePanelProps {
  activeForm: FormData | null
  activePdf: File | null
}

export default function FormStatePanel({ activeForm, activePdf }: FormStatePanelProps) {
  if (!activeForm && !activePdf) {
    return (
      <Card className="h-full flex items-center justify-center border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center text-muted-foreground p-6">
          <Info className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Form & PDF Context</h3>
          <p className="mt-1 text-sm">Select a form or upload a PDF to begin.</p>
          <p className="mt-1 text-sm">The current state will appear here.</p>
        </div>
      </Card>
    )
  }

  if (activePdf) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            PDF Context Active
          </CardTitle>
          <CardDescription>Filename: {activePdf.name}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <div className="space-y-4 p-4 bg-muted/30 rounded-md">
            <p className="text-sm text-foreground">The SocialAgent will use this PDF as context for your questions.</p>
            <p className="text-xs text-muted-foreground">
              Size: {(activePdf.size / 1024).toFixed(2)} KB
              <br />
              Type: {activePdf.type}
            </p>
            <p className="text-sm text-foreground mt-4">
              You can now ask questions about the content of this PDF in the chat window.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activeForm) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>{activeForm.name}</CardTitle>
          <CardDescription>Live view of the form fields.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <div className="space-y-4">
            {activeForm.fields.map((field) => (
              <div key={field.id}>
                <Label htmlFor={field.id} className="text-sm font-medium">
                  {field.label}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  value={field.value}
                  readOnly
                  className="mt-1 bg-input text-foreground placeholder:text-muted-foreground"
                  placeholder={field.value ? "" : "Awaiting answer..."}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return null // Should not happen if logic is correct
}
