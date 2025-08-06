-- Populate resource_library table with demo data using actual user_id and church_id
-- Based on the actual schema provided by the user

-- First, let's see what users and their church_ids exist
SELECT 'Current users and church_ids:' as info;
SELECT 
    p.id as user_id, 
    p.email, 
    p.first_name, 
    p.last_name, 
    p.church_id
FROM profiles p
WHERE p.church_id IS NOT NULL
LIMIT 5;

-- Clear existing demo data (optional)
-- DELETE FROM resource_library WHERE title LIKE '%Vocational Statement' OR title LIKE '%Scenario' OR title LIKE '%Mission Statement' OR title LIKE '%Plan';

-- Insert demo data using the first available user and their church_id
INSERT INTO resource_library (
    id, 
    user_id, 
    church_id, 
    title, 
    content, 
    resource_type, 
    scenario_title, 
    tags, 
    created_by,
    created_at, 
    updated_at
)
SELECT 
    gen_random_uuid(),
    p.id as user_id,
    p.church_id,
    'Community Outreach Vocational Statement',
    'I feel called to serve my community through compassionate outreach programs that address the needs of the most vulnerable. My vocation is to bridge the gap between our church and the broader community, creating meaningful connections that reflect Christ''s love. I am particularly drawn to working with families in crisis, providing both spiritual support and practical assistance. This calling has been confirmed through prayer, community feedback, and my personal experiences of transformation through service. I believe God has equipped me with empathy, organizational skills, and a heart for justice to serve in this capacity.',
    'vocational_statement',
    'Urban Community Ministry',
    ARRAY['Community Service', 'Outreach', 'Families', 'Crisis Support', 'Social Justice'],
    COALESCE(p.first_name || ' ' || p.last_name, p.email),
    NOW(),
    NOW()
FROM profiles p 
WHERE p.church_id IS NOT NULL 
LIMIT 1;

