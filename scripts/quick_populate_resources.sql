-- Quick script to populate resource_library with demo data using your actual user_id
-- Run this in your Supabase SQL editor

-- First, let's see what user_ids exist
SELECT id, email, first_name, last_name FROM profiles LIMIT 5;

-- Use this query to get your user_id, then replace USER_ID_HERE in the inserts below
-- SELECT id FROM profiles WHERE email = 'your-email@example.com';

-- REPLACE 'USER_ID_HERE' with your actual user_id from the query above
-- Then run these INSERT statements:

INSERT INTO resource_library (id, title, content, resource_type, scenario_title, tags, user_id, created_at, updated_at) VALUES 
(gen_random_uuid(), 'Community Outreach Vocational Statement', 'I feel called to serve my community through compassionate outreach programs that address the needs of the most vulnerable. My vocation is to bridge the gap between our church and the broader community, creating meaningful connections that reflect Christ''s love.', 'vocational_statement', 'Urban Community Ministry', ARRAY['Community Service', 'Outreach', 'Families'], 'USER_ID_HERE', NOW(), NOW()),

(gen_random_uuid(), 'Youth Ministry Vocational Statement', 'God has placed a deep burden on my heart for the spiritual development of young people in our community. I believe I am called to create safe spaces where teenagers can explore their faith and develop authentic relationships with Christ.', 'vocational_statement', 'Next Generation Leadership', ARRAY['Youth', 'Mentoring', 'Discipleship'], 'USER_ID_HERE', NOW(), NOW()),

(gen_random_uuid(), 'Food Security Crisis Scenario', 'Our neighborhood faces a significant food security crisis that demands immediate and long-term intervention. Current data shows that 35% of families in our area struggle to access nutritious meals regularly.', 'scenario_details', 'Neighborhood Food Security Initiative', ARRAY['Food Security', 'Community Garden', 'Partnerships'], 'USER_ID_HERE', NOW(), NOW()),

(gen_random_uuid(), 'Senior Isolation and Care Scenario', 'Our community has a growing population of seniors (65+) who make up 28% of our neighborhood demographics, with many facing significant challenges related to social isolation and healthcare access.', 'scenario_details', 'Caring for Our Elders Initiative', ARRAY['Seniors', 'Social Isolation', 'Healthcare'], 'USER_ID_HERE', NOW(), NOW()),

(gen_random_uuid(), 'Community Transformation Mission Statement', 'Our mission is to be a catalyst for holistic community transformation by addressing the spiritual, social, and economic needs of our neighborhood through innovative ministries and strategic partnerships.', 'mission_statement', 'Community Transformation Initiative', ARRAY['Community Transformation', 'Holistic Ministry', 'Social Justice'], 'USER_ID_HERE', NOW(), NOW()),

(gen_random_uuid(), 'Three-Year Community Transformation Plan', '{"title": "Comprehensive Community Transformation Initiative", "description": "A strategic three-year plan for deepening our church engagement with the local community", "vision": "To see our neighborhood transformed into a thriving, connected community"}', 'discernment_plan', 'Community Transformation Initiative', ARRAY['Strategic Planning', 'Community Engagement', 'Long-term'], 'USER_ID_HERE', NOW(), NOW());

-- Verify the data was inserted
SELECT title, resource_type, user_id, created_at FROM resource_library ORDER BY created_at DESC;
