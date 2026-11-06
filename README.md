# Campus E-Approval System

A full-stack campus permission and approval management system that digitizes student requests and routes them through the appropriate institutional authorities, with status tracking, document processing, and verifiable PDF permission letters.

## Overview

The **Campus E-Approval System** replaces paper-based campus permission workflows with a centralized web application. Students can register, submit different types of requests, attach supporting documents, and follow the progress of each request. Requests are routed to the relevant authorities according to configurable request-specific approval chains.

Authorities can review, approve, or reject requests. Certain request types continue to the Office Staff after the approval chain is complete, where the document is processed and handed over to the student. For approved requests, the backend generates a PDF permission letter containing the approval details and a QR code that links to a public verification page.

The application is built with the MERN stack: MongoDB, Express.js, React.js, and Node.js.

## User roles

The application defines six user roles:

| Role | Responsibilities |
|---|---|
| **Student** | Creates and submits permission requests, views request history and status, and accesses generated documents. |
| **Tutor** | Reviews and acts on requests routed to the student's class tutor. |
| **Faculty Coordinator** | Reviews requests associated with assigned clubs or communities. |
| **HOD** | Handles departmental approval stages. |
| **Principal** | Handles final institutional approval where required by the routing rules. |
| **Office Staff** | Processes eligible documents after digital approvals, records office details, and manages handover or certificate-return steps. |

Authority accounts (Tutor, Faculty Coordinator, HOD, Principal and Office Staff) are registered separately from student accounts. A signature image is required when registering an authority other than Office Staff.

## Main features

### Student request management
- Student registration and login.
- Student profile details used to pre-fill request information.
- Multi-step request creation: select a request type, complete the relevant form, and preview before submission.
- Support for attachments on request submissions.
- Request history and individual request details.

### Request categories

The request model supports these eight request types:

1. Duty Leave — File Upload
2. Duty Leave — Event
3. Scholarship Recommendation
4. Event Conduct Permission
5. General Purpose Certificate
6. Borrowing Original Certificates
7. Season Ticket / Railway Concession
8. Fee Structure for Educational Loan

### Dynamic hierarchical approval
The backend determines an approval chain based on the request type and, for some requests, the submitted event or organisation details. Examples of configured approval paths include Tutor → HOD → Principal, Faculty Coordinator → Principal, and Tutor → HOD.

The assigned authority can approve or reject a request. A rejection requires a comment, and the request is marked as rejected. An approval advances the request to the next authority in its chain.

### Office processing
Four request categories are configured for additional office processing:
- General Purpose Certificate
- Borrowing Original Certificates
- Season Ticket / Railway Concession
- Fee Structure for Educational Loan

After the required digital approvals, these requests enter the office queue. Office Staff can save processing details, mark a request ready for collection, record handover to the student, and record the return of borrowed original certificates.

### Authentication and access control
- JSON Web Token (JWT) authentication.
- Password hashing with bcrypt.
- Middleware for authenticated routes and role-based authorization.
- Student and staff profile management.

### Real-time notifications
Socket.io is used to notify the relevant user when a request is assigned and to send request-status updates as it moves through the workflow.

### PDF permission letters
The backend generates PDF permission letters after final approval. The generated documents include request and student information, approval details and authority signature images where available. Office-processing fields are included when applicable.

PDF generation uses Puppeteer Core with the `@sparticuz/chromium` package. Generated PDFs are uploaded to Cloudinary.

### QR-code document verification
Generated permission letters include a QR code linking to the application's verification page. The backend creates a verification token using HMAC-SHA256 and the configured JWT secret. The public verification endpoint checks the token and returns document details and the recorded approval chain.

### File and signature storage
Cloudinary is configured for:
- Authority signature images.
- Student request attachments.
- Generated permission-letter PDFs.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 7, React Router 7 |
| Styling and UI | Tailwind CSS 4, Lucide React |
| HTTP communication | Axios |
| Real-time communication | Socket.io Client |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose 9 |
| Authentication | JSON Web Token, bcrypt |
| File uploads | Multer, Cloudinary, multer-storage-cloudinary |
| PDF generation | Puppeteer Core, `@sparticuz/chromium` |
| QR generation | `qrcode` |
| Other backend utilities | CORS, dotenv, Sharp, XLSX |

## Project structure

