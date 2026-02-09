import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsAndConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="gradient-hero px-5 pb-6 pt-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-bold">Terms & Conditions</h1>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-6">
        <p className="text-xs text-muted-foreground">Last updated: February 2026</p>

        <section>
          <h2 className="font-semibold text-lg mb-2">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By accessing or using AbanRemit, you agree to be bound by these Terms and Conditions. 
            If you do not agree to all terms, you may not use our services.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">2. Eligibility</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>You must be at least 18 years old</li>
            <li>You must be a member of our SACCO or eligible to join</li>
            <li>You must provide accurate identification documents</li>
            <li>You must have a valid Kenyan phone number</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">3. Account Registration</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials. 
            All transactions made through your account are your responsibility. Report unauthorized 
            access immediately.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">4. Services</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>AbanRemit provides:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Digital wallet for storing funds</li>
              <li>Person-to-person money transfers</li>
              <li>Cash withdrawals via agents</li>
              <li>Deposits via M-Pesa</li>
              <li>Airtime purchases</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">5. Transaction Limits</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>Minimum transaction: KES 10</li>
            <li>Maximum single transaction: KES 70,000</li>
            <li>Daily transaction limit: KES 150,000</li>
            <li>Limits may vary based on KYC verification level</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">6. Fees</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Transaction fees apply and are displayed before confirming each transaction. 
            Fee schedules are available in the app and may be updated with notice.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">7. KYC Requirements</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Full KYC verification is required for:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1 mt-2">
            <li>Cash withdrawals</li>
            <li>Transactions above KES 10,000</li>
            <li>Agent registration</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">8. Prohibited Activities</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>Money laundering or terrorist financing</li>
            <li>Fraudulent transactions</li>
            <li>Account sharing or unauthorized access</li>
            <li>Violation of applicable laws</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">9. Liability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AbanRemit is not liable for losses resulting from unauthorized account access, 
            user error in transaction details, or force majeure events. Maximum liability 
            is limited to the transaction amount in question.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">10. Dispute Resolution</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Disputes should first be reported to our support team. Unresolved disputes 
            may be escalated to the Financial Services Tribunal or resolved through 
            arbitration under Kenyan law.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">11. Governing Law</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These terms are governed by the laws of Kenya. Our services comply with 
            Central Bank of Kenya regulations for mobile money operators.
          </p>
        </section>
      </div>
    </div>
  );
}
