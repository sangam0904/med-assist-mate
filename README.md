# Your Health Companion

Build a complete, modern, and fully functional AI-powered Medical Assistant web application named "MedAssist AI". The application should have a premium healthcare-themed UI with a clean, minimal, and responsive design that works perfectly on desktop, tablet, and mobile devices. Use React.js with Tailwind CSS for the frontend, Node.js with Express.js for the backend, Firebase Authentication for secure login, Firestore as the database, Firebase Storage for file uploads, and Gemini/OpenAI API for AI features.

The application should begin with a beautiful landing page containing a hero section, feature highlights, testimonials, and a "Get Started" button. Users should be able to register using email/password or Google Sign-In, log in securely, reset their password, and access a personalized dashboard after authentication.

The dashboard should display quick-access cards for AI Medical Chat, Symptom Checker, Lab Report Analyzer, Medicine Reminder, Health History, BMI Calculator, Water Intake Tracker, Emergency Assistance, Nearby Hospitals, and User Profile. It should also display upcoming medicine reminders, recently uploaded reports, recent AI conversations, and a health summary.

Create a modern AI chatbot that allows users to ask health-related questions in both English and Hindi. The chatbot should use the Gemini/OpenAI API to provide educational health information, explain possible causes of symptoms, suggest basic self-care measures, identify emergency warning signs, and always remind users that it is not a substitute for a doctor. The chatbot must never diagnose diseases or prescribe medications and should display a medical disclaimer with every response. Include typing animations, chat history, timestamps, markdown support, suggested questions, and voice input if possible.

Develop a Symptom Checker where users can select or type symptoms such as fever, cough, headache, sore throat, vomiting, fatigue, chest pain, breathing difficulty, body pain, stomach pain, and dizziness. The AI should analyze the symptoms and categorize the urgency into Low, Medium, or High Risk using visually appealing indicators. It should explain possible conditions in simple language, recommend home care tips where appropriate, advise consulting a doctor when necessary, and immediately recommend emergency medical attention if dangerous symptoms are detected.

Implement a Medicine Reminder system where users can add medicines by entering the medicine name, dosage, frequency, start date, end date, and reminder time. Users should be able to mark medicines as taken or missed, edit or delete reminders, and view their medicine schedule in a calendar or list format. Notifications should remind users when it is time to take their medicine.

Create a Lab Report Analyzer where users can upload PDF, JPG, JPEG, or PNG medical reports. Extract text using OCR, send the extracted information to the AI model, and generate an easy-to-understand explanation of important values such as blood sugar, cholesterol, hemoglobin, CBC, liver function, kidney function, vitamin levels, and other health parameters. Highlight abnormal values, explain what they mean in simple language, and allow users to download the AI-generated report summary as a PDF.

Design a Health History page where all previous AI chats, uploaded reports, medicine reminders, and health activities are stored and displayed in chronological order. Users should be able to search and filter their records.

Include useful health tools such as a BMI Calculator, Water Intake Calculator, Daily Calorie Calculator, and Sleep Tracker. These tools should display calculations along with personalized educational health tips and visually attractive charts or progress indicators.

Develop an Emergency section containing a large SOS button, emergency contact information, ambulance numbers, first-aid guidance, and nearby hospitals using Google Maps integration. Whenever the AI detects symptoms related to heart attack, stroke, severe breathing problems, or heavy bleeding, it should automatically display an emergency warning message advising users to seek immediate medical assistance.

The User Profile page should allow users to manage personal information including profile photo, age, gender, height, weight, blood group, allergies, emergency contacts, and medical history. Include a Settings page where users can switch between dark and light themes, change language preferences, manage notifications, update passwords, or delete their account.

Use reusable React components, proper folder structure, modular backend architecture, protected routes, API validation, error handling, loading states, toast notifications, skeleton loaders, and responsive layouts throughout the application. Store sensitive keys in environment variables and follow best practices for security.

The application should include beautiful animations using Framer Motion, premium cards, smooth page transitions, healthcare-themed icons, modern typography, and accessibility support.

Generate a complete production-ready application including frontend, backend, Firebase configuration, API integration, folder structure, setup instructions, environment variables, and deployment configuration for Vercel (frontend) and Render (backend). The code should be clean, modular, well-commented, scalable, and immediately runnable after installing dependencies and configuring environment variables.


Do not generate placeholder pages or dummy components. Every feature must be fully implemented with working frontend, backend APIs, Firebase integration, proper state management, validation, and database connectivity. If a feature cannot be completed in one response, continue generating the remaining code automatically until the entire project is finished. Use real project architecture and avoid incomplete or pseudo-code implementations.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://med-assist-mate.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b357dfd4-8eb1-40a7-b216-e7ccd4eab948).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
