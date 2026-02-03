import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, MapPin, Clock, Send, MessageSquare, Headphones, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import clmpLogo from "@/assets/clmp-logo.png";

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    inquiryType: "",
    subject: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Message sent successfully!",
      description: "Our team will get back to you within 24 business hours.",
    });

    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      inquiryType: "",
      subject: "",
      message: ""
    });
    setIsSubmitting(false);
  };

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

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Have questions about CLMP? Our team is here to help you streamline your construction projects.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Whether you're looking for a demo, have technical questions, or want to discuss enterprise solutions, we're ready to assist.
              </p>
            </div>

            {/* Contact Cards */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Send an Email</h3>
                    <p className="text-muted-foreground text-sm mb-2">For general inquiries</p>
                    <a href="mailto:info@clmptech.ca" className="text-primary hover:underline">
                      info@clmptech.ca
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Call Us</h3>
                    <p className="text-muted-foreground text-sm mb-2">Mon-Fri, 9AM-6PM EST</p>
                    <a href="tel:+17059859688" className="text-primary hover:underline">
                      +1 (705) 985-9688
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Find Us</h3>
                    <p className="text-muted-foreground text-sm">
                      Unit 4, CLMP Tech Inc<br />
                      205 Torbay Road<br />
                      Markham, ON, Canada<br />
                      L3R 3W4
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Business Hours</h3>
                    <p className="text-muted-foreground text-sm">
                      Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                      Saturday - Sunday: Closed<br />
                      24/7 Emergency Support for Enterprise
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="pt-6">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-3">
                <a href="mailto:info@clmptech.ca" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Building2 className="h-4 w-4" />
                  <span>General Inquiries: info@clmptech.ca</span>
                </a>
                <a href="mailto:support@clmptech.ca" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Headphones className="h-4 w-4" />
                  <span>Technical Support: support@clmptech.ca</span>
                </a>
                <a href="tel:+17059859688" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="h-4 w-4" />
                  <span>Phone: +1 (705) 985-9688</span>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll respond within 24 business hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        placeholder="Smith"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="john@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (416) 555-0123"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Your Construction Company"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiryType">Inquiry Type *</Label>
                      <Select 
                        value={formData.inquiryType} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, inquiryType: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select inquiry type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="demo">Request a Demo</SelectItem>
                          <SelectItem value="sales">Sales Inquiry</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                          <SelectItem value="enterprise">Enterprise Solutions</SelectItem>
                          <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                          <SelectItem value="billing">Billing Question</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      placeholder="How can we help you?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      placeholder="Tell us more about your project needs, questions, or how we can assist you..."
                    />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    By submitting this form, you agree to our{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>.
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* FAQ Callout */}
            <Card className="mt-6 bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <MessageSquare className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Looking for quick answers?</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Check out our Help & Support page for FAQs, user guides, and troubleshooting tips.
                    </p>
                    <Button variant="outline" asChild>
                      <Link to="/help">Visit Help Center</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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

export default Contact;
