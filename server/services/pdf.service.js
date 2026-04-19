const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const { generateQRCode } = require('./qr.service');
const { cloudinary } = require('../config/cloudinary');

/**
 * Upload a PDF Buffer directly to Cloudinary under the 'permission_letters' folder.
 * Returns the Cloudinary upload result (result.secure_url is the HTTPS URL).
 */
function uploadPdfToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'permission_letters',
        public_id: publicId,
        resource_type: 'raw', // PDFs must use resource_type 'raw'
        format: 'pdf',
        overwrite: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

const ROLE_LABELS = {
  tutor: 'Group Tutor',
  faculty_coordinator: 'Faculty In-charge',
  hod: 'Head of Department',
  principal: 'Principal',
};

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function buildSignatureBlocks(approvalSteps, chain) {
  return chain.map(role => {
    const step = approvalSteps.find(s => s.role === role && s.action === 'approved');
    const label = ROLE_LABELS[role] || role;

    // Signatures are now Cloudinary HTTPS URLs — Puppeteer can fetch them directly.
    // No disk reads needed anymore.
    let sigImg = '<div style="height:60px;border-bottom:1px solid #aaa;width:150px;"></div>';
    if (step?.authorityId?.signatureUrl) {
      const url = step.authorityId.signatureUrl;
      sigImg = `<img src="${url}" alt="signature" style="max-height:60px;max-width:150px;display:block;margin-bottom:4px;" crossorigin="anonymous">`;
    }

    return `
      <div class="sig-block">
        <div class="sig-label">${label}</div>
        <div class="sig-img-area">${sigImg}</div>
        <div class="sig-name">Name: ${step?.authorityId?.name || '_______________'}</div>
        <div class="sig-time">${step ? 'Approved: ' + formatDateTime(step.timestamp) : ''}</div>
        ${role === 'principal' && step ? '<div class="sig-approved-stamp">Approved</div>' : ''}
      </div>`;
  }).join('');
}

