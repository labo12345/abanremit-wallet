import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="gradient-hero px-5 pb-6 pt-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-bold">Privacy Policy</h1>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-6">
        <p className="text-xs text-muted-foreground">Last updated: February 2026</p>

        <section>
          <h2 className="font-semibold text-lg mb-2">1. Introduction</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AbanRemit ("we", "our", or "us") is committed to protecting your personal information. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our SACCO digital wallet application.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">2. Information We Collect</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p><strong>Personal Information:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Full legal name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>National ID or Passport number (for KYC)</li>
              <li>Transaction history</li>
            </ul>
            <p className="mt-2"><strong>Technical Information:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Device information</li>
              <li>IP address</li>
              <li>Login timestamps</li>
              <li>App usage data</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">3. How We Use Your Information</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>Process transactions and maintain your wallet</li>
            <li>Verify your identity (KYC compliance)</li>
            <li>Prevent fraud and unauthorized access</li>
            <li>Send transaction notifications</li>
            <li>Improve our services</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">4. Data Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We implement industry-standard security measures including encryption, secure servers, 
            and access controls to protect your personal information. All financial transactions 
            are processed through secure channels with end-to-end encryption.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">5. Data Sharing</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We do not sell your personal information. We may share data with:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1 mt-2">
            <li>SACCO agents (for withdrawal processing)</li>
            <li>Payment providers (M-Pesa, banks)</li>
            <li>Regulatory authorities (when required by law)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">6. Your Rights</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to legal retention requirements)</li>
            <li>Withdraw consent for marketing communications</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">7. Data Retention</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We retain transaction records for a minimum of 7 years as required by financial 
            regulations. Account data is retained while your account is active and for a 
            reasonable period thereafter.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">8. Contact Us</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For privacy-related inquiries, contact our Data Protection Officer at:
            <br />
            Email: privacy@abanremit.com
            <br />
            Phone: +254 700 000 000
          </p>
        </section>
      </div>
    </div>
  );
}
