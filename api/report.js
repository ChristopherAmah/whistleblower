/* global process */
import crypto from 'node:crypto'

const RECIPIENT = 'whistleblower@cwg-plc.com'
const allowedRelationships = new Set([
  'Director',
  'Employee',
  'Contractor',
  'Supplier',
  'Partner',
  'Consultant',
  'Other',
])
const allowedConcernTypes = new Set([
  'Fraud or financial misconduct',
  'Bribery or corruption',
  'Harassment or discrimination',
  'Health or safety concern',
  'Data or privacy breach',
  'Conflict of interest',
  'Other unethical conduct',
])

function clean(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ message: 'Method not allowed.' })
  }

  if (!process.env.RESEND_API_KEY || !process.env.REPORT_FROM_EMAIL) {
    console.error('Missing RESEND_API_KEY or REPORT_FROM_EMAIL')
    return response.status(503).json({ message: 'Email delivery is not configured.' })
  }

  const body = request.body || {}

  // Quietly accept automated submissions caught by the hidden field.
  if (clean(body.website, 100)) {
    return response.status(200).json({ referenceId: 'received' })
  }

  const startedAt = Number(body.startedAt)
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 2500) {
    return response.status(400).json({ message: 'Please review the form and try again.' })
  }

  const anonymous = body.anonymous === true
  const name = clean(body.name, 120)
  const email = clean(body.email, 254)
  const relationship = clean(body.relationship, 80)
  const concernType = clean(body.concernType, 100)
  const subject = clean(body.subject, 160)
  const details = clean(body.details, 12000)
  const incidentDate = clean(body.incidentDate, 20)
  const location = clean(body.location, 200)

  if (
    !allowedRelationships.has(relationship) ||
    !allowedConcernTypes.has(concernType) ||
    subject.length < 3 ||
    details.length < 10
  ) {
    return response.status(400).json({ message: 'Please complete all required fields.' })
  }

  if (!anonymous && (!name || !validEmail(email))) {
    return response.status(400).json({ message: 'Please provide a valid name and email address.' })
  }

  const referenceId = `CWG-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const reportText = [
    'CWG PLC WHISTLEBLOWER REPORT',
    `Reference: ${referenceId}`,
    `Submitted: ${new Date().toISOString()}`,
    '',
    `Anonymous: ${anonymous ? 'Yes' : 'No'}`,
    `Name: ${anonymous ? 'Not provided' : name}`,
    `Contact email: ${anonymous ? 'Not provided' : email}`,
    `Relationship to CWG: ${relationship}`,
    `Type of concern: ${concernType}`,
    `Incident date: ${incidentDate || 'Not provided'}`,
    `Location: ${location || 'Not provided'}`,
    '',
    `Subject: ${subject}`,
    '',
    'REPORT DETAILS',
    details,
  ].join('\n')

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': referenceId,
      },
      body: JSON.stringify({
        from: process.env.REPORT_FROM_EMAIL,
        to: [RECIPIENT],
        subject: `[Whistleblower Report] ${subject}`,
        text: reportText,
      }),
    })

    if (!resendResponse.ok) {
      const providerError = await resendResponse.text()
      console.error('Resend delivery failed:', resendResponse.status, providerError)
      return response.status(502).json({ message: 'Email delivery failed. Please try again.' })
    }

    return response.status(200).json({ referenceId })
  } catch (error) {
    console.error('Report delivery error:', error)
    return response.status(500).json({ message: 'Email delivery failed. Please try again.' })
  }
}