function buildRequestBody(type, formData) {
  switch (type) {
    case 'duty_leave_upload':
      return `
        <p><strong>Event Date:</strong> ${formatDate(formData.eventDate)}</p>
        <p><strong>Number of Class Hours Missing:</strong> ${formData.classHours || '—'}</p>
        <p><strong>Reason / Purpose:</strong><br>${formData.purpose || '—'}</p>
        ${formData.attachments?.length ? `<p><strong>Uploaded File(s):</strong> ${formData.attachments.join(', ')}</p>` : ''}`;

    case 'duty_leave_event':
      return `
        <p><strong>Role:</strong> ${formData.role || '—'}</p>
        <p><strong>Event Name:</strong> ${formData.eventName || '—'}</p>
        <p><strong>Event Type:</strong> ${formData.eventType || '—'}</p>
        ${formData.communityName ? `<p><strong>Community / Club Name:</strong> ${formData.communityName}</p>` : ''}
        <p><strong>Organizing Institution / Body:</strong> ${formData.organisingBody || '—'}</p>
        <p><strong>Event Date:</strong> ${formatDate(formData.eventDate)}</p>
        <p><strong>Venue:</strong> ${formData.venue || '—'}</p>
        <p><strong>Number of Class Hours Missing:</strong> ${formData.classHours || '—'}</p>
        <p><strong>Purpose / Description:</strong><br>${formData.purpose || '—'}</p>`;

    case 'scholarship':
      return `
        <p><strong>Name of Father / Mother:</strong> ${formData.parentName || '—'}</p>
        <p><strong>Name of Scholarship:</strong> ${formData.scholarshipName || '—'}</p>
        <p><strong>Name of Agency Awarding Scholarship:</strong> ${formData.agencyName || '—'}</p>
        <p><strong>Whether specific format attached:</strong> ${formData.formatAttached ? 'Yes' : 'No'}</p>`;

    case 'event_conduct':
      return `
        <p style="text-align:left;"><strong>From,</strong></p>
        <p>${formData.studentName || ''},<br>
        ${formData.positionInOrg || ''} of ${formData.organisationName || ''}<br>
        Date: ${formatDate(new Date())}</p>
        <p><strong>To,</strong><br>The Principal,</p>
        <p><strong>Subject:</strong> Request for Permission to Conduct a/an ${formData.eventType || ''} Event</p>
        <p>Respected Sir/Madam,</p>
        <p>I, ${formData.studentName || ''}, serving as ${formData.positionInOrg || ''} of ${formData.organisationName || ''},
        would like to request permission to conduct an event titled "<strong>${formData.eventTitle || ''}</strong>".</p>
        <p>The event is proposed to be conducted ${formData.eventDuration === 'Multi-Day'
          ? `from ${formatDate(formData.eventDateFrom)} to ${formatDate(formData.eventDateTo)}`
          : `on ${formatDate(formData.eventDate)}`} at ${formData.eventStartTime || ''}, at ${formData.venue || ''}.
        The objective of this program is to enhance students' learning, skill development, and collaborative growth
        through the ${formData.organisationName || ''} platform.</p>
        <p>We assure you that the event will be organized responsibly and all institutional rules and regulations will be
        strictly followed. We kindly request your approval and necessary support to conduct the event successfully.</p>
        <p>Thanking you.</p>
        <p style="text-align:right;">Yours faithfully,<br><br><br>
        Signature: ___________________<br>
        Name: ${formData.studentName || ''}<br>
        Position in (${formData.organisationName || ''}): ${formData.positionInOrg || ''}</p>`;

    case 'general_certificate':
      return `
        <p><strong>Year of Admission / Period of Study:</strong> ${formData.yearOfAdmission || '—'}</p>
        <p><strong>Category:</strong> ${formData.category || '—'}</p>
        <p><strong>Type of Certificate Needed:</strong> ${formData.certificateType || '—'}${formData.certificateTypeOther ? ' — ' + formData.certificateTypeOther : ''}</p>
        <p><strong>Purpose:</strong><br>${formData.purpose || '—'}</p>`;

    case 'borrow_certificate':
      return `
        <p><strong>Type of Admission:</strong> ${formData.typeOfAdmission || '—'}</p>
        <p><strong>Required Original Certificate(s):</strong> ${(formData.certificates || []).join(', ') || '—'}</p>
        <p><strong>Purpose for which certificate is sought:</strong><br>${formData.purpose || '—'}</p>
        <p><strong>Expected Date of Return:</strong> ${formatDate(formData.returnDate)}</p>`;

    case 'season_ticket':
      return `
        <table class="data-table">
          <thead><tr><th>Name</th><th>DOB</th><th>Age</th><th>From</th><th>To</th></tr></thead>
          <tbody>
            <tr>
              <td>${formData.name || '—'}</td>
              <td>${formatDate(formData.dateOfBirth)}</td>
              <td>${formData.age || '—'}</td>
              <td>${formData.fromStation || '—'}</td>
              <td>${formData.toStation || '—'}</td>
            </tr>
          </tbody>
        </table>`;

    case 'fee_structure':
      return `
        <p><strong>Name of Father / Mother:</strong> ${formData.parentName || '—'}</p>
        <p><strong>Category:</strong> ${formData.category || '—'}</p>
        <p><strong>Type of Admission:</strong> ${formData.typeOfAdmission || '—'}</p>
        <p><strong>Whether Hostler:</strong> ${formData.isHostler ? 'Yes' : 'No'}${formData.hostelName ? ' — ' + formData.hostelName : ''}</p>
        <p><strong>Additional Requirements:</strong></p>
        <ul>
          <li>Examination Fee: ${formData.examFee ? 'Yes' : 'No'}</li>
          <li>Bus Fee: ${formData.busFee ? 'Yes' : 'No'}</li>
          <li>Textbooks, Records &amp; Notebooks: ${formData.textbooks ? 'Yes' : 'No'}</li>
          <li>Uniform Expense: ${formData.uniform ? 'Yes' : 'No'}</li>
          <li>Laptop: ${formData.laptop ? 'Yes' : 'No'}</li>
          <li>Project: ${formData.project ? 'Yes' : 'No'}</li>
        </ul>
        <p><strong>Purpose:</strong> ${formData.purpose || '—'}</p>
        <p><strong>Name of Bank / Other Institution:</strong> ${formData.bankName || '—'} &nbsp;&nbsp; <strong>Branch:</strong> ${formData.bankBranch || '—'}</p>`;

    default:
      return '<p>Request details not available.</p>';
  }
}

const OFFICE_USE_TYPES = ['general_certificate', 'borrow_certificate', 'season_ticket', 'fee_structure'];

const TYPE_TITLES = {
  duty_leave_upload: 'DUTY LEAVE — FILE UPLOAD',
  duty_leave_event: 'DUTY LEAVE — EVENT ATTENDANCE',
  scholarship: 'SCHOLARSHIP RECOMMENDATION',
  event_conduct: 'PERMISSION TO CONDUCT EVENT',
  general_certificate: 'GENERAL PURPOSE CERTIFICATE',
  borrow_certificate: 'BORROWING ORIGINAL CERTIFICATES',
  season_ticket: 'SEASON TICKET / RAILWAY CONCESSION',
  fee_structure: 'FEE STRUCTURE FOR EDUCATIONAL LOAN',
};

