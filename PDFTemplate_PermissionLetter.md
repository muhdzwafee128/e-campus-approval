# PDF Permission Letter — Template Specification
## Campus E-Approval System
**Auto-Generated Document Format Reference**

---

## Overview

Every approved request generates a PDF permission letter that mirrors the official paper forms used by the institution. The format follows the exact layout of the physical forms — formal letter style with college header, student details, request body, approval signatures, and office use section.

---

## 1. General Layout Structure

```
+----------------------------------------------------------+
|                                    Date: DD/MM/YYYY      |
|  REQUEST FOR [TYPE OF PERMISSION]                        |
|  [Sub-type if applicable]                                |
+----------------------------------------------------------+
|                                                          |
|  STUDENT DETAILS SECTION                                 |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  REQUEST BODY / DETAILS SECTION                          |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  APPROVAL SIGNATURES SECTION                             |
|                                                          |
+----------------------------------------------------------+
+----------------------------------------------------------+
|  [QR CODE — bottom right]    Unique Request ID           |
|  Verify at: eapproval.cet.ac.in/verify/REQ-XXXX         |
+----------------------------------------------------------+
```

---

## 2. Header Section

### Layout
- **Date:** right-aligned, auto-populated with approval date
- Document title: bold, underlined, centered
- No college name or department displayed in any PDF
- No horizontal rules between sections throughout the document

### Example
```
                                          Date: 22/02/2026

          REQUEST FOR DUTY LEAVE — EVENT ATTENDANCE
```

---

## 3. Student Details Section

Auto-populated from the student's profile and submitted form. Matches the two-column layout of the physical forms.

### Layout (mirrors physical form exactly)

```
Name: ________________________    Admn. No.: ________________

Semester: ____________________    Branch: ___________________

Year of Admission / Period of Study: _______________________

Category: (TFW / Merit / Management / NRI): ________________
```

### Fields shown (vary by request type)

| Field | Source |
|---|---|
| Name | Student profile (auto) |
| Admission No | Student profile (auto) |
| Semester | Student profile (auto) |
| Branch | Student profile (auto) |
| Year of Admission | Student profile (auto) |
| Category | Student profile (auto) |
| Father's / Mother's Name | Student profile or form input |
| Type of Admission | Student profile (auto) |

---

## 4. Request Body Section

This section varies per request type, populated from the submitted form fields. Follows the body style of the physical forms — dotted lines for filled values, clear labels.

### 4.1 Duty Leave — File Upload (Sub-type 1.1)

```
Event Date: ___________________________________________________

Number of Class Hours Missing: ________________________________

Reason / Purpose:
_______________________________________________________________

Uploaded File(s): [ Duty leave sheet / Attendance list ]
```

### 4.2 Duty Leave — Event Sanctioning (Sub-type 1.2)

```
Role: [ Participant / Coordinator ]

Event Name: ___________________________________________________

Event Type: ___________________________________________________

Community / Club Name (if applicable): ________________________

Organizing Institution / Body: ________________________________

Event Date: ___________________________________________________

Venue: ________________________________________________________

Number of Class Hours Missing: ________________________________

Purpose / Description:
_______________________________________________________________

Uploaded Student List: [ Attendance list of participants ]
```

---

### 4.2 Scholarship Recommendation

```
Name of Father / Mother: ______________________________________

Name of Scholarship: __________________________________________

Name of Agency Awarding Scholarship: _________________________

Whether specific format attached: [ Yes / No ]
```

---

### 4.3 Event Conduct Permission

Follows the formal letter format. No college name or department in the header.

