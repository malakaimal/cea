# CEA School Management API

Node.js/Express backend for Chakesar Education Academy.

## Deploy as a private web service

- Repository: malakaimal/cea
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Node.js: 20 or newer

## Required environment variables

- `DATABASE_URL`: Neon PostgreSQL connection string. Add it only in the hosting provider's private environment settings.
- `FRONTEND_ORIGIN`: exact browser origin, normally `https://malakaimal.github.io`
- `CEA_ADMIN_EMAIL`: initial administrator email
- `CEA_ADMIN_PASSWORD`: initial administrator password, at least 12 characters
- `CEA_ADMIN_NAME`: administrator display name (optional)
- `NODE_ENV`: set to `production`
- `PORT`: supplied by the host

Never commit database URLs, passwords, Resend keys, or a `.env` file to GitHub.

## Authentication currently included

- Admin account bootstrap from private environment variables
- Password hashing using bcrypt
- Rate-limited sign-in
- Random opaque session tokens stored as SHA-256 hashes in PostgreSQL
- HttpOnly session cookie
- Origin and custom-header checks for browser requests
- Session expiry and logout
- Helmet security headers and restricted CORS

The service creates two separate tables, `cea_admin_users` and `cea_admin_sessions`. It does not modify or delete the existing school tables.

## API

- `GET /api/health`
- `POST /api/auth/login` with JSON `{ "email": "...", "password": "..." }`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Browser requests to login/logout must include `X-CEA-Request: 1` and credentials. Configure the exact frontend origin before deployment.

## Important deployment note

GitHub Pages serves static files only. Deploy this backend separately as a Node web service and set its environment variables privately. Browser third-party-cookie restrictions may affect cross-site cookie sessions depending on the chosen backend host and browser. Test login in the target browsers before production use.

The API does not yet save admissions, student photos, fee transactions, attendance, marks or notifications. Do not enter real student information until those workflows, access permissions, audit logging, backups and secure photo storage are implemented and tested.