INSERT INTO resource_library (
    id, user_id, church_id, title, content, resource_type, scenario_title, tags, created_by, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    p.id,
    p.church_id,
    'Youth Ministry Vocational Statement',
    'God has placed a deep burden on my heart for the spiritual development of young people in our community. I believe I am called to create safe spaces where teenagers can explore their faith, ask difficult questions, and develop authentic relationships with Christ and each other. My vocation involves mentoring, teaching, and advocating for youth both within our church walls and in the broader community.',
    'vocational_statement',
    'Next Generation Leadership',
    ARRAY['Youth', 'Mentoring', 'Discipleship', 'Community', 'Leadership Development'],
    COALESCE(p.first_name || ' ' || p.last_name, p.email),
    NOW(),
    NOW()
FROM profiles p 
WHERE p.church_id IS NOT NULL 
LIMIT 1;

INSERT INTO resource_library (
    id, user_id, church_id, title, content, resource_type, scenario_title, tags, created_by, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    p.id,
    p.church_id,
    'Food Security Crisis Scenario',
    'Our neighborhood faces a significant food security crisis that demands immediate and long-term intervention. Current data shows that 35% of families in our area struggle to access nutritious meals regularly, with the situation worsening during economic downturns. Local schools report increasing numbers of students relying on free breakfast and lunch programs as their primary source of nutrition.',
    'scenario_details',
    'Neighborhood Food Security Initiative',
    ARRAY['Food Security', 'Community Garden', 'Partnerships', 'Sustainability', 'Vulnerable Populations'],
    COALESCE(p.first_name || ' ' || p.last_name, p.email),
    NOW(),
    NOW()
FROM profiles p 
WHERE p.church_id IS NOT NULL 
LIMIT 1;

INSERT INTO resource_library (
    id, user_id, church_id, title, content, resource_type, scenario_title, tags, created_by, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    p.id,
    p.church_id,
    'Senior Isolation and Care Scenario',
    'Our community has a growing population of seniors (65+) who make up 28% of our neighborhood demographics, with many facing significant challenges related to social isolation, healthcare access, and daily living support. Through community surveys and door-to-door visits, we have identified 67 seniors living alone within our immediate area.',
    'scenario_details',
    'Caring for Our Elders Initiative',
    ARRAY['Seniors', 'Social Isolation', 'Transportation', 'Healthcare', 'Advocacy', 'Community Care'],
    COALESCE(p.first_name || ' ' || p.last_name, p.email),
    NOW(),
    NOW()
FROM profiles p 
WHERE p.church_id IS NOT NULL 
LIMIT 1;

INSERT INTO resource_library (
    id, user_id, church_id, title, content, resource_type, scenario_title, tags, created_by, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    p.id,
    p.church_id,
    'Community Transformation Mission Statement',
    'Our mission is to be a catalyst for holistic community transformation by addressing the spiritual, social, and economic needs of our neighborhood through innovative ministries, strategic partnerships, and sustainable solutions. We are committed to walking alongside our neighbors, particularly those who are marginalized or underserved, to create opportunities for healing, growth, and empowerment.',
    'mission_statement',
    'Community Transformation Initiative',
    ARRAY['Community Transformation', 'Holistic Ministry', 'Social Justice', 'Partnerships', 'Empowerment'],
    COALESCE(p.first_name || ' ' || p.last_name, p.email),
    NOW(),
    NOW()
FROM profiles p 
WHERE p.church_id IS NOT NULL 
LIMIT 1;

INSERT INTO resource_library (
    id, user_id, church_id, title, content, resource_type, scenario_title, tags, created_by, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    p.id,
    p.church_id,
    'Three-Year Community Transformation Plan',
    '{"title": "Comprehensive Community Transformation Initiative", "description": "A strategic three-year plan for deepening our church''s engagement with the local community through targeted ministries, sustainable partnerships, and measurable impact.", "vision": "To see our neighborhood transformed into a thriving, connected community where every person has access to opportunities for spiritual, social, and economic flourishing.", "phases": [{"phase": 1, "title": "Foundation Building and Assessment", "timeline": "Months 1-12", "budget": 85000}, {"phase": 2, "title": "Program Expansion and Deepening", "timeline": "Months 13-24", "budget": 120000}, {"phase": 3, "title": "Sustainability and Replication", "timeline": "Months 25-36", "budget": 95000}], "total_budget": 300000}',
    'discernment_plan',
    'Community Transformation Initiative',
    ARRAY['Strategic Planning', 'Community Engagement', 'Long-term', 'Transformation', 'Sustainability'],
    COALESCE(p.first_name || ' ' || p.last_name, p.email),
    NOW(),
    NOW()
FROM profiles p 
WHERE p.church_id IS NOT NULL 
LIMIT 1;

-- Verify the data was inserted with correct church_id
SELECT 'Inserted resources:' as info;
SELECT 
    title, 
    resource_type, 
    user_id, 
    church_id,
    created_by,
    created_at
FROM resource_library 
WHERE title IN (
    'Community Outreach Vocational Statement',
    'Youth Ministry Vocational Statement', 
    'Food Security Crisis Scenario',
    'Senior Isolation and Care Scenario',
    'Community Transformation Mission Statement',
    'Three-Year Community Transformation Plan'
)
ORDER BY created_at DESC;

-- Check total count by resource type
SELECT 'Resource counts by type:' as info;
SELECT 
    resource_type, 
    COUNT(*) as count,
    COUNT(CASE WHEN church_id IS NOT NULL THEN 1 END) as with_church_id
FROM resource_library 
GROUP BY resource_type
ORDER BY resource_type;

-- ========================================
-- POPULATE SURVEY_TEMPLATES TABLE
-- ========================================

-- Check current survey templates
SELECT 'Current survey templates:' as info;
SELECT 
    id, 
    title, 
    survey_type, 
    church_id, 
    is_active, 
    created_at
FROM survey_templates 
LIMIT 5;

-- Insert demo survey templates
INSERT INTO survey_templates (
    id,
    title,
    description,
    created_by,
    church_id,
    survey_type,
    metadata,
    is_active,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Parish Community Assessment Survey',
    'A comprehensive survey to assess the spiritual, social, and practical needs of our parish community.',
    COALESCE(p.first_name || ' ' || p.last_name, p.email),
    p.church_id,
    'parish',
    '{
        "template_data": {
            "title": "Parish Community Assessment Survey",
            "description": "A comprehensive survey to assess the spiritual, social, and practical needs of our parish community.",
            "questions": [
                {
                    "id": "q1",
                    "text": "How would you describe your current level of engagement with our parish community?",
                    "type": "multiple_choice",
                    "options": ["Very engaged", "Somewhat engaged", "Minimally engaged", "Not engaged"],
                    "required": true
                },
                {
                    "id": "q2",
                    "text": "What are the most pressing spiritual needs in our community?",
                    "type": "text",
                    "required": true
                },
                {
                    "id": "q3",
                    "text": "How can our parish better serve families with children?",
                    "type": "text",
                    "required": false
                },
                {
                    "id": "q4",
                    "text": "What ministries or programs would you like to see expanded?",
                    "type": "multiple_choice",
                    "options": ["Youth Ministry", "Senior Care", "Community Outreach", "Bible Study", "Music Ministry", "Food Pantry"],
                    "required": false
                }
            ]
        }
    }'::json,
    true,
    NOW(),
    NOW()
FROM profiles p 
WHERE p.church_id IS NOT NULL 
LIMIT 1;

INSERT INTO survey_templates (
    id,
    title,
    description,
    created_by,
    church_id,
    survey_type,
    metadata,
    is_active,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Neighborhood Outreach Survey',
    'Survey to understand the needs and opportunities for ministry in our surrounding neighborhood.',
    COALESCE(p.first_name || ' ' || p.last_name, p.email),
    p.church_id,
    'neighborhood',
    '{
        "template_data": {
            "title": "Neighborhood Outreach Survey",
            "description": "Survey to understand the needs and opportunities for ministry in our surrounding neighborhood.",
            "questions": [
                {
                    "id": "q1",
                    "text": "What are the biggest challenges facing families in this neighborhood?",
                    "type": "text",
                    "required": true
                },
                {
                    "id": "q2",
                    "text": "How would you rate the sense of community in this area?",
                    "type": "multiple_choice",
                    "options": ["Very strong", "Somewhat strong", "Weak", "Very weak"],
                    "required": true
                },
                {
                    "id": "q3",
                    "text": "What services or programs would benefit this community most?",
                    "type": "multiple_choice",
                    "options": ["After-school programs", "Senior services", "Food assistance", "Job training", "Healthcare access", "Transportation"],
                    "required": false
                },
                {
                    "id": "q4",
                    "text": "Would you be interested in participating in community improvement initiatives?",
                    "type": "multiple_choice",
                    "options": ["Very interested", "Somewhat interested", "Not sure", "Not interested"],
                    "required": false
                }
            ]
        }
    }'::json,
    true,
    NOW(),
    NOW()
FROM profiles p 
WHERE p.church_id IS NOT NULL 
LIMIT 1;

INSERT INTO survey_templates (
    id,
    title,
    description,
    created_by,
    church_id,
    survey_type,
    metadata,
    is_active,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Ministry Volunteer Interest Survey',
    'Survey to identify volunteer interests and availability for various ministry opportunities.',
    COALESCE(p.first_name || ' ' || p.last_name, p.email),
    p.church_id,
    'volunteer',
    '{
        "template_data": {
            "title": "Ministry Volunteer Interest Survey",
            "description": "Survey to identify volunteer interests and availability for various ministry opportunities.",
            "questions": [
                {
                    "id": "q1",
                    "text": "Which ministry areas interest you most?",
                    "type": "multiple_choice",
                    "options": ["Children Ministry", "Youth Ministry", "Music Ministry", "Outreach", "Administration", "Facilities", "Food Ministry"],
                    "required": true
                },
                {
                    "id": "q2",
                    "text": "How many hours per month could you volunteer?",
                    "type": "multiple_choice",
                    "options": ["1-2 hours", "3-5 hours", "6-10 hours", "More than 10 hours"],
                    "required": true
                },
                {
                    "id": "q3",
                    "text": "What skills or experience do you bring?",
                    "type": "text",
                    "required": false
                },
                {
                    "id": "q4",
                    "text": "What days/times work best for you?",
                    "type": "multiple_choice",
                    "options": ["Sunday mornings", "Sunday evenings", "Weekday mornings", "Weekday evenings", "Saturdays"],
                    "required": false
                }
            ]
        }
    }'::json,
    true,
    NOW(),
    NOW()
FROM profiles p 
WHERE p.church_id IS NOT NULL 
LIMIT 1;

-- Verify survey templates were inserted
SELECT 'Inserted survey templates:' as info;
SELECT 
    title,
    survey_type,
    church_id,
    is_active,
    created_by,
    created_at
FROM survey_templates 
WHERE title IN (
    'Parish Community Assessment Survey',
    'Neighborhood Outreach Survey',
    'Ministry Volunteer Interest Survey'
)
ORDER BY created_at DESC;

-- Check total survey count
SELECT 'Survey template counts:' as info;
SELECT 
    survey_type,
    COUNT(*) as count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM survey_templates 
GROUP BY survey_type
ORDER BY survey_type;