```
From,

Name: ________________________________________________________
Position in (Organisation Name): ____________________________
Date: DD/MM/YYYY

To,
The Principal,

Subject: Request for Permission to Conduct a/an _____________ Event

Respected Sir/Madam,

I, [Student Name], serving as [Position] of [Organisation Name],
would like to request permission to conduct an event titled
"[Event Title]".

The event is proposed to be conducted on [Event Date] /
from [Start Date] to [End Date] at [Event Start Time],
at [Venue]. The objective of this program is to enhance
students' learning, skill development, and collaborative
growth through the [Organisation Name] platform.

We assure you that the event will be organized responsibly and
all institutional rules and regulations will be strictly followed.
We kindly request your approval and necessary support to conduct
the event successfully.

Thanking you.
                                         Yours faithfully,


Signature: ___________________
Name: _______________________
Position in (Organisation Name): ____________________________
```

---

### 4.4 General Purpose Certificate

```
Year of Admission / Period of Study: ________________________

Category: (TFW / Merit / Management / NRI): _________________

Type of certificate needed:
[ Conduct / Bonafide / Course Completion / KSRTC Pass / Other ]

Specify (if Other): _________________________________________

Purpose:
_______________________________________________________________
_______________________________________________________________
```

---

### 4.5 Borrowing Original Certificates

```
Type of Admission: [ Regular / Lateral Entry / Spot ]

1. Required original certificate(s):
   [ 10th / Plus Two / Diploma / Other (specify) ]
   ___________________________________________________________

2. Purpose for which certificate is sought:
   ___________________________________________________________

3. Expected Date of Return: ________________________________
```

---

### 4.6 Season Ticket / Railway Concession

```
Class / Semester: ___________    Branch: ____________________

+--------+------------+-----+------------------+------------+
|  NAME  |    DOB     | AGE |       FROM       |     TO     |
+--------+------------+-----+------------------+------------+
|        |            |     |                  |            |
+--------+------------+-----+------------------+------------+
```

---

### 4.7 Fee Structure for Educational Loan

```
Name of Father / Mother: ____________________________________

Category: (TFW / Merit / Management / NRI / Non-KEAM): ______

Type of Admission: [ Regular / Lateral Entry / Spot ]

Whether Hostler: [ Yes / No ]   If Yes, Hostel Name: ________

Additional Requirements:
  Examination Fee          : [ Yes / No ]
  Bus Fee                  : [ Yes / No ]
  Textbooks, Records &
    Notebooks              : [ Yes / No ]
  Uniform Expense          : [ Yes / No ]
  Laptop                   : [ Yes / No ]
  Project                  : [ Yes / No ]

Purpose: [ Loan / Scholarship / Other ]: ____________________

Name of Bank / Other: ___________________  Branch: __________
```

---

## 5. Approval Signatures Section

Mirrors the "Particulars verified and recommended" section of the physical forms. Shows only the authorities who were part of the approval chain for that request type.

### Layout

```
Particulars verified and recommended:


Group Tutor:  Signature: ________________
              Name: _____________________


HOD:          Signature: ________________
              Name: _____________________


Principal:    Approved
              Signature: ________________
              Name: _____________________
```

### Digital Signature Representation

In the PDF, each authority's section shows:
- Authority name and designation
- Timestamp of approval: `Approved on: 22/02/2026 at 11:34 AM`
- A styled digital signature block with a border
- A small checkmark icon indicating verified approval

### Example (rendered in PDF)

```
+-------------------------------+  +-------------------------------+
|  GROUP TUTOR                  |  |  HOD                          |
|                               |  |                               |
|  [Digital Signature Block]    |  |  [Digital Signature Block]    |
|                               |  |                               |
|  Name: Prof. Suresh K.        |  |  Name: Dr. Anand P.           |
|  Approved: 20/02/2026 10:15AM |  |  Approved: 21/02/2026 02:30PM |
+-------------------------------+  +-------------------------------+

+----------------------------------------------+
|  PRINCIPAL                                   |
|                                              |
|  [Digital Signature Block]                   |
|                                              |
|  Name: Dr. Rajesh M.                         |
|  Approved: 22/02/2026 11:34AM                |
|                              Approved        |
+----------------------------------------------+
```

---

## 6. For Office Use Only Section

This section is **NOT included** in all permission letters. It appears only for request types that require physical office processing after digital approval.

### Request Types WITH Office Use Section

