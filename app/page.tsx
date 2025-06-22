import FormFillerApp from "@/components/form-filler-app"

export default function HomePage() {
  return (
    // Added padding to the main container for better spacing from viewport edges
    <main className="h-screen w-full bg-background p-4 md:p-6 lg:p-8">
      <FormFillerApp />
    </main>
  )
}