```text
e-campus-approval/
├── client/
│   ├── public/
│   └── src/
│       ├── api/                 # Axios API client
│       ├── components/          # Shared UI and layout components
│       ├── context/             # Authentication context
│       └── pages/
│           ├── authority/       # Authority dashboards and approval pages
│           ├── office/          # Office processing and history
│           ├── student/         # Student dashboard and request pages
│           ├── Login.jsx
│           ├── RegisterAuthority.jsx
│           ├── RegisterStudent.jsx
│           ├── Settings.jsx
│           └── Verify.jsx       # Public document verification page
├── server/
│   ├── config/                  # MongoDB and Cloudinary configuration
│   ├── middleware/              # Authentication and role authorization
│   ├── models/                  # Mongoose data models
│   ├── routes/                  # Authentication, requests, approvals,
│   │                            # office and document APIs
│   ├── services/                # Routing, PDF and QR services
│   └── server.js                # Express and Socket.io entry point
├── DesignDoc.md
├── PRD.md
├── TechStack.md
└── PDFTemplate_PermissionLetter.md
```

## Getting started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) and npm.
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) or a MongoDB Atlas connection.
- A [Cloudinary](https://cloudinary.com/) account for signature uploads, request attachments and generated PDF storage.

### 1. Clone the repository

```bash
git clone https://github.com/muhdzwafee128/e-campus-approval.git
cd e-campus-approval
```

### 2. Configure the backend

Move into the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/e_campus_approval
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Replace the example values with your own configuration. Use a strong, private value for `JWT_SECRET`. Do not commit `.env` files or real credentials to Git.

Start the backend:

```bash
npm run dev
```

The backend uses port `5000` by default. A health-check endpoint is available at:

```text
http://localhost:5000/api/health
```

### 3. Configure the frontend

Open a second terminal from the project root:

```bash
cd client
npm install
```

Create a `.env` file inside the `client/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

Vite normally serves the frontend at:

```text
http://localhost:5173
```

Open that address in your browser.

> **Local Socket.io configuration:** The current frontend authentication context creates its Socket.io connection using `http://localhost:5000`. If you deploy the frontend and backend separately, update this client connection to use the deployed backend URL and configure the server's `CLIENT_URL` accordingly.

## Available scripts

### Frontend (`client/`)

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Builds the frontend for production. |
| `npm run preview` | Serves the production build locally for preview. |
| `npm run lint` | Runs ESLint. |

### Backend (`server/`)

| Command | Description |
|---|---|
| `npm run dev` | Starts the backend using `node server.js`. |
| `npm start` | Starts the backend using `node server.js`. |
| `npm test` | Placeholder script; automated tests are not configured in the current package. |

## API overview

The Express application exposes the following API route groups:

| Base path | Purpose |
|---|---|
| `/api/auth` | Student and authority registration, login, current-user details and profile updates. |
| `/api/requests` | Request submission, listing and request details. |
| `/api/approvals` | Authority approval/rejection actions, approval history and statistics. |
| `/api/office` | Office queue, processing, handover, return and office history. |
| `/api/documents` | Permission-letter download and public QR verification. |
| `/api/health` | Backend health check. |

Most application endpoints require authentication. The document verification endpoint is public and validates the request ID and verification token.

## Screenshots

Screenshots can be added to this section to help reviewers understand the application without running it.

The repository archive supplied for this README did not contain application screenshots. Add screenshots to a folder such as `docs/screenshots/`, then replace the placeholders below with the actual image paths.

| Login page | Student request form |
|---|---|
| `<!-- Add login screenshot at docs/screenshots/login.png -->` | `<!-- Add request form screenshot at docs/screenshots/student-request-form.png -->` |

**Approval review view**

```md
![Approval review view](docs/screenshots/approval-view.png)
```

Once the screenshots are added, you can use the following Markdown to display them:

```md
![Login page](docs/screenshots/login.png)
![Student request form](docs/screenshots/student-request-form.png)
![Approval review view](docs/screenshots/approval-view.png)
```

## Demo access

No test/demo account credentials were included in the supplied project archive. To provide reviewer access, create dedicated demo accounts for the relevant roles and add the credentials here only if those accounts are safe to share.

Do not publish personal accounts, production credentials, or real users' passwords in this README.

## Notes for contributors and reviewers

- The backend requires a reachable MongoDB instance before it starts listening for requests.
- Cloudinary credentials are needed for the configured signature, attachment and PDF upload flows.
- The frontend API base URL is read from `VITE_API_URL`.
- The backend CORS origin is read from `CLIENT_URL`.
- The current frontend Socket.io client URL is hard-coded to `http://localhost:5000`; update it for a non-local deployment.
- The backend package's test command is currently a placeholder; no automated test suite is defined in the supplied package configuration.

## License

No license file was present in the supplied repository archive. Add a `LICENSE` file if you intend to distribute this project under an open-source license.
