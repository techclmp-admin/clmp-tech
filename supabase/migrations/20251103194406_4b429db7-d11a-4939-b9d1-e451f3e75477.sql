-- Update Vietnamese room names to English
UPDATE chat_rooms
SET name = 'Group 1'
WHERE name = 'Nhóm 1';

UPDATE chat_rooms
SET name = REPLACE(name, 'Discussion:', 'Chat:')
WHERE name LIKE 'Discussion:%';

-- Update any remaining Vietnamese text patterns
UPDATE chat_rooms
SET name = 'General Discussion'
WHERE name ILIKE '%nhóm%' OR name ILIKE '%thảo luận%';
