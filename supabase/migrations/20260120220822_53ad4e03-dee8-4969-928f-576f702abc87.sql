-- Add missing columns to support_categories
ALTER TABLE public.support_categories 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add missing columns to support_faqs
ALTER TABLE public.support_faqs
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- Add missing columns to support_articles
ALTER TABLE public.support_articles
ADD COLUMN IF NOT EXISTS excerpt TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS author_id UUID;

-- Add missing columns to support_tickets
ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS ticket_number TEXT,
ADD COLUMN IF NOT EXISTS ticket_status TEXT DEFAULT 'open',
ADD COLUMN IF NOT EXISTS ticket_category TEXT,
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'normal';

-- Seed support categories
INSERT INTO public.support_categories (id, name, description, icon, color, is_active, sort_order)
VALUES 
  ('11111111-1111-1111-1111-111111111101', 'Getting Started', 'New to CLMP? Start here for basic setup and orientation', 'Rocket', 'blue', true, 1),
  ('11111111-1111-1111-1111-111111111102', 'Project Management', 'Help with creating and managing construction projects', 'FolderOpen', 'green', true, 2),
  ('11111111-1111-1111-1111-111111111103', 'Budget & Finance', 'Questions about budgets, expenses, and financial tracking', 'DollarSign', 'orange', true, 3),
  ('11111111-1111-1111-1111-111111111104', 'Team & Collaboration', 'Managing team members, roles, and permissions', 'Users', 'purple', true, 4),
  ('11111111-1111-1111-1111-111111111105', 'Compliance & Safety', 'Permits, inspections, and regulatory compliance', 'Shield', 'red', true, 5),
  ('11111111-1111-1111-1111-111111111106', 'Billing & Subscription', 'Payment methods, invoices, and subscription plans', 'CreditCard', 'yellow', true, 6),
  ('11111111-1111-1111-1111-111111111107', 'Technical Issues', 'Bug reports and technical troubleshooting', 'Bug', 'gray', true, 7),
  ('11111111-1111-1111-1111-111111111108', 'Integrations', 'QuickBooks, Sage 50, and third-party integrations', 'Plug', 'cyan', true, 8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- Seed FAQs
INSERT INTO public.support_faqs (id, category_id, question, answer, is_published, is_featured, sort_order, view_count)
VALUES 
  -- Getting Started
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 
   'How do I create my first project?',
   'To create your first project: 1) Go to the Projects page from the sidebar. 2) Click the "New Project" button. 3) Fill in the project details including name, description, and location. 4) Set your budget and timeline. 5) Click "Create Project" to save. You can also use project templates for faster setup.',
   true, true, 1, 125),
  
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101',
   'What features are included in the free trial?',
   'The 30-day free trial includes full access to all CLMP features: project management, team collaboration, budget tracking, compliance tools, AI risk alerts, and more. No credit card is required to start your trial.',
   true, true, 2, 98),

  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101',
   'How do I invite team members to my workspace?',
   'Navigate to the Team page and click "Invite Member". Enter their email address and select their role (Admin, Project Manager, Team Member, or Viewer). They will receive an invitation email with a link to join your workspace.',
   true, false, 3, 76),

  -- Project Management
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102',
   'Can I use templates for common project types?',
   'Yes! CLMP offers pre-built templates for common construction project types. Go to Templates page, browse available templates, and click "Use Template" to create a new project with pre-configured tasks, milestones, and settings.',
   true, true, 1, 89),

  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111102',
   'How do I track project progress?',
   'Project progress can be tracked through: 1) The Dashboard showing overall KPIs. 2) Project Details page with task completion rates. 3) Gantt Chart view for timeline visualization. 4) Kanban board for task status. 5) Reports for detailed analytics.',
   true, false, 2, 67),

  -- Budget & Finance
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111103',
   'How does the Canadian tax compliance work?',
   'CLMP automatically tracks GST/HST on all expenses. You can configure your province settings for accurate tax rates. Reports are generated in CRA-compliant format for easy tax filing. All expenses are categorized according to Canadian accounting standards.',
   true, true, 1, 112),

  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111103',
   'Can I export financial data to QuickBooks?',
   'Yes! Connect your QuickBooks account from the Integrations page. Once connected, you can sync expenses, invoices, and project costs between CLMP and QuickBooks. Two-way sync keeps both systems up to date.',
   true, false, 2, 54),

  -- Team & Collaboration
  ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111104',
   'What are the different user roles?',
   'CLMP has 4 user roles: 1) Admin - Full access to all features and settings. 2) Project Manager - Manage assigned projects and team members. 3) Team Member - View and update tasks, submit expenses. 4) Viewer - Read-only access to project information.',
   true, true, 1, 145),

  -- Compliance & Safety
  ('22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111105',
   'How do I track permits and inspections?',
   'Go to the Compliance page to manage permits and inspections. Add permits with issue/expiry dates, schedule inspections, and record results. Set up reminders to avoid missing deadlines. All documents can be uploaded for record-keeping.',
   true, true, 1, 87),

  -- Billing
  ('22222222-2222-2222-2222-222222222210', '11111111-1111-1111-1111-111111111106',
   'How do I upgrade my subscription?',
   'Go to Settings > Billing or click the Billing link in the sidebar. Choose from our available plans (Starter, Professional, Enterprise) and complete the payment process. Your new features will be available immediately.',
   true, true, 1, 93),

  ('22222222-2222-2222-2222-222222222211', '11111111-1111-1111-1111-111111111106',
   'What payment methods are accepted?',
   'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards. Enterprise customers can also pay by invoice or wire transfer.',
   true, false, 2, 41)

ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;

