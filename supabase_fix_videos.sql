-- Update video URLs for default courses to working YouTube links
UPDATE courses 
SET "videoUrl" = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' 
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE courses 
SET "videoUrl" = 'https://www.youtube.com/watch?v=9No-FiEuy60' 
WHERE id = '00000000-0000-0000-0000-000000000002';
