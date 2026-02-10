import { ArrowLeft, Phone, Mail, MessageCircle, HelpCircle, FileText, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Support() {
  const navigate = useNavigate();

  const contactOptions = [
    {
      icon: Phone,
      title: 'Call Us',
      description: '+254 728 825 152',
      subtitle: 'Mon-Fri 8am-6pm, Sat 9am-1pm',
      action: () => window.open('tel:+254728825152'),
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@abancool.com',
      subtitle: 'Response within 24 hours',
      action: () => window.open('mailto:support@abancool.com'),
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: '+254 728 825 152',
      subtitle: 'Quick responses',
      action: () => window.open('https://wa.me/254728825152'),
    },
  ];

  const faqItems = [
    {
      question: 'How do I reset my PIN?',
      answer: 'Go to Settings > Security > Reset PIN. You will need to verify your phone number via OTP.',
    },
    {
      question: 'How long do withdrawals take?',
      answer: 'Withdrawals require agent confirmation. Once you submit a request, visit your selected agent with the reference code. The agent will verify your identity and process the cash.',
    },
    {
      question: 'What are the transaction limits?',
      answer: 'Single transaction: KES 10 - 70,000. Daily limit: KES 150,000. Limits may vary based on your KYC verification level.',
    },
    {
      question: 'How do I become a verified user?',
      answer: 'Complete your KYC by providing your National ID or Passport number in Settings > Profile > Verify Identity.',
    },
    {
      question: 'How do I become an agent?',
      answer: 'Apply through Settings > Become an Agent. You need to be a verified user with complete KYC. Agent applications are reviewed within 3-5 business days.',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="gradient-hero px-5 pb-6 pt-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-bold">Help & Support</h1>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-6">
        {/* Contact Options */}
        <section>
          <h2 className="font-semibold text-base mb-3">Contact Us</h2>
          <div className="space-y-2">
            {contactOptions.map((option) => (
              <button
                key={option.title}
                onClick={option.action}
                className="flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-card text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <option.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{option.title}</p>
                  <p className="text-sm text-primary">{option.description}</p>
                  <p className="text-xs text-muted-foreground">{option.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="font-semibold text-base mb-3">Quick Links</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('/privacy')}
              className="flex items-center gap-2 rounded-xl bg-card p-3 shadow-card"
            >
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Privacy Policy</span>
            </button>
            <button
              onClick={() => navigate('/terms')}
              className="flex items-center gap-2 rounded-xl bg-card p-3 shadow-card"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Terms & Conditions</span>
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqItems.map((faq, index) => (
              <div key={index} className="rounded-xl bg-card p-4 shadow-card">
                <p className="font-medium text-sm">{faq.question}</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Emergency */}
        <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <h2 className="font-semibold text-base text-destructive mb-2">Report Fraud or Unauthorized Access</h2>
          <p className="text-xs text-muted-foreground mb-3">
            If you suspect unauthorized activity on your account, contact us immediately to freeze your account.
          </p>
          <Button variant="destructive" size="sm" onClick={() => window.open('tel:+254728825152')}>
            Emergency Hotline
          </Button>
        </section>
      </div>
    </div>
  );
}
