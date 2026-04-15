# Tech Stack Document
## Campus E-Approval System
**Automated Hierarchical Permission & Workflow Portal**

---

## Overview

The Campus E-Approval System is built on the **MERN Stack** — a modern, JavaScript-based full-stack architecture. Every layer of the application, from the user interface to the database, is designed for scalability, performance, and developer productivity. MongoDB is used locally during development and can be switched to MongoDB Atlas for production deployment by changing a single environment variable.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                     │
│              React.js (with Hooks)                  │
│     Student Dashboard  |  Authority Dashboard       │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP / REST API
┌─────────────────────▼───────────────────────────────┐
│                   SERVER LAYER                      │
│            Node.js  +  Express.js                   │
│   Auth  |  Routing Engine  |  PDF  |  QR  |  Mail   │
└─────────────────────┬───────────────────────────────┘
                      │ Mongoose ODM
┌─────────────────────▼───────────────────────────────┐
│                  DATABASE LAYER                     │
│         MongoDB Local / MongoDB Atlas               │
│  Users | Requests | Approvals | Documents | Logs    │
└─────────────────────────────────────────────────────┘
```

---

## 1. Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React.js** | 18.x | Core UI framework — component-based architecture |
| **React Hooks** | Built-in | State management (useState, useEffect, useContext) |
| **React Router** | v6 | Client-side routing and role-based page protection |
| **Axios** | Latest | HTTP client for API calls to the backend |
| **Tailwind CSS** | v3 | Utility-first CSS framework for responsive design |

### Key Frontend Features
- **Student Dashboard** — unique design for request submission, tracking, and letter download
- **Authority Dashboard** — shared design across Tutor, Nodal Officer, Faculty Coordinator, HOD, Principal
- Role-based route protection — unauthorized users are redirected automatically
- Fully responsive — works on desktop, tablet, and mobile browsers
- Real-time status updates via polling / Socket.io

---

## 2. Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 20.x LTS | JavaScript runtime for server-side logic |
| **Express.js** | 4.x | Web framework — REST API routing and middleware |
| **Mongoose** | 7.x | MongoDB ODM — schema definition and data validation |
| **JWT (jsonwebtoken)** | Latest | Stateless authentication with role-based claims |
| **Bcrypt.js** | Latest | Password hashing — never stores plain-text passwords |
| **Multer** | Latest | Handles file uploads (supporting documents from students) |
| **Nodemailer** | Latest | Email notifications for status updates |
| **Socket.io** | 4.x | Real-time bidirectional communication for live tracking |

### Key Backend Modules

```
server/
├── routes/
│   ├── auth.routes.js          # Register, login, logout
│   ├── request.routes.js       # Submit, fetch, update requests
│   ├── approval.routes.js      # Approve / reject actions
│   └── document.routes.js      # PDF generation, QR verification
├── middleware/
│   ├── auth.middleware.js      # JWT verification
│   └── role.middleware.js      # Role-based access control
├── models/
│   ├── User.model.js           # includes signatureUrl field for authorities
│   ├── Request.model.js
│   ├── ApprovalStep.model.js
│   └── Document.model.js
├── services/
│   ├── routing.service.js      # Dynamic Hierarchical Approval engine
│   ├── pdf.service.js          # Permission letter generation
│   ├── qr.service.js           # QR code generation & verification
│   └── mail.service.js         # Email notifications
└── server.js
```

---

## 3. Database

The system supports **two MongoDB deployment modes** — local for development and Atlas for production. Switching between them requires changing only one environment variable.

| Mode | Technology | Use Case |
|---|---|---|
| **Development** | MongoDB Local (Community Server) | Runs on `localhost:27017` — no internet, no account needed |
| **Production** | MongoDB Atlas (Cloud) | Managed cloud cluster — free tier sufficient for project scope |
| **ODM** | Mongoose 7.x | Schema validation, relationships, query building for both modes |

### Switching Between Local and Atlas

```javascript
// config/db.js — reads from .env, works for both local and Atlas
const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected:', process.env.MONGO_URI);
};

module.exports = connectDB;
```

**.env — Development (Local)**
```env
MONGO_URI=mongodb://localhost:27017/eapproval
PORT=5000
JWT_SECRET=your_secret_key
CLOUD_STORAGE_URL=your_cloudinary_or_s3_url
```

**.env — Production (Atlas)**
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/eapproval
PORT=5000
JWT_SECRET=your_secret_key
CLOUD_STORAGE_URL=your_cloudinary_or_s3_url
```

> No code changes needed — just swap the `.env` file or set environment variables on the hosting platform.

### Collections

