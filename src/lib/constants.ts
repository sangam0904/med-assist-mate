/** Shared app-wide constants for MedAssist AI. */

export const APP_NAME = "MedAssist AI";

export const MEDICAL_DISCLAIMER =
  "MedAssist AI provides general health education only. It is not a substitute for a qualified doctor, diagnosis, or prescription. In an emergency, seek immediate medical help.";

export const COMMON_SYMPTOMS = [
  "Fever",
  "Cough",
  "Headache",
  "Sore throat",
  "Vomiting",
  "Fatigue",
  "Chest pain",
  "Breathing difficulty",
  "Body pain",
  "Stomach pain",
  "Dizziness",
  "Rash",
  "Diarrhoea",
  "Loss of appetite",
] as const;

export const EMERGENCY_NUMBERS = [
  { label: "National Emergency", number: "112", note: "All-in-one emergency line (India)" },
  { label: "Ambulance", number: "108", note: "Free emergency ambulance service" },
  { label: "Medical Helpline", number: "102", note: "Maternity & child health transport" },
  { label: "Poison Control", number: "1800-116-117", note: "National poison information centre" },
  { label: "Mental Health (Tele-MANAS)", number: "14416", note: "24x7 mental health support" },
] as const;

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const SUGGESTED_QUESTIONS = [
  "What could cause a headache that lasts three days?",
  "How do I care for a mild fever at home?",
  "बुखार में क्या खाना चाहिए?",
  "When is chest discomfort an emergency?",
] as const;