| Request Type | Reason |
|---|---|
| General Purpose Certificate | Certificate must be physically prepared and scrutinized by office staff |
| Borrowing Original Certificates | Physical certificates must be issued and tracked by office |
| Season Ticket / Railway Concession | Concession form must be prepared and sanctioned by office |
| Fee Structure for Educational Loan | Fee certificate must be prepared and verified by section |

### Request Types WITHOUT Office Use Section

| Request Type | Reason |
|---|---|
| Duty Leave (File Upload) | No physical document processing needed |
| Duty Leave (Event Sanctioning) | Digital approval letter is sufficient |
| Scholarship Recommendation | Recommendation letter is auto-generated digitally |
| Event Conduct Permission | Permission letter is auto-generated digitally |

### Office Use Layout (shown only on applicable request types)

```
                     FOR OFFICE USE ONLY

Certificate prepared by: _______________  Scrutiny by: ________


Remarks by section: ___________________________________________


Verification: _________________________________________________


                                                    Approved

                                                    Principal


Received certificate: _________________________________________

Date: ___________________    Signature of the student: ________
```

---

## 7. Footer Section (QR Code & Verification)

Appears at the very bottom of the document, below all content.

### Layout

```
+------------------------------------------------------+-----+
|                                                      | QR  |
|  Request ID: REQ-2026-IT-0042                        | [ ] |
|  Issued: 22/02/2026                                  | [ ] |
|  Verify at: eapproval.cet.ac.in/verify/REQ-2026-0042 | [X] |
|                                                      |     |
|  This is a digitally approved document.              +-----+
|  Scan the QR code to verify authenticity.                  |
+------------------------------------------------------------+
```

### QR Code Details
- Size: 2cm x 2cm, bottom-right corner
- Encodes: full verification URL with unique request token
- Verification page shows: student name, request type, approval chain, all signatures, status

---

## 8. Typography & Styling for PDF

| Element | Font | Size | Style |
|---|---|---|---|---|
| Document Title | Times New Roman | 13pt | Bold, Underline, Centered |
| Section Headers | Times New Roman | 11pt | Bold |
| Field Labels | Times New Roman | 10pt | Regular |
| Field Values | Times New Roman | 10pt | Regular |
| FOR OFFICE USE ONLY | Times New Roman | 11pt | Bold, Centered |
| Footer / QR text | Times New Roman | 9pt | Regular |

> Times New Roman is used to match the traditional official format of the physical college forms exactly.

---

## 9. Page Setup

| Property | Value |
|---|---|
| Paper Size | A4 (210mm x 297mm) |
| Margins | Top: 25mm, Bottom: 20mm, Left: 25mm, Right: 20mm |
| Orientation | Portrait |
| Font | Times New Roman |
| Color | Black and white (for print compatibility) |
| QR Code | Black, bottom-right |
| Digital Signature Blocks | Light gray bordered boxes |

---

## 10. Conditional Rendering Rules

The PDF generator shows only the sections relevant to the request type:

| Request Type | Student Details | Body Fields | Signatures Shown | Office Use Section |
|---|---|---|---|
| Duty Leave (Upload) | Basic | Date, Hours, Reason | Tutor only | No |
| Duty Leave (Event) | Basic + Role | Event details | Tutor + HOD + Principal | No |
| Scholarship | Basic + Father/Mother | Scholarship fields | Tutor + HOD + Principal | No |
| Event Conduct | Basic + Position | Letter format body | Nodal/Staff + Principal | No |
| General Certificate | Full | Certificate type + Purpose | Tutor + HOD + Principal | Yes |
| Borrow Certificate | Basic | Certificate list + Return date | Tutor + HOD + Principal | Yes |
| Season Ticket | Basic + DOB + Age | Station table | Tutor + HOD | Yes |
| Fee Structure | Full | Checklist + Bank details | Tutor + HOD + Principal | Yes |

---

*PDF Permission Letter Template Specification — Campus E-Approval System v1.0*