async function generatePermissionLetterPDF(request, student, approvalSteps, verificationToken) {
  const approvalDate = approvalSteps[approvalSteps.length - 1]?.timestamp || new Date();
  const qrDataUrl = await generateQRCode(request.requestId, verificationToken);
  const sigBlocks = buildSignatureBlocks(approvalSteps, request.approvalChain);
  const reqBody = buildRequestBody(request.type, request.formData);
  const needsOfficeSection = OFFICE_USE_TYPES.includes(request.type);
  const title = TYPE_TITLES[request.type] || 'PERMISSION REQUEST';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    color: #000;
    background: #fff;
    padding: 25mm 20mm 20mm 25mm;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .title-block { text-align: center; flex: 1; }
  .doc-title { font-size: 13pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; }
  .date-block { font-size: 10pt; white-space: nowrap; }
  hr { border: none; border-top: 1px solid #000; margin: 12px 0; }
  .section-title { font-size: 11pt; font-weight: bold; margin: 14px 0 8px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 12px; }
  .field { border-bottom: 1px dotted #555; padding-bottom: 3px; margin-bottom: 6px; font-size: 10pt; }
  .field-label { font-size: 10pt; }
  p { margin: 6px 0; font-size: 10pt; line-height: 1.5; }
  .sig-area { display: flex; flex-wrap: wrap; gap: 16px; margin: 16px 0; }
  .sig-block {
    border: 1px solid #555;
    padding: 10px 14px;
    min-width: 160px;
    flex: 1;
    font-size: 9pt;
  }
  .sig-label { font-weight: bold; font-size: 10pt; margin-bottom: 8px; }
  .sig-approved-stamp { font-weight: bold; margin-top: 6px; text-align: right; }
  .office-section { margin-top: 16px; border-top: 2px solid #000; padding-top: 12px; }
  .office-title { text-align: center; font-size: 11pt; font-weight: bold; margin-bottom: 12px; }
  .office-field { border-bottom: 1px dotted #555; margin-bottom: 14px; padding-bottom: 2px; }
  .footer { margin-top: 24px; display: flex; align-items: flex-end; justify-content: space-between; border-top: 1px solid #000; padding-top: 10px; }
  .footer-text { font-size: 9pt; }
  .qr-img { width: 76px; height: 76px; }
  .data-table { border-collapse: collapse; width: 100%; margin-top: 8px; font-size: 10pt; }
  .data-table th, .data-table td { border: 1px solid #000; padding: 5px 8px; text-align: left; }
  .data-table th { font-weight: bold; }
  ul { margin-left: 18px; }
  ul li { margin-bottom: 4px; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="title-block">
    <div class="doc-title">REQUEST FOR ${title}</div>
  </div>
  <div class="date-block">Date: ${formatDate(approvalDate)}</div>
</div>

<!-- STUDENT DETAILS -->
<div class="section-title">Student Details</div>
<div class="two-col">
  <div><span class="field-label">Name:</span><div class="field">${student.name || '—'}</div></div>
  <div><span class="field-label">Admn. No.:</span><div class="field">${student.admissionNo || '—'}</div></div>
  <div><span class="field-label">Year of Study:</span><div class="field">${student.yearOfStudy || '—'}</div></div>
  <div><span class="field-label">Branch:</span><div class="field">${student.department || '—'}</div></div>
  <div><span class="field-label">Year of Admission / Period of Study:</span><div class="field">${student.yearOfAdmission || '—'}</div></div>
  <div><span class="field-label">Category:</span><div class="field">${student.category || '—'}</div></div>
</div>

<!-- REQUEST BODY -->
<div class="section-title">Request Details</div>
${reqBody}

<!-- SIGNATURES -->
<div class="section-title">Particulars verified and recommended:</div>
<div class="sig-area">
  ${sigBlocks}
</div>

${needsOfficeSection ? `
<!-- OFFICE USE ONLY -->
<div class="office-section">
  <div class="office-title">FOR OFFICE USE ONLY</div>
  <div class="two-col">
    <div><span class="field-label">Certificate prepared by:</span><div class="office-field">&nbsp;</div></div>
    <div><span class="field-label">Scrutiny by:</span><div class="office-field">&nbsp;</div></div>
  </div>
  <div><span class="field-label">Remarks by section:</span><div class="office-field" style="height:28px;">&nbsp;</div></div>
  <div style="margin-top:12px;"><span class="field-label">Verification:</span><div class="office-field" style="height:28px;">&nbsp;</div></div>
  <div style="text-align:right;margin-top:16px;">
    <div style="font-weight:bold;">Approved</div>
    <div>Principal</div>
  </div>
  <div class="two-col" style="margin-top:20px;">
    <div><span class="field-label">Date:</span><div class="office-field">&nbsp;</div></div>
    <div><span class="field-label">Signature of the student:</span><div class="office-field">&nbsp;</div></div>
  </div>
  <div><span class="field-label">Received certificate:</span><div class="office-field">&nbsp;</div></div>
</div>
` : ''}

<!-- FOOTER QR -->
<div class="footer">
  <div class="footer-text">
    <div><strong>Request ID:</strong> ${request.requestId}</div>
    <div><strong>Issued:</strong> ${formatDate(approvalDate)}</div>
    <div><strong>Verify at:</strong> e-campus-approval.vercel.app/verify/${request.requestId}</div>
    <div style="margin-top:4px;">This is a digitally approved document. Scan the QR code to verify authenticity.</div>
  </div>
  <img class="qr-img" src="${qrDataUrl}" alt="QR Code">
</div>

</body>
</html>`;

  const executablePath = await chromium.executablePath();
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: true,
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Generate PDF as a Buffer (no local path — goes straight to Cloudinary)
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
  });
  await browser.close();

  // Upload buffer to Cloudinary and return the HTTPS secure_url
  const result = await uploadPdfToCloudinary(pdfBuffer, request.requestId);
  return result.secure_url;
}

module.exports = { generatePermissionLetterPDF };