-- Seed support articles
INSERT INTO public.support_articles (id, title, content, category_id, is_published, view_count, excerpt, featured)
VALUES 
  ('33333333-3333-3333-3333-333333333301', 
   'Complete Guide to Project Setup',
   'This comprehensive guide walks you through setting up your first construction project in CLMP. Learn how to configure project settings, invite team members, set up budgets, and track progress effectively.

## Step 1: Create Your Project
Navigate to the Projects page and click "New Project". Fill in the essential details like project name, description, and location.

## Step 2: Configure Budget
Set up your budget categories (materials, labor, equipment) and allocate funds. Enable budget alerts to stay on track.

## Step 3: Add Team Members
Invite your team with appropriate roles. Assign project managers and team members to specific tasks.

## Step 4: Create Tasks
Break down your project into manageable tasks. Use the Kanban board or Gantt chart for visualization.',
   '11111111-1111-1111-1111-111111111101',
   true, 234,
   'A step-by-step guide to creating and configuring your first project in CLMP.',
   true),

  ('33333333-3333-3333-3333-333333333302',
   'Managing Team Permissions',
   'Learn how to effectively manage user roles and permissions in your CLMP workspace. This guide covers role assignments, custom permissions, and best practices for team management.

## Understanding Roles
- **Admin**: Full system access
- **Project Manager**: Project-level administration
- **Team Member**: Task execution and updates
- **Viewer**: Read-only access

## Assigning Roles
Go to Team > Member Settings to modify roles. Changes take effect immediately.

## Best Practices
- Follow the principle of least privilege
- Regularly review access permissions
- Document role assignments for auditing',
   '11111111-1111-1111-1111-111111111104',
   true, 156,
   'A guide to understanding and managing user permissions in your workspace.',
   true),

  ('33333333-3333-3333-3333-333333333303',
   'Budget Tracking Best Practices',
   'Master budget management in CLMP with these proven strategies. Learn how to set up budgets, track expenses, and generate financial reports.

## Setting Up Budgets
Define clear budget categories that align with your project structure. Common categories include:
- Labor costs
- Materials
- Equipment rental
- Permits and fees
- Contingency

## Tracking Expenses
Record all expenses with proper documentation. Upload receipts and categorize each expense for accurate tracking.

## Financial Reports
Generate reports for stakeholders, tax filing, and project analysis. Export to PDF or CSV formats.',
   '11111111-1111-1111-1111-111111111103',
   true, 189,
   'Learn effective budget management strategies for construction projects.',
   true)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  excerpt = EXCLUDED.excerpt,
  featured = EXCLUDED.featured;