import { useState } from 'react'
import logo from './assets/cwg-logo.png'
import './App.css'

const policyItems = [
  'The Whistleblower should promptly report the suspected or actual event to his/her supervisor. Where the whistle blower is a contractor, supplier, partner and consultant he/she should promptly report the suspected or actual event to Management.',
  'If the Whistleblower would be uncomfortable or otherwise reluctant to report to his/her supervisor, then the Whistleblower could report the event to the Internal Auditor. Where the whistle blower is a contractor, supplier, partner and consultant he/she should report to the Internal Auditor.',
  'The Whistleblower can report the event with his/her identity or anonymously.',
  'The Whistle blower shall receive no retaliation or retribution for a report that was provided in good faith – that was not done primarily with malice to damage another individual or the organization.',
  'A Whistleblower who makes a report that is not done in good faith is subject to discipline, including termination of the Board or employee relationship, or other legal means to protect the reputation of the organization and members of the Board and staff.',
  'Anyone who retaliates against the Whistleblower (who reported an event in good faith) will be subject to discipline, including termination of Board or employee status.',
  'Crimes against person or property, such as assault, rape, burglary, etc., should immediately be reported to the relevant law enforcement agency.',
  'Supervisors, managers and Internal Auditors who receive the reports must promptly act to investigate and/or resolve the issue.',
  'The Whistleblower shall receive a report within five (5) business days of the initial report, regarding the investigation, disposition or resolution of the issue.',
  'If the investigation of a report, that was done in good faith and investigated by internal personnel, is not to the Whistleblower’s satisfaction, then he/she has the right to report the event to the appropriate legal or investigative agency.',
  'The identity of the Whistleblower, if known, shall remain confidential to those persons directly involved in applying this policy, unless the issue requires investigation by law enforcement, in which case members of the organization are subject to subpoena.',
  'The whistle blower should make his/her report under this policy to the dedicated email whistleblower@cwg-plc.com.',
]

function App() {
  const [anonymous, setAnonymous] = useState(true)
  const [notice, setNotice] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now())

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    setSubmitting(true)
    setNotice(null)

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymous,
          name: formData.get('name') || '',
          email: formData.get('email') || '',
          relationship: formData.get('relationship'),
          concernType: formData.get('concernType'),
          subject: formData.get('subject'),
          details: formData.get('details'),
          incidentDate: formData.get('incidentDate') || '',
          location: formData.get('location') || '',
          website: formData.get('website') || '',
          startedAt: formStartedAt,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'The report could not be sent.')
      }

      form.reset()
      setAnonymous(true)
      setFormStartedAt(Date.now())
      setNotice({
        type: 'success',
        message: `Your report has been sent successfully. Reference: ${result.referenceId}`,
      })
    } catch (error) {
      setNotice({
        type: 'error',
        message: `${error.message} You can also email whistleblower@cwg-plc.com directly.`,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="document">
      <header className="document-header">
        <img src={logo} alt="CWG PLC" className="logo" />
        <div>
          <p>CWG PLC</p>
          <h1>Whistleblower Policy</h1>
        </div>
      </header>

      <section className="policy" aria-labelledby="policy-heading">
        <h2 id="policy-heading">Policy</h2>
        <p>
          This policy is intended to encourage directors, employees, contractors,
          suppliers, partners and consultants to report suspected or actual
          occurrence(s) of illegal, unethical or inappropriate events (behaviors or
          practices) without retribution.
        </p>

        <ol>
          {policyItems.map((item) => <li key={item}>{item}</li>)}
        </ol>

        <p className="approval">
          <strong>Approved by the Board of Directors on the 30th day of January, 2024.</strong>
        </p>
      </section>

      <hr />

      <section className="report-section" aria-labelledby="report-heading">
        <h2 id="report-heading">Submit a whistleblower report</h2>
        <p>
          Complete the form below. You may submit a report anonymously or provide
          your contact details if you would like to receive an update.
        </p>

        <div className="important-note">
          If the matter involves an immediate threat, assault, burglary or another
          crime against a person or property, contact the relevant law enforcement
          agency immediately.
        </div>

        <form onSubmit={handleSubmit}>
          <label className="honeypot" aria-hidden="true">
            Website
            <input type="text" name="website" tabIndex="-1" autoComplete="off" />
          </label>
          <fieldset>
            <legend>Would you like to remain anonymous?</legend>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="anonymous"
                  checked={anonymous}
                  onChange={() => setAnonymous(true)}
                />
                Yes, submit anonymously
              </label>
              <label>
                <input
                  type="radio"
                  name="anonymous"
                  checked={!anonymous}
                  onChange={() => setAnonymous(false)}
                />
                No, include my details
              </label>
            </div>
          </fieldset>

          {!anonymous && (
            <div className="two-columns">
              <label>
                Full name
                <input type="text" name="name" autoComplete="name" required />
              </label>
              <label>
                Email address
                <input type="email" name="email" autoComplete="email" required />
              </label>
            </div>
          )}

          <div className="two-columns">
            <label>
              Relationship to CWG
              <select name="relationship" defaultValue="" required>
                <option value="" disabled>Select an option</option>
                <option>Director</option>
                <option>Employee</option>
                <option>Contractor</option>
                <option>Supplier</option>
                <option>Partner</option>
                <option>Consultant</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Type of concern
              <select name="concernType" defaultValue="" required>
                <option value="" disabled>Select an option</option>
                <option>Fraud or financial misconduct</option>
                <option>Bribery or corruption</option>
                <option>Harassment or discrimination</option>
                <option>Health or safety concern</option>
                <option>Data or privacy breach</option>
                <option>Conflict of interest</option>
                <option>Other unethical conduct</option>
              </select>
            </label>
          </div>

          <label>
            Subject
            <input type="text" name="subject" minLength="3" required />
          </label>

          <label>
            Details of the report
            <textarea
              name="details"
              rows="8"
              placeholder="Explain what happened. Include names, dates, locations and any other relevant details."
              minLength="10"
              required
            />
          </label>

          <div className="two-columns">
            <label>
              Date of incident <span>(if known)</span>
              <input type="date" name="incidentDate" />
            </label>
            <label>
              Location <span>(if applicable)</span>
              <input type="text" name="location" />
            </label>
          </div>

          <label className="checkbox-label">
            <input type="checkbox" required />
            I confirm that this report is made in good faith and is accurate to the
            best of my knowledge.
          </label>

          {notice && (
            <p className={`form-notice ${notice.type}`} role="status">
              {notice.message}
            </p>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Sending report…' : 'Submit report'}
          </button>
        </form>

        <p className="email-note">
          Reports may also be sent directly to{' '}
          <a href="mailto:whistleblower@cwg-plc.com">whistleblower@cwg-plc.com</a>.
        </p>
      </section>

      <footer>© {new Date().getFullYear()} CWG PLC</footer>
    </main>
  )
}

export default App
