import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Database, Globe, Mail } from "lucide-react";
import clmpLogo from "@/assets/clmp-logo.png";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={clmpLogo} alt="CLMP Tech inc" className="h-8 w-auto" />
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground">
            Last updated: January 19, 2026
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              CLMP Tech inc ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our construction lifecycle management platform ("CLMP" or the "Service"). We are a Canadian company and comply with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy legislation.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              Information We Collect
            </h2>
            
            <h3 className="text-xl font-medium mt-6">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account Information:</strong> Name, email address, phone number, company name, job title, and professional credentials.</li>
              <li><strong>Billing Information:</strong> Payment card details, billing address, and transaction history (processed securely via Stripe).</li>
              <li><strong>Profile Information:</strong> Profile photo, professional certifications, and work history.</li>
              <li><strong>Communication Data:</strong> Messages, emails, and support tickets exchanged with our team.</li>
            </ul>

            <h3 className="text-xl font-medium mt-6">Project & Business Data</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Project Information:</strong> Project names, descriptions, timelines, budgets, and documentation.</li>
              <li><strong>Task & Activity Data:</strong> Tasks, milestones, team assignments, and progress tracking.</li>
              <li><strong>Financial Data:</strong> Expense records, budget allocations, and financial reports.</li>
              <li><strong>Compliance Records:</strong> Permits, inspections, safety certifications, and regulatory documents.</li>
              <li><strong>Files & Documents:</strong> Uploaded files, blueprints, contracts, and project documentation.</li>
            </ul>

            <h3 className="text-xl font-medium mt-6">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers.</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the platform.</li>
              <li><strong>Location Data:</strong> IP address and general geographic location (for weather integration and compliance features).</li>
              <li><strong>Cookies & Analytics:</strong> Session data for improving user experience.</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide, maintain, and improve the CLMP platform and services.</li>
              <li>Process transactions and send related billing information.</li>
              <li>Send administrative notifications, security alerts, and service updates.</li>
              <li>Respond to customer support inquiries and technical issues.</li>
              <li>Analyze usage patterns to enhance features and user experience.</li>
              <li>Ensure compliance with Canadian construction regulations (OBC, safety standards).</li>
              <li>Generate AI-powered insights and risk assessments for your projects.</li>
              <li>Prevent fraud, unauthorized access, and security threats.</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Data Sharing & Disclosure
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Service Providers:</strong> Trusted third parties who assist in operating our platform (hosting, payment processing, analytics).</li>
              <li><strong>Team Members:</strong> Other users within your organization who have authorized access to shared projects.</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect rights and safety.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>256-bit SSL/TLS encryption for all data in transit.</li>
              <li>AES-256 encryption for data at rest.</li>
              <li>Multi-factor authentication (MFA) options.</li>
              <li>Regular security audits and penetration testing.</li>
              <li>Role-based access controls (RBAC).</li>
              <li>Data hosted in Canadian data centers (Supabase infrastructure).</li>
              <li>SOC 2 Type II compliant infrastructure.</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Project data is retained for 7 years after project completion to meet Canadian construction industry record-keeping requirements. You may request deletion of your account and associated data at any time.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold">Your Privacy Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Under PIPEDA and applicable provincial laws, you have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Access your personal information we hold about you.</li>
              <li>Request correction of inaccurate or incomplete data.</li>
              <li>Request deletion of your personal information (subject to legal requirements).</li>
              <li>Withdraw consent to data processing where applicable.</li>
              <li>Export your data in a portable format.</li>
              <li>Lodge a complaint with the Office of the Privacy Commissioner of Canada.</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold">Cookies & Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to maintain session state and preferences. Analytics cookies help us understand usage patterns and improve our service. You can manage cookie preferences through your browser settings. Disabling cookies may limit functionality.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold">Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              CLMP is designed for business professionals and is not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from minors.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-semibold">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of material changes via email or through the platform. Continued use of CLMP after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
            </p>
            <div className="bg-muted/50 p-6 rounded-lg mt-4">
              <p className="font-semibold">CLMP Tech inc</p>
              <p className="text-muted-foreground">Privacy Officer</p>
              <p className="text-muted-foreground">Email: info@clmptech.ca</p>
              <p className="text-muted-foreground">Phone: +1 (705) 985-9688</p>
              <p className="text-muted-foreground">Unit 4, 205 Torbay Road, Markham, ON, L3R 3W4, Canada</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2026 CLMP Tech inc. All rights reserved. Made with ❤️ in Canada.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
