import { useNavigate } from "react-router-dom";
import "../styles/privacy.css";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="privacy-shell">
      <div className="privacy-nav">
        <button className="privacy-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div className="privacy-content">
        <p className="privacy-brand">Luren · by Elarion Studios</p>
        <h1 className="privacy-title">Privacy Policy</h1>
        <p className="privacy-updated">Last updated: May 13, 2026</p>

        <p className="privacy-lead">
          Elarion Studios ("we," "us," or "our") operates the Luren mobile application
          (the "App"). This Privacy Policy explains what information we collect, how we
          use it, and your rights regarding that information.
        </p>

        <section className="privacy-section">
          <h2>1. Information We Collect</h2>
          <p><strong>Information you provide:</strong></p>
          <ul>
            <li>Account details (name and email address) when you create an account</li>
            <li>Mood ratings you log in the app</li>
            <li>Journal entries and written reflections</li>
            <li>Tasks you create, including optional notes on energy level and intent</li>
            <li>Habits you track and their completion history</li>
            <li>Calendar events and scheduling information</li>
          </ul>
          <p><strong>Stored on your device:</strong></p>
          <ul>
            <li>Your session token, kept in local device storage to keep you signed in</li>
            <li>Temporary guest data if you use the app without an account</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain the App's features</li>
            <li>Generate personalized insights by analyzing patterns across your moods, habits, tasks, and journal entries entirely within the App</li>
            <li>Respond to support requests and inquiries</li>
          </ul>
          <p>
            Your journal entries, mood logs, tasks, habits, and personal reflections are
            used solely to deliver the App's features to you. We do not sell, rent, or
            share this data with third parties for marketing or advertising purposes.
          </p>
        </section>

        <section className="privacy-section">
          <h2>3. Data Storage and Security</h2>
          <p>
            Your personal data is stored securely using industry-standard encryption in
            transit and at rest. We implement appropriate technical and organizational
            measures to protect your information against unauthorized access, alteration,
            disclosure, or destruction. Your session token is stored in local device
            storage to maintain your signed-in state between sessions.
          </p>
        </section>

        <section className="privacy-section">
          <h2>4. Third-Party Services</h2>
          <p>
            The App's backend is hosted on Render, the frontend is served via Vercel,
            and user data is stored in MongoDB. These providers process data on our
            behalf under their own privacy policies. We do not share your journal
            entries, mood logs, habits, tasks, or any other user-generated content
            with any third party for advertising or analytics.
          </p>
        </section>

        <section className="privacy-section">
          <h2>5. Data Retention and Deletion</h2>
          <p>
            You may delete your account and all associated data at any time from the
            Settings page inside the App. Upon deletion, your personal data is
            permanently and immediately removed from our systems. You may also download
            a complete copy of your data from Settings at any time.
          </p>
        </section>

        <section className="privacy-section">
          <h2>6. Children's Privacy</h2>
          <p>
            The App is not directed to children under 13. We do not knowingly collect
            personal information from children under 13. If you believe a child has
            provided us with personal data, please contact us and we will promptly
            delete it.
          </p>
        </section>

        <section className="privacy-section">
          <h2>7. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Request deletion of your data (available directly in Settings)</li>
            <li>Download a copy of your data (available directly in Settings)</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a className="privacy-link" href="mailto:support@elarionstudios.org">
              support@elarionstudios.org
            </a>
            .
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of
            significant changes via email or in-app notification. Continued use of the
            App after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="privacy-section">
          <h2>9. Not a Medical Service</h2>
          <p>
            Luren is a personal reflection and habit tracking tool. It is not a medical
            service and is not intended to diagnose, treat, cure, or replace professional
            mental health support. If you are experiencing a mental health crisis, please
            contact a qualified healthcare provider or emergency services.
          </p>
        </section>

        <section className="privacy-section">
          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, reach out at{" "}
            <a className="privacy-link" href="mailto:support@elarionstudios.org">
              support@elarionstudios.org
            </a>
            .
          </p>
        </section>

        <div className="privacy-footer">
          <p>© 2026 Elarion Studios. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
