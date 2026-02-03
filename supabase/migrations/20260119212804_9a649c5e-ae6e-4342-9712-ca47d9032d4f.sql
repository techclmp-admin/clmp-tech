-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  description TEXT,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email templates
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (template_key, template_name, subject, html_content, description, variables) VALUES
(
  'welcome',
  'Welcome Email',
  'Welcome to CLMP Tech - Your Construction Management Partner',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CLMP Tech</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; color: #333;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0066cc 0%, #004d99 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🏗️ CLMP Tech</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Construction & Labour Management Platform</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #0066cc; font-size: 24px;">Welcome aboard, {{user_name}}!</h2>
              
              <p style="margin: 0 0 20px; line-height: 1.6; font-size: 16px;">
                Thank you for joining CLMP Tech. We''re excited to have you as part of our community of construction professionals across Canada.
              </p>
              
              <p style="margin: 0 0 20px; line-height: 1.6; font-size: 16px;">
                Your account has been successfully created and you now have access to our comprehensive construction management platform designed specifically for Canadian building standards and regulations.
              </p>
              
              <div style="background: #f8f9fa; border-left: 4px solid #0066cc; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 15px; color: #333; font-size: 18px;">🚀 Get Started</h3>
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Create your first project</li>
                  <li>Invite team members to collaborate</li>
                  <li>Track permits and inspections</li>
                  <li>Manage budgets and expenses</li>
                  <li>Stay compliant with Ontario Building Code</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="{{dashboard_url}}" style="display: inline-block; background: #0066cc; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Access Your Dashboard</a>
              </div>
              
              <p style="margin: 0 0 15px; line-height: 1.6; font-size: 16px;">
                If you have any questions, our support team is here to help. Simply reply to this email or visit our Help Centre.
              </p>
              
              <p style="margin: 30px 0 0; line-height: 1.6; font-size: 16px;">
                Best regards,<br>
                <strong>The CLMP Tech Team</strong><br>
                <span style="color: #666; font-size: 14px;">Toronto, Ontario, Canada</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                CLMP Tech Inc. | Advanced Construction Management Platform
              </p>
              <p style="margin: 0 0 15px; font-size: 12px; color: #999;">
                123 Construction Way, Toronto, ON M5V 1J2, Canada
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                <a href="https://clmp.ca" style="color: #0066cc; text-decoration: none;">clmp.ca</a> | 
                <a href="mailto:support@clmp.ca" style="color: #0066cc; text-decoration: none;">support@clmp.ca</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Sent to new users after successful registration',
  ARRAY['user_name', 'user_email', 'dashboard_url']
),
(
  'password_change_confirmation',
  'Password Change Confirmation',
  'Your CLMP Tech Password Has Been Changed',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; color: #333;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0066cc 0%, #004d99 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🏗️ CLMP Tech</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Security Notification</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="display: inline-block; background: #d4edda; color: #155724; padding: 10px 20px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                  ✓ Password Successfully Changed
                </span>
              </div>
              
              <h2 style="margin: 0 0 20px; color: #333; font-size: 22px;">Hello {{user_name}},</h2>
              
              <p style="margin: 0 0 20px; line-height: 1.6; font-size: 16px;">
                This email confirms that your CLMP Tech account password was successfully changed on <strong>{{change_date}}</strong> at <strong>{{change_time}} ({{timezone}})</strong>.
              </p>
              
              <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 10px; color: #856404; font-size: 16px;">⚠️ Didn''t Make This Change?</h3>
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  If you did not change your password, your account may have been compromised. Please take immediate action:
                </p>
                <ol style="margin: 10px 0 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.8;">
                  <li>Reset your password immediately</li>
                  <li>Review your recent account activity</li>
                  <li>Contact our support team</li>
                </ol>
              </div>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="{{reset_password_url}}" style="display: inline-block; background: #dc3545; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password Now</a>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <h4 style="margin: 0 0 10px; color: #333; font-size: 14px;">Security Tips:</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #666; line-height: 1.8;">
                  <li>Use a unique password for your CLMP Tech account</li>
                  <li>Enable two-factor authentication when available</li>
                  <li>Never share your login credentials</li>
                  <li>Log out from shared devices</li>
                </ul>
              </div>
              
              <p style="margin: 30px 0 0; line-height: 1.6; font-size: 16px;">
                If you made this change, no further action is required.<br><br>
                Best regards,<br>
                <strong>CLMP Tech Security Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                CLMP Tech Inc. | Advanced Construction Management Platform
              </p>
              <p style="margin: 0 0 15px; font-size: 12px; color: #999;">
                123 Construction Way, Toronto, ON M5V 1J2, Canada
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                <a href="https://clmp.ca" style="color: #0066cc; text-decoration: none;">clmp.ca</a> | 
                <a href="mailto:security@clmp.ca" style="color: #0066cc; text-decoration: none;">security@clmp.ca</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Sent when a user successfully changes their password',
  ARRAY['user_name', 'user_email', 'change_date', 'change_time', 'timezone', 'reset_password_url']
),
(
  'password_reset_request',
  'Password Reset Request',
  'Reset Your CLMP Tech Password',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; color: #333;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0066cc 0%, #004d99 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🏗️ CLMP Tech</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Password Reset</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333; font-size: 22px;">Hello {{user_name}},</h2>
              
              <p style="margin: 0 0 20px; line-height: 1.6; font-size: 16px;">
                We received a request to reset the password for your CLMP Tech account associated with <strong>{{user_email}}</strong>.
              </p>
              
              <p style="margin: 0 0 25px; line-height: 1.6; font-size: 16px;">
                Click the button below to create a new password. This link will expire in <strong>24 hours</strong> for your security.
              </p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="{{reset_link}}" style="display: inline-block; background: #0066cc; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
              </div>
              
              <div style="background: #e7f3ff; border: 1px solid #b6d4fe; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <p style="margin: 0; color: #0a58ca; font-size: 14px; line-height: 1.6;">
                  <strong>📌 Didn''t request this?</strong><br>
                  If you didn''t request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
              
              <p style="margin: 0 0 15px; line-height: 1.6; font-size: 14px; color: #666;">
                If the button above doesn''t work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 25px; word-break: break-all; font-size: 12px; color: #0066cc; background: #f8f9fa; padding: 15px; border-radius: 6px;">
                {{reset_link}}
              </p>
              
              <p style="margin: 30px 0 0; line-height: 1.6; font-size: 16px;">
                Best regards,<br>
                <strong>CLMP Tech Support Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                CLMP Tech Inc. | Advanced Construction Management Platform
              </p>
              <p style="margin: 0 0 15px; font-size: 12px; color: #999;">
                123 Construction Way, Toronto, ON M5V 1J2, Canada
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                <a href="https://clmp.ca" style="color: #0066cc; text-decoration: none;">clmp.ca</a> | 
                <a href="mailto:support@clmp.ca" style="color: #0066cc; text-decoration: none;">support@clmp.ca</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Sent when a user requests to reset their password',
  ARRAY['user_name', 'user_email', 'reset_link']
),
(
  'email_confirmation',
  'Email Confirmation',
  'Confirm Your CLMP Tech Email Address',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; color: #333;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0066cc 0%, #004d99 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🏗️ CLMP Tech</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Email Verification</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333; font-size: 22px;">Almost there, {{user_name}}!</h2>
              
              <p style="margin: 0 0 20px; line-height: 1.6; font-size: 16px;">
                Thank you for signing up for CLMP Tech. To complete your registration and access your account, please verify your email address.
              </p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="{{confirmation_link}}" style="display: inline-block; background: #28a745; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
              </div>
              
              <p style="margin: 0 0 15px; line-height: 1.6; font-size: 16px;">
                This verification link will expire in <strong>24 hours</strong>. If you don''t verify your email within this time, you''ll need to request a new verification link.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
                  <strong>Why verify?</strong> Verifying your email helps us secure your account and ensures you receive important project updates, team invitations, and security notifications.
                </p>
              </div>
              
              <p style="margin: 0 0 15px; line-height: 1.6; font-size: 14px; color: #666;">
                If the button above doesn''t work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 25px; word-break: break-all; font-size: 12px; color: #0066cc; background: #f8f9fa; padding: 15px; border-radius: 6px;">
                {{confirmation_link}}
              </p>
              
              <p style="margin: 30px 0 0; line-height: 1.6; font-size: 16px;">
                Welcome to CLMP Tech!<br>
                <strong>The CLMP Tech Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                CLMP Tech Inc. | Advanced Construction Management Platform
              </p>
              <p style="margin: 0 0 15px; font-size: 12px; color: #999;">
                123 Construction Way, Toronto, ON M5V 1J2, Canada
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                <a href="https://clmp.ca" style="color: #0066cc; text-decoration: none;">clmp.ca</a> | 
                <a href="mailto:support@clmp.ca" style="color: #0066cc; text-decoration: none;">support@clmp.ca</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Sent to verify a new user email address',
  ARRAY['user_name', 'user_email', 'confirmation_link']
);

-- Create email logs table
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  resend_message_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all email logs
CREATE POLICY "Admins can view email logs"
ON public.email_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_email_logs_template_key ON public.email_logs(template_key);
CREATE INDEX idx_email_logs_recipient_email ON public.email_logs(recipient_email);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);