# CEA Backend

Initial Node.js/Express service for the CEA School Management App.

## Hosting environment variables
- DATABASE_URL: Neon PostgreSQL connection string
- FRONTEND_ORIGIN: exact deployed website origin, e.g. https://malakaimal.github.io
- PORT: supplied by the host

Never commit .env, Neon connection strings, database passwords or Resend API keys.

## Deploy
Deploy this folder as a Node web service from the GitHub repository. Build command: npm install. Start command: npm start.

## Current status
This is only the initial API health service. It does not expose student records or write payments. Authentication, admin/teacher/parent role authorization, parent-to-student data isolation, audit logging, input validation, fee transactions and Resend delivery must be implemented and tested before real school data is used.
