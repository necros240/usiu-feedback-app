import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="container">
      <div className="card" style={{marginTop: '40px', padding: '40px'}}>
        <Link to="/" style={{color: 'var(--primary)', textDecoration: 'none', marginBottom: '20px', display: 'inline-block'}}>
          &larr; Back to Home
        </Link>

        <h1 style={{color: 'var(--primary)', borderBottom: '2px solid var(--accent)', paddingBottom: '10px', marginBottom: '20px'}}>
          Privacy Policy
        </h1>
        
        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
        
        <section style={{marginTop: '20px'}}>
          <h3>1. Introduction</h3>
          <p>Welcome to the USIU Feedback System. We respect your privacy and are committed to protecting the personal data of our student body, faculty, and staff.</p>
        </section>

        <section style={{marginTop: '20px'}}>
          <h3>2. Information We Collect</h3>
          <p>We collect the following types of information:</p>
          <ul>
            <li><strong>Account Information:</strong> Your email address and display name provided during registration.</li>
            <li><strong>Profile Data:</strong> Your club affiliation or department (if added manually).</li>
            <li><strong>User Content:</strong> Feedback, comments, and poll votes you submit.</li>
            <li><strong>System Logs:</strong> Timestamps of when content is created or modified.</li>
          </ul>
        </section>

        <section style={{marginTop: '20px'}}>
          <h3>3. How We Use Your Information</h3>
          <ul>
            <li>To verify your status as a student or club member.</li>
            <li>To facilitate communication between students and administration.</li>
            <li>To analyze campus trends (e.g., "Most reported facility issues").</li>
          </ul>
        </section>

        <section style={{marginTop: '20px'}}>
          <h3>4. Anonymity</h3>
          <p>If you choose to post "Anonymously", your name is hidden from the public feed. However, <strong>Admin users retain access to your identity</strong> to prevent abuse, harassment, or safety threats.</p>
        </section>

        <section style={{marginTop: '20px'}}>
          <h3>5. Data Security</h3>
          <p>Your data is stored securely on Google Firebase servers. We implement standard security rules to ensure only authorized users can access sensitive information.</p>
        </section>

        <section style={{marginTop: '20px'}}>
          <h3>6. Contact Us</h3>
          <p>If you have questions about this policy, please contact Student Affairs or the IT Helpdesk.</p>
        </section>

        <div style={{marginTop: '40px', textAlign: 'center'}}>
          <Link to="/" className="primary-btn" style={{textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '10px 30px'}}>
            I Understand
          </Link>
        </div>
      </div>
    </div>
  );
}