| Collection | Key Fields | Description |
|---|---|---|
| `users` | `name`, `role`, `staffId`, `admNo`, `department`, `assignedClubs`, `signatureUrl`, `passwordHash` | All students and authority accounts. Authority records include `signatureUrl` (stored signature image URL) and `assignedClubs` array (Faculty Coordinators only). Principal and Faculty Coordinator have no `department` field. |
| `requests` | `studentId`, `type`, `subType`, `formData`, `status`, `currentHolder`, `attachments` | Every submitted permission request with full form data |
| `approval_steps` | `requestId`, `authorityId`, `action`, `comment`, `timestamp` | Each approve/reject action with timestamp and comment |
| `documents` | `requestId`, `pdfUrl`, `qrCode`, `issuedAt`, `verificationToken` | Generated PDF records with QR verification metadata |
| `audit_logs` | `event`, `userId`, `requestId`, `timestamp` | Immutable log of every system event for auditing |

### Why MongoDB?
- Flexible schema — each of the 7 request types has different fields; document model handles this naturally without multiple relational tables
- Local setup requires only MongoDB Community Server installed — no account or internet needed during development
- One `.env` change switches from local to Atlas for production deployment
- JSON-native — seamless fit with the Node.js/Express backend
- Atlas free tier (512MB) is sufficient for a college-scale project

---

## 4. Authentication & Security

| Technology | Purpose |
|---|---|
| **JWT (JSON Web Token)** | Stateless auth — role embedded in token payload |
| **Bcrypt.js** | Password hashing with salt rounds |
| **HTTPS** | All data encrypted in transit (enforced in production) |
| **Role-based Middleware** | Protects every API route by user role |
| **Token Expiry** | Sessions auto-expire; secure logout clears token |

### Auth Flow
```
User Login → Credentials verified → JWT issued (with role)
     → Token stored client-side → Sent in Authorization header
     → Middleware validates token + role on every request
```

---

## 5. Document Generation

| Technology | Purpose |
|---|---|
| **Puppeteer** | Renders HTML templates to PDF — primary PDF engine |
| **PDFKit** | Fallback PDF generation for simpler layouts |
| **qrcode (npm)** | Generates QR codes embedded in permission letters |
| **Multer** | Handles all file uploads: supporting docs, duty leave sheets, student attendance lists (PDF/Image/Excel), and authority signature images |
| **Canvas API (HTML5)** | Browser-side signature drawing tool on registration form |
| **Cloudinary / AWS S3** | Cloud storage for uploaded documents and generated PDFs |

### PDF Generation Approach

The permission letter PDF is generated using **Puppeteer** — it renders a pre-built HTML template (one per request type) filled with dynamic data, then converts it to a print-ready PDF. This approach allows pixel-perfect replication of the official physical form layout.

**Generation Flow:**
```
Final approval recorded
     → pdf.service.js triggered
     → Request type identified
     → Correct HTML template loaded
     → Template populated with: student data + form fields
       + approval chain + timestamps + digital signature blocks
     → QR code generated and embedded (bottom-right)
     → Puppeteer renders HTML → PDF (A4, portrait)
     → PDF saved to cloud storage
     → Download link sent to student via email + dashboard
```

### PDF Template Structure (per official form format)

Each request type has a dedicated HTML template that mirrors the physical college form:

| Section | Content |
|---|---|
| Header | College name, department (if applicable), document title, date |
| Student Details | Two-column layout: Name, Admn No, Semester, Branch, Category, Year of Admission |
| Request Body | Unique fields per request type (event details, certificate type, station details, etc.) |
| Approval Signatures | "Particulars verified and recommended" — one block per authority with name + timestamp |
| Office Use Only | Separated by horizontal rule — prepared by, scrutiny, verification, principal approval |
| Footer | Request ID, issue date, verification URL, QR code (2cm x 2cm, bottom-right) |

### Per Request Type — Body Content in PDF

| Request Type | Key Body Fields in PDF |
|---|---|
| Duty Leave (File Upload — 1.1) | Single event date, class hours missing, reason, uploaded file(s) list |
| Duty Leave (Event Sanction — 1.2) | Role, event name, organising body, single event date, venue, class hours, uploaded student attendance list |
| Scholarship | Scholarship name, agency, father/mother name, format attached |
| Event Conduct Permission | Full formal letter to Principal — position, organisation, event title, Single Day or date range, event start time, objective. No college name in letter. |
| General Certificate | Certificate type (Conduct/Bonafide/Course Completion/KSRTC/Other), purpose |
| Borrow Certificate | Certificate list table, purpose, return date |
| Season Ticket | Tabular: Name, DOB, Age, From Station, To Station |
| Fee Structure | Checklist (Exam fee, Bus fee, etc.), purpose, bank name and branch |

### Digital Signature Blocks in PDF

```html
<!-- Each authority gets one block, shown only if in approval chain -->
<!-- Signature image fetched from stored URL (Cloudinary/S3) -->
<div class="signature-block">
  <div class="sig-label">Group Tutor</div>
  <img class="sig-image" src="{{ tutor.signatureUrl }}" alt="Signature" />
  <div class="sig-name">Name: {{ tutor.name }}</div>
  <div class="sig-time">Approved: {{ tutor.approvedAt }}</div>
</div>
```

> Signature images are fetched from cloud storage at PDF generation time and embedded directly into the rendered HTML before Puppeteer converts it to PDF.

