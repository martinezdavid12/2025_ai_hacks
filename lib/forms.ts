export interface FormField {
  id: string
  label: string
  value: string
  type: "text" | "date" | "email"
  question: string
}

export interface FormData {
  id: string
  name: string
  fields: FormField[]
}

// We'll define one form for now as an example.
export const supportedFormsData: Record<string, FormData> = {
  "california-snap": {
    id: "california-snap",
    name: "California SNAP Application (Simplified)",
    fields: [
      {
        id: "fullName",
        label: "Full Name",
        value: "",
        type: "text",
        question: "To start, what is your full legal name?",
      },
      {
        id: "dob",
        label: "Date of Birth",
        value: "",
        type: "date",
        question: "Great. What is your date of birth (MM/DD/YYYY)?",
      },
      { id: "address", label: "Home Address", value: "", type: "text", question: "What is your current home address?" },
      {
        id: "ssn",
        label: "Social Security Number",
        value: "",
        type: "text",
        question: "What is your Social Security Number?",
      },
      {
        id: "monthlyIncome",
        label: "Monthly Income",
        value: "",
        type: "text",
        question: "Finally, what is your total monthly income before taxes?",
      },
    ],
  },
  // Add other supported forms here
}
