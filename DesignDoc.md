# Design Document
## Campus E-Approval System
**Visual Design and User Experience Specification**

---

> **Scope Note:** This is a mini project. Design must be minimal and functional. No landing pages, no marketing sections, no forgot password flows, no animations, no illustration libraries. Every screen serves one direct purpose.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Layout Structure](#4-layout-structure)
5. [Component Behavior](#5-component-behavior)
6. [User Flows](#6-user-flows)
7. [Dashboard Designs](#7-dashboard-designs)
8. [PDF Permission Letter UI](#8-pdf-permission-letter-ui)
9. [Responsive Design](#9-responsive-design)
10. [Iconography](#10-iconography)
11. [Design Dos and Donts](#11-design-dos-and-donts)

---

## 1. Design Philosophy

**Minimal. Functional. Institutional.**

- Every screen has one job
- No landing page, no hero sections, no marketing copy
- Login leads directly to Dashboard
- Authorities see their pending queue immediately on login
- Students see their request status immediately on login
- No clutter, no decorative elements, no AI-generated filler UI

---

## 2. Color System

Taken directly from the actual UI screenshots provided.

### Core Palette

| Role | Hex | Usage |
|---|---|---|
| Navy Primary | `#1E3A5F` | Navbar, sidebar active border, primary buttons, headings |
| White | `#FFFFFF` | Sidebar background, cards, inputs |
| Page Background | `#F8FAFC` | Main content area |
| Border | `#E2E8F0` | Card borders, input borders, dividers |
| Text Primary | `#1E293B` | Page titles, bold labels |
| Text Secondary | `#64748B` | Subtext, captions, helper text |

### Status Colors

| Status | Hex | Usage |
|---|---|---|
| Pending | `#F59E0B` | Pending badge, stat card icon |
| Approved | `#10B981` | Approved badge, stat card icon |
| Rejected | `#EF4444` | Rejected badge, reject button |
| In Progress | `#3B82F6` | In-progress badge |

### Role Badge Colors

| Role | Background | Text |
|---|---|---|
| Student | `#DBEAFE` | `#1E40AF` |
| Tutor | `#D1FAE5` | `#065F46` |
| Nodal Officer | `#FEF3C7` | `#92400E` |
| Faculty Coordinator | `#FFEDD5` | `#9A3412` |
| HOD | `#FCE7F3` | `#9D174D` |
| Principal | `#F1F5F9` | `#334155` |

---

## 3. Typography

### Font

```
Primary:  Inter (Google Fonts)
Fallback: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif
Mono:     JetBrains Mono — Request IDs only
```

### Scale

| Name | Size | Weight | Usage |
|---|---|---|---|
| Page Title | 24px | 700 | Dashboard greeting, page headings |
| Section Title | 18px | 600 | Card headers, section names |
| Body | 14px | 400 | All general text |
| Label | 13px | 500 | Form labels, sidebar items, table headers |
| Caption | 12px | 400 | Timestamps, helper text, step labels |
| Badge | 11px | 500 | Status chips, role pills |

---

## 4. Layout Structure

Directly mirrors the UI shown in the provided screenshots.

### Overall Structure

```
+--------------------------------------------------+
|           NAVBAR (64px)  navy #1E3A5F            |
+----------+---------------------------------------+
|          |                                       |
| SIDEBAR  |       MAIN CONTENT AREA              |
| 240px    |       background #F8FAFC             |
| white bg |                                       |
|          |   Page Title (24px bold)              |
| Nav      |   Subtitle / step label (14px muted) |
| Items    |                                       |
|          |   [ Cards / Forms ]                   |
|          |                                       |
+----------+---------------------------------------+
```

### Navbar

Exactly as shown in screenshots:

- Background: `#1E3A5F` navy
- Left: Logo icon + **E-Approval System** (white bold) + institution name (muted white, smaller)
- Right: Bell icon + Username + Role label + Avatar circle (initials) + Logout icon
- Height: 64px
- No search bar, no dropdown menus

### Sidebar

Exactly as shown in screenshots:

- Background: `#FFFFFF`
- Right border: `1px solid #E2E8F0`
- Width: 240px
- Top: "Logged in as" (caption) > name (bold) > dept or role below
- Nav items: icon + label, 48px height
- Active item: left border `3px solid #1E3A5F` + `#EFF6FF` background
- Hover: `#F8FAFC`

**Student sidebar:** Dashboard, My Requests, New Request, Settings

**Authority sidebar:** Dashboard, Pending Queue, History, Settings

### Content Area

- Background: `#F8FAFC`
- Padding: `32px`
- Page title: 24px, 700, `#1E293B`
- Subtitle or step label: 14px, `#64748B`

### Cards

- Background: `#FFFFFF`
- Border: `1px solid #E2E8F0`
- Border-radius: `10px`
- Padding: `24px`
- Shadow: `0 1px 2px rgba(0,0,0,0.06)` subtle only

---

## 5. Component Behavior

### 5.1 Buttons

| Type | Style | Usage |
|---|---|---|
| Primary | Navy `#1E3A5F` bg, white text | Submit, Approve, Save |
| Secondary | White bg, navy border and text | Cancel, Back |
| Danger | Red `#EF4444` bg, white text | Reject |
| Ghost | No bg, no border, navy text | View, Download |

- Border-radius: `8px`, Padding: `10px 18px`, Font: 14px 500
- No gradients, no box shadows

### 5.2 Form Inputs

- Border: `1px solid #E2E8F0`, Border-radius: `8px`, Padding: `10px 12px`
- Focus: border changes to `#1E3A5F`, no glow ring
- Error: border `#EF4444` + red caption below
- Label: 13px, 500, above input
- Helper text: 12px, `#64748B`, below input

### 5.3 Status Badges

Pill shape. Colored dot + label. Always both — never color alone.

- Pending: amber dot + amber text on amber-tinted background
- Approved: green dot + green text on green-tinted background
- Rejected: red dot + red text on red-tinted background
- In Progress: blue dot + blue text on blue-tinted background
- Padding: `3px 10px`, Border-radius: `999px`, Font: 11px 500

### 5.4 Stat Cards (Dashboard)

Exactly as in screenshots. Icon box left, count + label right:

- Icon in a soft rounded square, color matches status
- Count: 24px bold
- Label: 13px muted
- Card border: `1px solid #E2E8F0`

### 5.5 Request Type Selection (New Request Step 1)

Grid of cards exactly as in screenshot:

- 5 per row on desktop, wraps on smaller screens
- Each card: icon centered top, bold title, subtitle (e.g. File Upload), short description line
- Hover: border becomes navy, light background tint
- Selected: navy border, light blue background

### 5.6 Request List Rows (My Requests)

Simple list rows:

- Request type and sub-type (bold)
- Date submitted (caption)
- Status badge
- Step indicator: "Step 2 of 3 — Awaiting HOD" (caption)
- Download button only if Approved

### 5.7 Approval Action Panel (Authority)

- Student info: name, branch, semester
- Request type + key form fields summary
- Attachment link if file uploaded
- Comment textarea (required on reject)
- Reject button (red, left) | Approve button (navy, right)

### 5.8 Approval Trail Timeline

Simple vertical list:

- Completed: filled green dot + authority name + timestamp + comment (if any)
- Current: filled blue dot + "Awaiting [Authority Name]"
- Pending: empty gray circle + authority name + dash
- Thin connecting line between dots

### 5.9 Signature Upload Component (Authority Registration)

Two tabs — Upload and Draw:

**Upload tab:** File input, PNG or JPG only, max 2MB. Preview in a bordered box after upload. Remove link to clear.

**Draw tab:** HTML5 canvas, white background, thin border. Draw with mouse on desktop or touch on mobile. Clear button + Save Signature button below canvas. Preview shown after saving.

Required field — shows error if submitted without a saved signature.

---

## 6. User Flows

### 6.1 Login Flow

```
App opens
  > Login screen
      Email input
      Password input
      Login button
  > Role detected from account
      Student   > Student Dashboard
      Authority > Pending Queue
```

No registration screen in the UI. No forgot password. No reset password. Not in scope for mini project.

### 6.2 Student — Submit Request (3-step)

Step progress bar shown at top of page as in screenshot:

```
Step 1 of 3 — Select Type
  8 request type cards in a grid
  Click one to proceed

Step 2 of 3 — Fill Form
  Auto-filled profile fields
  Conditional fields per type:
    Event Conduct:        Single Day / Multi-Day toggle + Start Time
    Duty Leave Sanction:  Upload student attendance list
  File upload where required

Step 3 of 3 — Preview and Submit
  Read-only summary of all filled fields
  Approval chain shown (auto-determined)
  Submit button
  On submit: Request ID generated, redirect to Dashboard
```

### 6.3 Student — Track Request

```
My Requests
  List of all requests with status badge and step indicator
  Click any row to expand
    All submitted fields (read-only)
    Approval trail timeline
    Authority comments at each step
    Download Letter button (only if Approved)
```

### 6.4 Authority — Approve or Reject

```
Login > Dashboard = Pending Queue (home screen)
  List sorted oldest first, assigned to this authority only
  Click any row
    Student info + full form fields
    Previous approvals in chain
    Attachment viewer if file uploaded
    Comment box + Approve / Reject
  On Approve: forwarded to next authority or PDF generated
  On Reject: student notified with reason
```

### 6.5 Download Approved Letter

```
My Requests > Find Approved request
  Click Download Letter
  PDF opens in new tab
    Date + document title (no college name in header)
    Student details two-column layout
    Form data body
    Signature blocks: actual image + name + timestamp per authority
    FOR OFFICE USE ONLY section
    QR code bottom-right (2cm)
  Save or Print
  Verifier scans QR > /verify/REQ-XXXX (public, no login needed)
```

---

## 7. Dashboard Designs

### 7.1 Student Dashboard

Mirrors screenshot exactly:

```
Navbar (navy)
Sidebar          | Content area (off-white)
Logged in as     |
[name] bold      | Good morning, [name]
[Dept]           | [Dept] . Semester X . Admn: XXXXXX
                 |
Dashboard   <    | [Pending 0]  [Approved 0]  [Total 0]
My Requests      |
New Request      | Recent Requests                View all >
Settings         | -----------------------------------------------
                 | [clipboard icon - empty state]
                 | No requests yet
                 | Submit your first permission request to get started
                 |
                 | [Need a permission? - navy CTA banner]
                 | [+ Submit New Request  button]
```

### 7.2 Authority Dashboard

```
Navbar (navy)
Sidebar          | Content area (off-white)
Logged in as     |
[name] bold      | Pending Approvals (N)
[Role]           |
                 | [Student name] - [Request type]
Dashboard   <    | [Key detail] . [X days waiting]       [Review]
Pending Queue    |
History          | [Student name] - [Request type]
Settings         | [Key detail] . [X days waiting]       [Review]
                 |
                 | [Pending: N]  [Approved: N]  [Rejected: N]
```

---

## 8. PDF Permission Letter UI

### Download Button

- Secondary or ghost style with Download icon
- Visible only when status is Approved
- Disabled while PDF is being generated

### PDF Design

- A4, portrait, black and white, Times New Roman
- No college name or department in header
- Header: Document title (REQUEST FOR...) + Date right-aligned
- Student details: two-column layout
- Request body fields (varies per request type)
- Signature blocks per approving authority: actual signature image + name + timestamp
- FOR OFFICE USE ONLY section
- Footer: Request ID + QR code (2cm, bottom-right)

### QR Verification Page

Simple public page at `/verify/REQ-XXXX`. No login required.

- Valid: green banner — "Document verified and authentic"
- Invalid: red banner — "Could not verify this document"
- Shows: student name, request type, approval chain with timestamps

---

## 9. Responsive Design

Desktop-first for mini project scope.

| Screen | Behavior |
|---|---|
| Desktop above 1024px | Full layout as shown in screenshots |
| Tablet 640 to 1024px | Sidebar collapses to icons only (56px wide) |
| Mobile below 640px | Sidebar hidden, hamburger toggle, single column layout |

---

## 10. Iconography

Use **Lucide React** — consistent with the screenshot UI style.

| Icon | Usage |
|---|---|
| `Home` | Dashboard |
| `FileText` | My Requests |
| `FilePlus` | New Request |
| `Settings` | Settings |
| `Bell` | Notifications |
| `LogOut` | Logout |
| `CheckCircle` | Approved status |
| `XCircle` | Rejected status |
| `Clock` | Pending status |
| `Download` | Download letter |
| `QrCode` | QR code feature |
| `Upload` | File upload |
| `PenTool` | Signature draw tool |
| `ChevronRight` | Navigation arrow |

---

## 11. Design Dos and Donts

### Dos

- Match the UI from the screenshots exactly: navbar, sidebar, card layout
- Auto-fill all known profile fields in every form
- Show step progress bar (Step X of 3) on the New Request form
- Show the approval chain on the preview screen before submitting
- Empty state: simple icon + one short message
- Mark required fields with an asterisk only

### Donts

- No landing page or marketing sections of any kind
- No forgot password or reset password flow
- No animations or transitions beyond basic hover states
- No illustration packs or Lottie animations
- No dark mode
- No profile photo uploads
- No auto-save drafts
- No modal dialogs for complex actions
- No skeleton loaders — a basic spinner is sufficient
- No features not listed in the PRD

---

*Design Document — Campus E-Approval System v1.0 (Mini Project)*
