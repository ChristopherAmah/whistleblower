/* global process */
import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'

const RECIPIENT = 'whistleblower@cwg-plc.com'
const MAX_EVIDENCE_SIZE = 2.5 * 1024 * 1024
const allowedEvidenceTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
])
const allowedEvidenceExtensions = new Set(['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt'])

function clean(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
}

function validateEvidence(value) {
  if (value === null || value === undefined) return { evidence: null }
  if (!value || typeof value !== 'object') return { error: 'The evidence file is invalid.' }

  const filename = clean(value.name, 180).split(/[\\/]/).pop().replace(/[\r\n]/g, '')
  const type = clean(value.type, 120).toLowerCase()
  const content = typeof value.content === 'string' ? value.content : ''
  const extension = filename.includes('.') ? filename.split('.').pop().toLowerCase() : ''

  if (!filename || !allowedEvidenceTypes.has(type) || !allowedEvidenceExtensions.has(extension)) {
    return { error: 'Evidence must be a PDF, JPG, PNG, Word or text file.' }
  }

  if (!content || content.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(content)) {
    return { error: 'The evidence file is invalid.' }
  }

  const decodedSize = Buffer.from(content, 'base64').length
  if (!decodedSize || decodedSize > MAX_EVIDENCE_SIZE) {
    return { error: 'The evidence file must be 2.5 MB or smaller.' }
  }

  return { evidence: { filename, type, content } }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ message: 'Method not allowed.' })
  }

  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.error('Missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL')
    return response.status(503).json({ message: 'Email delivery is not configured.' })
  }

  if (!validEmail(process.env.SENDGRID_FROM_EMAIL)) {
    console.error('SENDGRID_FROM_EMAIL is not a valid email address')
    return response.status(503).json({ message: 'The email sender is not configured correctly.' })
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
  const evidenceResult = validateEvidence(body.evidence)

  if (evidenceResult.error) {
    return response.status(400).json({ message: evidenceResult.error })
  }

  const evidence = evidenceResult.evidence

  const invalidFields = []
  if (!relationship) invalidFields.push('relationship to CWG')
  if (!concernType) invalidFields.push('type of concern')
  if (subject.length < 3) invalidFields.push('subject (minimum 3 characters)')
  if (details.length < 10) invalidFields.push('report details (minimum 10 characters)')

  if (invalidFields.length) {
    return response.status(400).json({
      message: `Please check the following: ${invalidFields.join(', ')}.`,
    })
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
    `Evidence: ${evidence ? evidence.filename : 'Not attached'}`,
    '',
    `Subject: ${subject}`,
    '',
    'REPORT DETAILS',
    details,
  ].join('\n')

  try {
    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: RECIPIENT }],
            subject: `Whistleblower Report - ${subject}`,
            custom_args: { reference_id: referenceId },
          },
        ],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME || 'CWG Whistleblower',
        },
        reply_to: anonymous ? undefined : { email, name },
        subject: `Whistleblower Report - ${subject}`,
        content: [{ type: 'text/plain', value: reportText }],
        attachments: evidence
          ? [
              {
                content: evidence.content,
                type: evidence.type,
                filename: evidence.filename,
                disposition: 'attachment',
              },
            ]
          : undefined,
      }),
    })

    if (!sendGridResponse.ok) {
      const providerError = await sendGridResponse.text()
      console.error('SendGrid delivery failed:', sendGridResponse.status, providerError)
      return response.status(502).json({ message: 'Email delivery failed. Please try again.' })
    }

    return response.status(200).json({ referenceId })
  } catch (error) {
    console.error('Report delivery error:', error)
    return response.status(500).json({ message: 'Email delivery failed. Please try again.' })
  }
}
