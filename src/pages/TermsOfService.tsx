import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Scale, AlertTriangle, CreditCard, Shield, Gavel } from "lucide-react";
import clmpLogo from "@/assets/clmp-logo.png";

const TermsOfService = () => {
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
            <FileText className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground">
            Last updated: January 19, 2026
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          {/* Agreement */}
          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              Agreement to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and CLMP Tech inc ("Company", "we", "our", or "us") governing your access to and use of the CLMP construction lifecycle management platform ("Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you may not access or use the Service.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              These Terms apply to all visitors, users, and others who access or use the Service, including individual users, teams, and enterprise organizations.
            </p>
          </section>

          {/* Definitions */}
          <section>
            <h2 className="text-2xl font-semibold">Definitions</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>"Account"</strong> means a unique account created for you to access our Service.</li>
              <li><strong>"Content"</strong> means any data, text, files, documents, images, or other materials uploaded, submitted, or transmitted through the Service.</li>
              <li><strong>"Subscription"</strong> means the paid plan you select to access premium features of the Service.</li>
              <li><strong>"Workspace"</strong> means the shared environment where team members collaborate on projects.</li>
            </ul>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-semibold">Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use the Service, you must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Be at least 18 years of age or the age of majority in your jurisdiction.</li>
              <li>Provide accurate, complete, and current registration information.</li>
              <li>Maintain the security of your account credentials.</li>
              <li>Promptly notify us of any unauthorized access or security breaches.</li>
              <li>Accept responsibility for all activities under your account.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We reserve the right to suspend or terminate accounts that violate these Terms or for any other reason at our sole discretion.
            </p>
          </section>

          {/* Subscriptions & Payments */}
          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Subscriptions & Payments
            </h2>
            
            <h3 className="text-xl font-medium mt-6">Free Trial</h3>
            <p className="text-muted-foreground leading-relaxed">
              We offer a 30-day free trial for new users. During the trial, you have access to premium features. No credit card is required to start. At the end of the trial, you may choose to subscribe to a paid plan or continue with limited free features.
            </p>

            <h3 className="text-xl font-medium mt-6">Paid Subscriptions</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Subscription fees are billed in advance on a monthly or annual basis.</li>
              <li>All fees are quoted and payable in Canadian dollars (CAD) unless otherwise specified.</li>
              <li>Prices may change with 30 days' notice to existing subscribers.</li>
              <li>Subscriptions automatically renew unless cancelled before the renewal date.</li>
            </ul>

            <h3 className="text-xl font-medium mt-6">Refunds</h3>
            <p className="text-muted-foreground leading-relaxed">
              Annual subscriptions may be eligible for a prorated refund within the first 14 days. Monthly subscriptions are non-refundable. All refund requests are subject to review.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Acceptable Use Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree NOT to use the Service to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Violate any applicable laws, regulations, or third-party rights.</li>
              <li>Upload malicious code, viruses, or harmful software.</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Harvest or collect user data without authorization.</li>
              <li>Use the Service for fraudulent, deceptive, or illegal purposes.</li>
              <li>Resell, sublicense, or redistribute access to the Service without authorization.</li>
              <li>Use automated systems (bots, scrapers) to access the Service without permission.</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold">Intellectual Property</h2>
            
            <h3 className="text-xl font-medium mt-6">Our Property</h3>
            <p className="text-muted-foreground leading-relaxed">
              The Service, including its original content, features, functionality, design, and branding, is owned by CLMP Tech inc and protected by Canadian and international intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written consent.
            </p>

            <h3 className="text-xl font-medium mt-6">Your Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of all Content you upload to the Service. By uploading Content, you grant us a limited license to store, display, and process your Content solely for the purpose of providing the Service. We do not claim ownership of your project data, documents, or business information.
            </p>
          </section>

          {/* Data & Privacy */}
          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Data Protection & Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Service is subject to our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the Service, you consent to the data practices described in the Privacy Policy.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We implement industry-standard security measures but cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your login credentials and for any activities under your account.
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-semibold">Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive for 99.9% uptime but do not guarantee uninterrupted access. We may temporarily suspend the Service for maintenance, updates, or security reasons. We will provide advance notice when possible. We are not liable for any loss or damage resulting from service interruptions.
            </p>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-semibold">Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed uppercase font-medium">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not warrant that the Service will meet your requirements, be error-free, or that any defects will be corrected. The use of the Service for construction project management does not replace professional engineering, architectural, or legal advice.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Gavel className="h-6 w-6 text-primary" />
              Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLMP TECH INC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Our total liability for any claims arising from these Terms or the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold">Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless CLMP Tech inc and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold">Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may terminate your account at any time through your account settings. We may suspend or terminate your access immediately, without prior notice, for any breach of these Terms. Upon termination, your right to use the Service ceases immediately. You may request an export of your data within 30 days of termination.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold">Governing Law & Dispute Resolution</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of the Province of Ontario, Canada, without regard to conflict of law principles. Any disputes arising from these Terms shall be resolved through binding arbitration in Toronto, Ontario, in accordance with the Arbitration Act, 1991 (Ontario). You waive any right to participate in class action lawsuits.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-semibold">Modifications to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. Material changes will be communicated via email or through the Service at least 30 days before taking effect. Continued use of the Service after changes constitutes acceptance of the modified Terms. If you disagree with the changes, you must stop using the Service.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-2xl font-semibold">Severability</h2>
            <p className="text-muted-foreground leading-relaxed">
              If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect. Our failure to enforce any right or provision shall not constitute a waiver of that right or provision.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold">Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-muted/50 p-6 rounded-lg mt-4">
              <p className="font-semibold">CLMP Tech inc</p>
              <p className="text-muted-foreground">Legal Department</p>
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

export default TermsOfService;