### PDF Page Specifications

| Property | Value |
|---|---|
| Paper Size | A4 — 210mm x 297mm |
| Orientation | Portrait |
| Font | Times New Roman (matches official form style) |
| Color | Black and white (print-compatible) |
| Margins | Top: 25mm, Bottom: 20mm, Left: 25mm, Right: 20mm |
| QR Code Size | 2cm x 2cm, bottom-right corner |

### QR Code Verification Flow

```
PDF generated → qrcode npm generates QR image
     → QR encodes signed verification URL:
       /verify/REQ-2026-XXXX?token=<secure_hash>
     → QR embedded in PDF footer (bottom-right, 2cm x 2cm)
     → Verifier scans QR → Public verification page
     → Page displays: student name, request type,
       approval chain, all authority signatures + timestamps
     → Confirms letter is authentic and untampered
     → No login required to verify
```

---

## 6. Smart Routing Engine

The core innovation — built as a dedicated **Node.js service** (`routing.service.js`):

```
Request Submitted → Request Type identified
     → Routing rules table consulted
     → Approval chain determined dynamically
     → First authority notified
     → On each approval → next authority notified
     → On final approval → PDF + QR generated
     → Student notified with download link
```

### Routing Rules (Data-Driven Config)

```javascript
const routingRules = {
  "duty_leave_upload":        ["tutor"],
  "duty_leave_dept_event":    ["tutor", "hod", "principal"],
  "duty_leave_iedc":          ["nodal_officer", "principal"],
  "duty_leave_club_event":    ["faculty_coordinator", "principal"],
  "duty_leave_external":      ["tutor", "hod", "principal"],
  "scholarship":              ["tutor", "hod", "principal"],
  "event_conduct_iedc":       ["nodal_officer", "principal"],
  "event_conduct_club":       ["faculty_coordinator", "principal"],
  "event_conduct_dept":       ["hod", "principal"],
  "general_certificate":      ["tutor", "hod", "principal", "office"],
  "borrow_certificate":       ["tutor", "hod", "principal"],
  "season_ticket":            ["tutor", "hod", "office"],
  "fee_structure":            ["tutor", "hod", "principal", "office"],
};
```

---

## 7. Real-time & Notifications

| Technology | Purpose |
|---|---|
| **Socket.io** | Live status updates on student and authority dashboards |
| **Nodemailer** | Email alerts when a request moves to the next approval level |

### Notification Triggers
- Request submitted → confirmation email to student
- Request forwarded to authority → notification to that authority
- Request approved at a level → notification to student + next authority
- Request rejected → immediate notification to student with reason
- Final approval → notification to student with PDF download link

---

## 8. Development Tools

| Tool | Purpose |
|---|---|
| **VS Code** | Primary code editor |
| **Git + GitHub** | Version control and collaboration |
| **Postman** | API testing and documentation |
| **MongoDB Compass** | GUI for database inspection during development |
| **npm** | Package manager for all Node.js dependencies |
| **dotenv** | Environment variable management (.env files) |
| **ESLint + Prettier** | Code quality and formatting |

---

## 9. Deployment

| Layer | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploy from GitHub, global CDN |
| Backend | Render / Railway | Node.js hosting with environment variable support |
| Database (Dev) | MongoDB Local (Community Server) | `localhost:27017` — install once, no internet or account needed |
| Database (Prod) | MongoDB Atlas (Free Tier) | Cloud cluster — switch by changing `MONGO_URI` in `.env` |
| File Storage | Cloudinary / AWS S3 | For uploaded documents and generated PDFs |

---

## 10. Package Summary

### Frontend (`package.json`)
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "tailwindcss": "^3.x",
    "socket.io-client": "^4.x"
  }
}
```

### Backend (`package.json`)
```json
{
  "dependencies": {
    "express": "^4.x",
    "mongoose": "^7.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.x",
    "multer": "^1.x",
    "nodemailer": "^6.x",
    "socket.io": "^4.x",
    "puppeteer": "^21.x",
    "qrcode": "^1.x",
    "sharp": "^0.x",          // signature image processing/cropping
    "xlsx": "^0.x",            // parse Excel student list uploads
    "multer-s3": "^3.x"        // stream uploads directly to S3/Cloudinary
    "dotenv": "^16.x",
    "cors": "^2.x"
  }
}
```

---

## Summary

| Layer | Technology |
|---|---|
| Frontend | React.js + Hooks + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database (Dev) | MongoDB Local — `localhost:27017` |
| Database (Prod) | MongoDB Atlas — cloud, free tier |
| Auth | JWT + Bcrypt |
| PDF | Puppeteer / PDFKit |
| QR Code | qrcode (npm) |
| Real-time | Socket.io |
| Email | Nodemailer |
| File Storage | Cloudinary / AWS S3 |
| Deployment | Vercel + Render + MongoDB Atlas |

---

*Tech Stack Document — Campus E-Approval System v1.0*
