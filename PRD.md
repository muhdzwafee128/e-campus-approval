# Campus E-Approval System
### Automated Hierarchical Permission & Workflow Portal
**Product Requirements Document (PRD)**

---

| Field | Details |
|---|---|
| Version | 1.0 |
| Date | February 2026 |
| Status | Draft |
| Project | Campus E-Approval System |

---

### Departments Covered

| Code | Department |
|---|---|
| CS1 | Computer Science & Engineering (Batch 1) |
| CS2 | Computer Science & Engineering (Batch 2) |
| IT | Information Technology |
| ECE | Electronics & Communication Engineering |
| EEE | Electrical & Electronics Engineering |
| MECH | Mechanical Engineering |
| CIVIL | Civil Engineering |
| ECS | Electronics & Computer Science |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Stakeholders & User Roles](#2-stakeholders--user-roles)
3. [Feature 1: Registration & Authentication](#3-feature-1-registration--authentication)
4. [Feature 2: Request Management](#4-feature-2-request-management)
5. [Feature 3: Smart Routing — Dynamic Hierarchical Approval](#5-feature-3-smart-routing--dynamic-hierarchical-approval)
6. [Feature 4: Tracking & Transparency](#6-feature-4-tracking--transparency)
7. [Feature 5: Digital Signatures & Document Generation](#7-feature-5-digital-signatures--document-generation)
8. [Feature 6: Data & Security](#8-feature-6-data--security)
9. [Tech Stack](#9-tech-stack)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Future Enhancements](#11-future-enhancements)
12. [Appendix — Glossary](#12-appendix--glossary)

---

## 1. Introduction

### 1.1 Purpose

This Product Requirements Document (PRD) defines the complete functional and non-functional requirements for the Campus E-Approval System developed for the institution. It serves as the primary reference document for the development team throughout the development lifecycle.

### 1.2 Project Overview

The Campus E-Approval System is a MERN-stack web application that digitizes the paper-based permission and approval workflow of the institution. Students can submit permission requests online, which are intelligently routed through the appropriate chain of authority based on the type of request. Authorities can review, approve, or reject requests remotely, and students receive a digitally signed, QR-verified PDF permission letter upon final approval.

### 1.3 Problem Statement

The current permission process at the institution is manual and paper-based. Students must physically locate and approach multiple authorities to obtain signatures, making the process time-consuming and prone to delays. Key problems include:

- Students waste 2–3 hours per request physically chasing authorities across campus
- Approvals halt completely when faculty are in class, on leave, or off-campus
- Students have zero visibility into where their request is stuck
- Physical documents are frequently lost or misplaced
- No permanent audit trail exists for institutional records

### 1.4 Project Goals

- Build a centralized digital platform to eliminate paper-based requests across the campus
- Implement intelligent workflow routing to reduce approval time from days to minutes
- Ensure full transparency with real-time status tracking for all stakeholders
- Generate legally valid, verifiable digital permission letters with QR codes
- Maintain a permanent, tamper-evident digital audit trail of all requests

### 1.5 Scope

The system covers all student permission requests including duty leave, scholarships, event permissions, document retrieval, original certificate borrowing, season tickets, and fee structure requests. The system is intended for use by students, tutors, faculty in-charge, nodal officers, HODs, and the Principal.

---

## 2. Stakeholders & User Roles

### 2.1 User Roles

The system supports 6 distinct user roles, each with a tailored interface and permissions:

| Role | Responsibilities |
|---|---|
| **Student** | Initiates permission requests, tracks status, downloads approved letters |
| **Class Tutor** | First-level approver for attendance, conduct, and general requests |
| **Nodal Officer** | Approver exclusively for IEDC events and requests |
| **Faculty Coordinator** | Approver for IEEE, TinkerHub, MuLearn, NSS, NCC, and other student clubs/communities. Can be assigned to multiple clubs. |
| **HOD** | Departmental authority for complex requests requiring higher sanction |
| **Principal** | Final authority for high-priority events and institutional approvals |

### 2.2 Dashboard Design

> **Student Dashboard**
> Students get a unique, dedicated dashboard design focused on request submission, real-time status tracking, and downloading approved permission letters.

> **Authority Dashboard (Common Design)**
> All authority roles — Tutor, Nodal Officer, Faculty Coordinator, HOD, and Principal — share a common dashboard design showing their pending requests queue, approval history, and action panel.

---

## 3. Feature 1: Registration & Authentication

### 3.1 Overview

The system provides a secure, role-based authentication system. Each user registers with their institutional credentials and is assigned a role that determines their dashboard, permissions, and capabilities within the system.

### 3.2 Registration

#### Student Registration Fields

| Field | Details |
|---|---|
| Full Name | Text input — required |
| Admission Number | Unique identifier — required |
| Branch / Department | Dropdown selection — required |
| Semester | Dropdown (1–8) — required |
| Year of Admission | Year picker — required |
| Category | Dropdown: TFW / Merit / Management / NRI / Non-KEAM |
| Type of Admission | Dropdown: Regular / Lateral Entry / Spot |
| Date of Birth | Date picker — required (used for auto-calculations) |
| Father's / Mother's Name | Text input — required |
| Whether Hostler | Toggle: Yes / No — if Yes, hostel name field appears |
| Email Address | Institutional/personal email — required |
| Password | Minimum 8 characters with strength indicator |
| Confirm Password | Must match password |

#### Authority Registration Fields

| Field | Details |
|---|---|
| Full Name | Text input — required |
| Staff ID | Unique institutional ID — required |
| Role | Dropdown: Tutor / Nodal Officer / Faculty Coordinator / HOD / Principal |
| Department | Dropdown — required. **Hidden for Faculty Coordinator and Principal** (not applicable) |
| Assigned To (Nodal Officer) | Fixed: IEDC — non-editable, auto-assigned |
| Clubs / Communities (Faculty Coordinator) | Multi-select: IEEE / TinkerHub / MuLearn / NSS / NCC / Other. Can select multiple. |
| Email Address | Institutional email — required |
| Password | Minimum 8 characters |
| Confirm Password | Must match password |
| Signature Upload | **Required for all authority roles.** Upload image (PNG/JPG) OR draw signature on screen using canvas tool. Stored securely and used in auto-generated PDF permission letters. |

### 3.3 Login

- Single login page with role auto-detection based on registered credentials
- JWT (JSON Web Token) based session management
- Role embedded in token to serve the correct dashboard on login
- Session expiry and secure logout
- Forgot password / reset password flow via email

### 3.4 Access Control

Each route and API endpoint is protected based on role. A student cannot access an authority's approval panel, and an authority cannot submit requests on behalf of a student.

---

## 4. Feature 2: Request Management

### 4.1 Overview

Students can submit 7 types of permission requests through a structured online form. Each request type has its own defined input fields, approval hierarchy, and routing logic. All requests are automatically categorized on submission.

### 4.2 Supported Request Types

| # | Request Type | Approval Chain |
|---|---|---|
| 1 | Duty Leave | Tutor (file upload) / Nodal Officer or Tutor → HOD → Principal (event) |
| 2 | Scholarship Recommendation | Tutor → HOD → Principal |
| 3 | Event Conduct Permission | Nodal Officer/Staff In-charge → Principal or HOD → Principal |
| 4 | General Purpose Certificate | Tutor → HOD → Principal → Office |
| 5 | Borrowing Original Certificates | Tutor → HOD → Principal / Admin Officer |
| 6 | Season Ticket / Railway Concession | Tutor → HOD → Office |
| 7 | Fee Structure for Educational Loan | Tutor → HOD → Principal → Office |

### 4.3 Request Type Details

---

#### 4.3.1 Duty Leave

**Sub-type 1.1 — Duty Leave File Upload (Individual Student)**

The student uploads the duty leave sheet or attendance list provided by the event organiser. The file may be a sanction letter or a list of students who attended the event.

| Field | Details |
|---|---|
| Student Name | Auto-filled from profile |
| Admission No | Auto-filled from profile |
| Branch & Semester | Auto-filled from profile |
| Event Date | Date picker — single date |
| Number of Class Hours Missing | Numeric input |
| Reason / Purpose | Text area |
| File Upload | Upload duty leave sheet / attendance list from organiser. Accepted: PDF, Image (JPG/PNG), Excel (.xlsx). Multiple files allowed. |

**Hierarchy:** Student → Class Tutor

---

**Sub-type 1.2 — Duty Leave Sanctioning for Event (Organiser Student)**

This is submitted by the **organiser/coordinator student** to request bulk duty leave approval for all students who attended the event. The organiser uploads the full attendance list and the approving authority sanctions leave for all listed students in one action.

| Field | Details |
|---|---|
| Organiser Name / Admn No / Branch / Semester | Auto-filled from profile |
| Role | Dropdown: Participant / Coordinator |
| Event Name | Text input |
| Event Type | Dropdown: Department / Community-Club / Inter-college / Other |
| Community / Club Name | Conditional — visible if Community-Club selected: IEDC, IEEE, MuLearn, TinkerHub, NCC, NSS, Other |
| Approving Authority | Auto-determined: IEDC → Nodal Officer; IEEE/TinkerHub/MuLearn/NSS/NCC/Other → Faculty Coordinator; Department/Inter-college → Tutor |
| Organizing Institution / Body | Text input |
| Event Date | Date picker — single date only |
| Venue | Text input |
| Number of Class Hours Missing | Numeric input |
| Purpose / Description | Text area |
| Upload List of Students | Upload full attendance list of participating students. Accepted: PDF, Image, Excel (.xlsx). Required. |
| Supporting Document Upload | Invitation letter, brochure, sanction letter (PDF/Image). Optional. |

**Hierarchy by Event Type:**

| Event Type | Approval Chain |
|---|---|
| Branch / Department Event | Tutor → HOD → Principal |
| IEDC Event | Nodal Officer → Principal |
| IEEE / TinkerHub / MuLearn / NSS / NCC / Other Club Event | Faculty Coordinator → Principal |
| Inter-college / External Event | Tutor → HOD → Principal |

---

#### 4.3.2 Scholarship Recommendation

| Field | Details |
|---|---|
| Student Name / Admn No / Semester / Branch | Auto-filled from profile |
| Father's / Mother's Name | Text input |
| Name of Scholarship | Text input |
| Name of Agency Awarding Scholarship | Text input |
| Specific Format Attached | Toggle: Yes / No — if Yes, file upload appears |

**Hierarchy:** Student → Tutor → HOD → Principal

**Office Use (Admin View Only):** Remarks by section, Verification status, Approval by Principal

---

#### 4.3.3 Event Conduct Permission

| Field | Details |
|---|---|
| Applicant Name / Admission No | Auto-filled from profile |
| Position / Role in Organisation | Text input (e.g. Chair, Secretary, Coordinator) |
| Organisation Name | Dropdown: IEDC / IEEE / MuLearn / TinkerHub / NCC / NSS / Department / Other |
| Event Title | Text input |
| Event Type | Dropdown: Online / Offline / Hybrid |
| Event Duration | Toggle: Single Day / Multi-Day |
| Event Date | Date picker — shown when Single Day selected |
| Event Date From → To | Date range picker — shown when Multi-Day selected |
| Event Start Time | Time picker (HH:MM, 12-hour format) |
| Venue | Text input |
| Expected Number of Participants | Numeric input |
| Objective / Description | Text area |
| Supporting Document Upload | Event proposal, brochure (PDF/Image) |

**Hierarchy:**

| Organizer | Approval Chain |
|---|---|
| IEDC Event | Nodal Officer → Principal |
| IEEE / TinkerHub / MuLearn / NSS / NCC / Other Club | Faculty Coordinator → Principal |
| Department Event | HOD → Principal |

> *An auto-generated formal permission letter addressed to The Principal will be previewed before submission, populated from the above fields.*

---

#### 4.3.4 General Purpose Certificate

| Field | Details |
|---|---|
| Student Name / Admn No / Semester / Branch | Auto-filled from profile |
| Year of Admission / Period of Study | Auto-filled from profile |
| Category | Dropdown: TFW / Merit / Management / NRI |
| Type of Certificate Needed | Dropdown: Conduct / Bonafide / Course Completion / KSRTC Pass / Other |
| Specify (if Other) | Conditional text field |
| Purpose | Text area |

**Hierarchy:** Student → Tutor → HOD → Principal → Office

**Office Use (Admin View Only):** Certificate Prepared By, Scrutiny By, Approved by Principal, Received Certificate confirmation

---

#### 4.3.5 Borrowing Original Certificates

| Field | Details |
|---|---|
| Student Name / Admn No / Semester / Branch | Auto-filled from profile |
| Type of Admission | Dropdown: Regular / Lateral Entry / Spot |
| Required Original Certificate(s) | Multi-select: 10th / Plus Two / Diploma / Other (specify) |
| Purpose for which certificate is sought | Text area |
| Expected Date of Return | Date picker |

**Hierarchy:** Student → Tutor → HOD → Principal / Administrative Officer

**Office Use (Admin View Only):** Remarks by section, Sanctioned issue confirmation, List of certificates (dynamic table), Signature of Principal/Admin Officer, Received confirmation

---

#### 4.3.6 Season Ticket / Railway Concession

| Field | Details |
|---|---|
| Student Name / Admn No / Class / Branch | Auto-filled from profile |
| Date of Birth | Auto-filled from profile |
| Age | Auto-calculated from DOB |
| From Station | Text input |
| To Station | Text input |

**Hierarchy:** Student → Tutor → HOD → Office

**Office Use (Admin View Only):** Prepared By, Scrutinized By, Approved By Principal, Received confirmation

---

#### 4.3.7 Fee Structure for Educational Loan

| Field | Details |
|---|---|
| Student Name / Admn No / Branch / Semester | Auto-filled from profile |
| Father's / Mother's Name | Text input |
| Year of Study | Auto-filled from profile |
| Category | Dropdown: TFW / Merit / Management / NRI / Non-KEAM |
| Type of Admission | Dropdown: Regular / Lateral Entry / Spot |
| Whether Hostler | Toggle: Yes/No — if Yes, hostel name field appears |
| Additional Requirements | Checkboxes: Examination Fee / Bus Fee / Textbooks & Notebooks / Uniform Expense / Laptop / Project |
| Purpose | Dropdown: Loan / Scholarship / Other (specify) |
| Name of Bank / Other Institution | Text input |
| Bank Branch | Text input |

**Hierarchy:** Student → Tutor → HOD → Principal → Office

**Office Use (Admin View Only):** Remarks by section, Scrutinized By, Approved By Principal, Received certificate confirmation

---

## 5. Feature 3: Smart Routing — Dynamic Hierarchical Approval

### 5.1 Overview

The core innovation of this system is its intelligent workflow routing engine. Unlike static approval systems that route every request through the full chain, the Campus E-Approval System dynamically determines the appropriate approval chain based on the request type, sub-type, and metadata provided at submission. This reduces unnecessary involvement of senior authorities for simple requests, cutting processing time by **40–60%**.

### 5.2 Routing Rules

| Request Type | Complexity | Approval Chain |
|---|---|---|
| Duty Leave — File Upload | Simple | Student → Tutor |
| Duty Leave — Dept/Inter-college Event | Complex | Tutor → HOD → Principal |
| Duty Leave — IEDC Event | Medium | Nodal Officer → Principal |
| Duty Leave — IEEE/TinkerHub/MuLearn/NSS/NCC/Other | Medium | Faculty Coordinator → Principal |
| Scholarship Recommendation | Complex | Tutor → HOD → Principal |
| Event Conduct — IEDC | Medium | Nodal Officer → Principal |
| Event Conduct — IEEE/TinkerHub/MuLearn/NSS/NCC/Other | Medium | Faculty Coordinator → Principal |
| Event Conduct — Department | Medium | HOD → Principal |
| General Purpose Certificate | Complex | Tutor → HOD → Principal → Office |
| Borrowing Original Certificates | Complex | Tutor → HOD → Principal / Admin Officer |
| Season Ticket | Simple | Tutor → HOD → Office |
| Fee Structure for Loan | Complex | Tutor → HOD → Principal → Office |

### 5.3 Approval Actions

- Each authority in the chain can: **Approve** (with optional comment) or **Reject** (with mandatory reason)
- On approval, the request is automatically forwarded to the next authority in the chain
- On rejection, the student is immediately notified with the rejection reason and authority name
- Approved requests at the final level trigger automatic PDF generation

### 5.4 Comments

- Each authority can add a comment/note when approving or rejecting
- Comments are visible to all subsequent approvers and to the student
- Rejection requires a mandatory reason comment

---

## 6. Feature 4: Tracking & Transparency

### 6.1 Student Dashboard — Status Tracking

The student dashboard provides full visibility into all submitted requests. For each request, the student can see:

- Current status: **Pending / In Progress / Approved / Rejected**
- Current authority holding the request (e.g. *"Awaiting HOD approval"*)
- Complete approval trail showing each stage with timestamp and authority name
- Comments or remarks added by each authority at every stage
- Estimated processing time based on request complexity

### 6.2 Authority Dashboard — Pending Queue

The authority dashboard (shared design across all non-student roles) shows:

- Queue of all pending requests assigned to that authority
- Request type, student name, submission date, and urgency indicator
- Quick approve / reject action panel
- History of all previously actioned requests with outcomes

### 6.3 Approval Trail

Every request maintains a full approval trail — a timestamped log of every action taken:

| Event | Details |
|---|---|
| Submitted | Date and time of student submission |
| Forwarded to [Authority] | Timestamp when routed to each level |
| Approved by [Authority Name] | Timestamp + authority name + comment |
| Rejected by [Authority Name] | Timestamp + authority name + rejection reason |
| Final Approval | Timestamp of last approval + PDF generation event |

---

## 7. Feature 5: Digital Signatures & Document Generation

### 7.1 Digital Signatures

#### Signature Registration (during onboarding)

All authority roles — Tutor, Nodal Officer, Faculty Coordinator, HOD, and Principal — must register their signature during account registration. Two input methods are supported:

| Method | Details |
|---|---|
| **Upload Image** | Upload a PNG or JPG scan/photo of handwritten signature. Max 2MB. Cropped to signature area. |
| **Draw on Screen** | Use the built-in canvas drawing tool to draw signature using mouse or touchscreen. Saved as PNG. |

The registered signature is stored securely and automatically embedded in all PDF permission letters where that authority is part of the approval chain.

#### Signature Use in Approvals

- When an authority approves a request, their stored signature image is cryptographically recorded against that approval step
- The final permission letter includes the signature image of every authority in the approval chain
- Signatures are tamper-evident — any modification to the document invalidates the signature
- Each signature block in the PDF displays: signature image, authority name, designation, and timestamp of approval
- Authorities can update their signature at any time from their profile settings

### 7.2 Auto-Generated PDF Permission Letter

Upon final approval, the system automatically generates a PDF permission letter. The format **mirrors the official physical forms** used by the institution — same layout, same sections, same formal structure — but digitally filled and signed.

#### Page Setup
- Paper size: A4 (210mm x 297mm), Portrait
- Font: Times New Roman (matches traditional official form style)
- Color: Black and white (print-compatible)
- Margins: Top 25mm, Bottom 20mm, Left 25mm, Right 20mm

#### Document Structure (top to bottom)

**1. Header**
- College name: COLLEGE OF ENGINEERING, THALASSERY — bold, centered
- Department name (if applicable)
- Horizontal rule
- Date (right-aligned, auto-populated with approval date)
- Document title: REQUEST FOR [TYPE OF PERMISSION] — bold, underlined, centered

**2. Student Details Section**
Auto-populated in the two-column layout of the physical forms:

| Field | Source |
|---|---|
| Name | Student profile (auto) |
| Admission No | Student profile (auto) |
| Semester | Student profile (auto) |
| Branch | Student profile (auto) |
| Year of Admission | Student profile (auto) |
| Category (TFW/Merit/Management/NRI) | Student profile (auto) |
| Father's / Mother's Name | Profile or form input |

**3. Request Body Section**
Populated from submitted form fields. Each request type has its own body format:

- **Duty Leave (Event):** Role, Event Name, Event Type, Organising Body, Dates, Venue, Class Hours Missing, Purpose
- **Scholarship:** Father/Mother name, Scholarship name, Agency name, Format attached
- **Event Conduct Permission:** Full formal letter format addressed to The Principal — includes student's position, organisation, event title, dates, venue, objective, and assurance statement
- **General Certificate:** Certificate type (Conduct/Bonafide/Course Completion/KSRTC Pass/Other), Purpose
- **Borrow Certificate:** Certificate type(s), Purpose, Expected return date
- **Season Ticket:** Tabular format — Name, DOB, Age, From Station, To Station
- **Fee Structure:** Checklist of additional requirements, Purpose, Bank details

**4. Approval Signatures Section**
Mirrors the "Particulars verified and recommended" section of the physical forms. Shows only authorities who were part of that request's approval chain:

```
Particulars verified and recommended:

Group Tutor:   [Digital Signature Block]
               Name: _______________   Approved: DD/MM/YYYY HH:MM

HOD:           [Digital Signature Block]
               Name: _______________   Approved: DD/MM/YYYY HH:MM

Principal:     [Digital Signature Block]
               Name: _______________   Approved: DD/MM/YYYY HH:MM
                                                         Approved
```

**5. For Office Use Only Section**
Separated by a full-width horizontal rule, matching the physical form exactly:
- Certificate prepared by / Scrutiny by
- Remarks by section
- Verification
- Approval by Principal
- Received certificate (student acknowledgement)

**6. Footer — QR Code & Verification**
Bottom of document, right-aligned QR code (2cm x 2cm):
- Request ID: REQ-2026-XXXX
- Date of issue
- Verification URL
- "This is a digitally approved document. Scan the QR code to verify authenticity."

#### Conditional Rendering per Request Type

| Request Type | Signatures Shown |
|---|---|
| Duty Leave — File Upload | Tutor only |
| Duty Leave — Event | Tutor + HOD + Principal |
| Scholarship | Tutor + HOD + Principal |
| Event Conduct — IEDC | Nodal Officer + Principal |
| Event Conduct — Other Clubs | Faculty Coordinator + Principal |
| Event Conduct — Department | HOD + Principal |
| General Certificate | Tutor + HOD + Principal |
| Borrow Certificate | Tutor + HOD + Principal / Admin Officer |
| Season Ticket | Tutor + HOD |
| Fee Structure | Tutor + HOD + Principal |

### 7.3 QR Code Verification

A QR code is embedded in every approved permission letter. When scanned:

- The verifier is directed to a public verification page (`/verify/REQ-XXXX`)
- The page displays: student name, request type, approval chain, all authority signatures with timestamps, and current status
- The verifier can confirm the letter is authentic and untampered
- This allows security staff, external institutions, or faculty to instantly verify any permission letter without contacting the college office

---

## 8. Feature 6: Data & Security

### 8.1 Database

- **Technology:** MongoDB (Cloud — MongoDB Atlas)
- All request records, user profiles, approval trails, and generated documents are stored centrally
- Data is never deleted — all records are permanently archived for auditing
- Collections are indexed for fast queries (by student, request type, status, and date)

### 8.2 Security Measures

| Security Layer | Implementation |
|---|---|
| Authentication | JWT (JSON Web Token) with role-based claims |
| Password Storage | Bcrypt hashing — passwords never stored in plain text |
| API Protection | All endpoints protected by role-based middleware |
| Data Transmission | HTTPS only — all data encrypted in transit |
| Session Management | Token expiry + secure logout clears session |
| Digital Signature Integrity | Cryptographic signing ensures document authenticity |
| QR Verification | Signed verification URLs prevent forgery |

### 8.3 Audit Trail

The system maintains a permanent, immutable digital history of all requests including: who submitted, when, what was requested, every action taken by every authority, timestamps for all events, and outcomes. This history is accessible to the Principal and Admin for institutional auditing.

---

## 9. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React.js (with Hooks) | UI, routing, dashboards |
| Backend | Node.js + Express.js | REST API, business logic, routing engine |
| Database | MongoDB (Cloud Atlas) | Data storage and retrieval |
| Authentication | JWT + Bcrypt | Secure auth and password handling |
| PDF Generation | Puppeteer / PDFKit | Auto-generate permission letters |
| QR Code | qrcode (npm) | QR generation for verification |
| Real-time Updates | Socket.io / Polling | Live status tracking |
| File Upload | Multer + Cloud Storage | Document uploads from students |
| Email Notifications | Nodemailer | Status update alerts |
| Deployment | Render / Railway / Vercel | Cloud hosting |

---

## 10. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Performance | API responses within 2 seconds under normal load |
| Availability | System available 99% of the time during academic hours |
| Scalability | Architecture supports future integration with college ERP systems |
| Usability | Intuitive interface requiring no training for students or faculty |
| Mobile Responsiveness | All dashboards and forms fully responsive on mobile and tablet |
| Data Integrity | All approval trails and records are immutable once created |
| Browser Support | Chrome, Firefox, Edge, Safari (latest versions) |

---

## 11. Future Enhancements

- AI-driven approval time prediction based on historical data
- Blockchain-based audit trails for enhanced tamper-evidence
- Native mobile app (Android/iOS)
- Integration with college ERP / student information systems
- Multi-institutional support for other colleges
- Delegate/substitute mechanism when an authority is unavailable
- Push notification support

---

## 12. Appendix — Glossary

| Term | Definition |
|---|---|
| PRD | Product Requirements Document |
| MERN | MongoDB, Express.js, React.js, Node.js — the full-stack JavaScript framework used |
| JWT | JSON Web Token — used for secure, stateless authentication |
| HOD | Head of Department |
| IEDC | Innovation and Entrepreneurship Development Centre |
| IEEE | Institute of Electrical and Electronics Engineers (student branch) |
| NCC | National Cadet Corps |
| NSS | National Service Scheme |
| QR Code | Quick Response Code — used for instant document verification |
| TFW | Tuition Fee Waiver |
| Dynamic Hierarchy | The system's ability to adjust the approval chain based on request type |
| Approval Trail | Complete timestamped log of all actions taken on a request |

---

*End of Document — Campus E-Approval System PRD v1.0*
