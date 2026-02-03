-- Update all email templates with correct contact information and logo
UPDATE public.email_templates
SET html_content = REPLACE(html_content, '123 Construction Way, Toronto, ON M5V 1J2, Canada', 'Unit 4, 205 Torbay Road, Markham, ON L3R 3W4, Canada'),
    updated_at = now()
WHERE html_content LIKE '%123 Construction Way%';

UPDATE public.email_templates
SET html_content = REPLACE(html_content, 'support@clmp.ca', 'info@clmptech.ca'),
    updated_at = now()
WHERE html_content LIKE '%support@clmp.ca%';

UPDATE public.email_templates
SET html_content = REPLACE(html_content, 'security@clmp.ca', 'info@clmptech.ca'),
    updated_at = now()
WHERE html_content LIKE '%security@clmp.ca%';

-- Update logo from emoji to actual logo image
UPDATE public.email_templates
SET html_content = REPLACE(
  html_content, 
  '<h1 style="margin: 0; font-size: 28px; color: #ffffff;">🏗️ CLMP Tech</h1>',
  '<img src="https://clmp.ca/images/clmp-logo-full.png" alt="CLMP Tech" style="height: 50px; margin-bottom: 10px;" />'
),
updated_at = now()
WHERE html_content LIKE '%🏗️ CLMP Tech%';