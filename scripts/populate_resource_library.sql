-- Comprehensive SQL to populate resource_library table with vocational statements, scenarios, and mission statements
-- This script will automatically use the first available user_id from the profiles table

-- First, let's check the current structure of the resource_library table
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'resource_library';

-- Clear existing test data (optional - remove this if you want to keep existing data)
-- DELETE FROM resource_library WHERE resource_type IN ('vocational_statement', 'scenario_details', 'mission_statement', 'discernment_plan');

-- Get the first available user_id for demo data
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Get the first user_id from profiles table
    SELECT id INTO demo_user_id FROM profiles LIMIT 1;
    
    -- If no users exist, create a demo user_id
    IF demo_user_id IS NULL THEN
        demo_user_id := gen_random_uuid();
        INSERT INTO profiles (id, email, first_name, last_name, preferred_name, created_at, updated_at)
        VALUES (demo_user_id, 'demo@example.com', 'Demo', 'User', 'Demo User', NOW(), NOW());
    END IF;

    -- VOCATIONAL STATEMENTS
    INSERT INTO resource_library (
      id, title, content, resource_type, scenario_title, tags, user_id, created_at, updated_at
    ) VALUES 
    (
      gen_random_uuid(),
      'Community Outreach Vocational Statement',
      'I feel called to serve my community through compassionate outreach programs that address the needs of the most vulnerable. My vocation is to bridge the gap between our church and the broader community, creating meaningful connections that reflect Christ''s love. I am particularly drawn to working with families in crisis, providing both spiritual support and practical assistance. This calling has been confirmed through prayer, community feedback, and my personal experiences of transformation through service. I believe God has equipped me with empathy, organizational skills, and a heart for justice to serve in this capacity.',
      'vocational_statement',
      'Urban Community Ministry',
      ARRAY['Community Service', 'Outreach', 'Families', 'Crisis Support', 'Social Justice'],
      demo_user_id,
      NOW(),
      NOW()
    ),
(
  gen_random_uuid(),
  'Youth Ministry Vocational Statement',
  'God has placed a deep burden on my heart for the spiritual development of young people in our community. I believe I am called to create safe spaces where teenagers can explore their faith, ask difficult questions, and develop authentic relationships with Christ and each other. My vocation involves mentoring, teaching, and advocating for youth both within our church walls and in the broader community. I see this calling as essential for the future of our church and the transformation of our neighborhood. Through prayer and discernment, I have recognized my gifts in connecting with young people, understanding their struggles, and guiding them toward spiritual maturity.',
  'vocational_statement',
  'Next Generation Leadership',
  ARRAY['Youth', 'Mentoring', 'Discipleship', 'Community', 'Leadership Development'],
  'YOUR_USER_ID', -- Replace with actual user_id
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Pastoral Care Vocational Statement',
  'I am called to walk alongside people during their most vulnerable moments, offering spiritual comfort, practical support, and the presence of Christ. My vocation in pastoral care extends beyond traditional boundaries to include hospital visits, grief counseling, marriage support, and crisis intervention. I feel particularly drawn to serving those who are marginalized or forgotten by society. This calling has been affirmed through my experiences of providing comfort to others and seeing God work through these encounters. I believe I am equipped with compassion, listening skills, and spiritual discernment to serve in this ministry.',
  'vocational_statement',
  'Pastoral Care Ministry',
  ARRAY['Pastoral Care', 'Counseling', 'Crisis Support', 'Marginalized Communities', 'Spiritual Direction'],
  'YOUR_USER_ID', -- Replace with actual user_id
  NOW(),
  NOW()
);

-- SCENARIO DETAILS
INSERT INTO resource_library (
  id, title, content, resource_type, scenario_title, tags, user_id, created_at, updated_at
) VALUES 
(
  gen_random_uuid(),
  'Food Security Crisis Scenario',
  'Our neighborhood faces a significant food security crisis that demands immediate and long-term intervention. Current data shows that 35% of families in our area struggle to access nutritious meals regularly, with the situation worsening during economic downturns. Local schools report increasing numbers of students relying on free breakfast and lunch programs as their primary source of nutrition. Additionally, 45+ elderly residents within a 6-block radius have limited mobility for grocery shopping, creating a vulnerable population at risk of malnutrition. The nearest full-service grocery store is 2.5 miles away, effectively creating a food desert in our community. However, we have identified several opportunities: a vacant lot suitable for community gardening (0.8 acres), partnerships with three local farms willing to donate surplus produce, and a network of 25+ volunteers ready to help with food distribution. The local community center has offered storage space, and we have connections with the regional food bank. This scenario presents both urgent needs and sustainable solutions that could transform our community''s relationship with food security while building stronger neighborhood connections and self-sufficiency.',
  'scenario_details',
  'Neighborhood Food Security Initiative',
  ARRAY['Food Security', 'Community Garden', 'Partnerships', 'Sustainability', 'Vulnerable Populations'],
  'YOUR_USER_ID', -- Replace with actual user_id
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Senior Isolation and Care Scenario',
  'Our community has a growing population of seniors (65+) who make up 28% of our neighborhood demographics, with many facing significant challenges related to social isolation, healthcare access, and daily living support. Through community surveys and door-to-door visits, we have identified 67 seniors living alone within our immediate area, with 40% reporting feelings of loneliness and disconnection. Transportation barriers prevent many from accessing essential services, medical appointments, and social activities. The local senior center closed 18 months ago due to budget cuts, leaving a critical gap in services and community connection points. Healthcare challenges include medication management, fall prevention, and mental health support. However, our assessment reveals significant opportunities: our church facility has accessible meeting spaces, we have identified 30+ volunteers with various skills (nursing, transportation, companionship), and partnerships are possible with local healthcare providers and social services. The scenario calls for a comprehensive senior care ministry that includes weekly social gatherings, transportation assistance, home visits, wellness checks, and advocacy for senior-friendly community improvements. This initiative could serve as a model for other communities facing similar demographic challenges.',
  'scenario_details',
  'Caring for Our Elders Initiative',
  ARRAY['Seniors', 'Social Isolation', 'Transportation', 'Healthcare', 'Advocacy', 'Community Care'],
  'YOUR_USER_ID', -- Replace with actual user_id
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Educational Gap and Youth Development Scenario',
  'Our community faces significant educational challenges that impact both immediate academic outcomes and long-term economic development. Local schools report a 23% chronic absenteeism rate, with standardized test scores consistently below state averages. After-school supervision is limited, leading to increased youth engagement in risky behaviors during the 3-6 PM window. Adult literacy rates in our area are 15% below the national average, limiting employment opportunities and economic mobility. However, our community assessment reveals substantial assets: retired teachers willing to volunteer, college students seeking service learning opportunities, and local businesses interested in mentorship programs. Our church facility includes classrooms, computer access, and library space that could support educational initiatives. The scenario presents an opportunity to establish a comprehensive learning hub that addresses multiple educational needs: after-school tutoring for K-12 students, adult literacy and GED preparation classes, computer skills workshops, job readiness training, and college preparation support. Partnerships with the local school district, community college, and workforce development agencies could provide curriculum support and credentialing. This initiative could significantly impact educational outcomes while strengthening community connections and economic development prospects.',
  'scenario_details',
  'Community Learning Hub Development',
  ARRAY['Education', 'Youth Development', 'Adult Learning', 'Community Development', 'Economic Mobility'],
  'YOUR_USER_ID', -- Replace with actual user_id
  NOW(),
  NOW()
);

-- MISSION STATEMENTS
INSERT INTO resource_library (
  id, title, content, resource_type, scenario_title, tags, user_id, created_at, updated_at
) VALUES 
(
  gen_random_uuid(),
  'Community Transformation Mission Statement',
  'Our mission is to be a catalyst for holistic community transformation by addressing the spiritual, social, and economic needs of our neighborhood through innovative ministries, strategic partnerships, and sustainable solutions. We are committed to walking alongside our neighbors, particularly those who are marginalized or underserved, to create opportunities for healing, growth, and empowerment. Our approach is rooted in the love of Christ and guided by principles of dignity, justice, and mutual respect. We believe that lasting change happens through authentic relationships, collaborative effort, and the recognition that every person has inherent worth and unique gifts to contribute to the community. Our work extends beyond traditional church boundaries to engage with local organizations, government agencies, and community leaders in addressing systemic issues while providing immediate relief and support to those in crisis.',
  'mission_statement',
  'Community Transformation Initiative',
  ARRAY['Community Transformation', 'Holistic Ministry', 'Social Justice', 'Partnerships', 'Empowerment'],
  'YOUR_USER_ID', -- Replace with actual user_id
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Youth Empowerment Mission Statement',
  'Our mission is to empower young people in our community to discover their God-given potential, develop strong character, and become positive agents of change in their families, schools, and neighborhoods. We are committed to providing safe spaces for spiritual exploration, academic support, leadership development, and creative expression. Through mentoring relationships, educational opportunities, and service projects, we aim to break cycles of poverty, violence, and hopelessness while fostering resilience, purpose, and hope. Our approach recognizes that young people are not just the future of our community but active contributors to its present transformation. We partner with families, schools, and community organizations to create a comprehensive support network that addresses the whole person - spiritual, emotional, academic, and social development.',
  'mission_statement',
  'Next Generation Leadership',
  ARRAY['Youth Empowerment', 'Leadership Development', 'Character Building', 'Academic Support', 'Community Change'],
  'YOUR_USER_ID', -- Replace with actual user_id
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Neighborhood Wellness Mission Statement',
  'Our mission is to promote comprehensive wellness in our neighborhood by addressing the interconnected needs of physical health, mental well-being, spiritual growth, and social connection. We believe that true wellness extends beyond individual health to encompass community resilience, environmental stewardship, and economic stability. Through health education, preventive care initiatives, mental health support, and community building activities, we aim to create a neighborhood where every person has access to the resources and relationships necessary for thriving. Our approach is culturally sensitive, trauma-informed, and asset-based, recognizing the wisdom and strength that already exists within our community while addressing barriers to wellness and advocating for systemic change.',
  'mission_statement',
  'Neighborhood Wellness Initiative',
  ARRAY['Community Wellness', 'Holistic Health', 'Mental Health', 'Social Connection', 'Health Equity'],
  'YOUR_USER_ID', -- Replace with actual user_id
  NOW(),
  NOW()
);

-- DISCERNMENT PLANS (stored as JSON blobs)
INSERT INTO resource_library (
  id, title, content, resource_type, scenario_title, tags, user_id, created_at, updated_at
) VALUES 
(
  gen_random_uuid(),
  'Three-Year Community Transformation Plan',
  '{"title": "Comprehensive Community Transformation Initiative", "description": "A strategic three-year plan for deepening our church''s engagement with the local community through targeted ministries, sustainable partnerships, and measurable impact.", "vision": "To see our neighborhood transformed into a thriving, connected community where every person has access to opportunities for spiritual, social, and economic flourishing.", "phases": [{"phase": 1, "title": "Foundation Building and Assessment", "timeline": "Months 1-12", "description": "Establish infrastructure, build relationships, and conduct comprehensive community assessment", "key_activities": ["Complete neighborhood demographic and needs analysis", "Establish partnerships with 10+ local organizations", "Recruit and train 50+ volunteers", "Launch pilot programs in 3 focus areas", "Develop sustainable funding model"], "success_metrics": ["Community assessment completed with 200+ survey responses", "15+ organizational partnerships formalized", "60+ active volunteers engaged", "3 pilot programs launched with 100+ participants", "Funding secured for Year 2 operations"], "budget": 85000}, {"phase": 2, "title": "Program Expansion and Deepening", "timeline": "Months 13-24", "description": "Scale successful programs, launch new initiatives, and deepen community impact", "key_activities": ["Expand successful pilot programs", "Launch comprehensive youth development initiative", "Establish community learning hub", "Implement senior care program", "Begin advocacy and policy engagement"], "success_metrics": ["500+ community members regularly engaged", "Youth program serving 75+ teenagers", "Adult education classes with 40+ participants", "Senior program supporting 60+ elders", "2+ policy changes advocated successfully"], "budget": 120000}, {"phase": 3, "title": "Sustainability and Replication", "timeline": "Months 25-36", "description": "Ensure long-term sustainability and develop model for replication", "key_activities": ["Establish endowment fund", "Develop local leadership pipeline", "Create replication toolkit", "Launch community-led initiatives", "Measure and document long-term impact"], "success_metrics": ["Self-sustaining funding model established", "20+ community leaders trained and active", "Replication toolkit completed and shared", "3+ community-led initiatives launched", "Comprehensive impact study completed"], "budget": 95000}], "total_budget": 300000, "funding_strategy": {"sources": ["Church budget allocation (40%)", "Grant funding (35%)", "Individual donors (15%)", "Community partnerships (10%)"], "sustainability_plan": "Develop diverse funding streams including fee-for-service programs, social enterprise ventures, and endowment fund to ensure long-term sustainability beyond initial three-year period."}, "risk_mitigation": ["Develop multiple funding streams to reduce financial risk", "Build strong community partnerships for political and social support", "Create flexible program structures that can adapt to changing community needs", "Establish clear communication channels with church leadership and community stakeholders", "Implement regular evaluation and adjustment processes"], "evaluation_framework": {"quarterly_reviews": "Track progress on key metrics and adjust strategies as needed", "annual_assessments": "Comprehensive evaluation of program effectiveness and community impact", "community_feedback": "Regular surveys and focus groups with program participants and community members", "external_evaluation": "Third-party assessment in Year 3 to validate impact and inform replication efforts"}}',
  'discernment_plan',
  'Community Transformation Initiative',
  ARRAY['Strategic Planning', 'Community Engagement', 'Long-term', 'Transformation', 'Sustainability'],
  'YOUR_USER_ID', -- Replace with actual user_id
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Youth Development and Leadership Pipeline Plan',
  '{"title": "Next Generation Leadership Development Plan", "description": "A comprehensive five-year strategy to develop young leaders who will transform our community and beyond.", "vision": "To raise up a generation of young people who are spiritually grounded, academically prepared, and committed to positive community change.", "target_population": {"primary": "Youth ages 12-24 in our immediate neighborhood", "secondary": "Families and community members connected to participating youth", "estimated_reach": "150+ youth directly, 500+ community members indirectly"}, "program_components": [{"component": "Academic Excellence Initiative", "description": "Comprehensive educational support from middle school through college", "activities": ["After-school tutoring and homework help", "SAT/ACT preparation", "College application support", "Scholarship identification and application assistance", "Study skills and time management training"], "staffing": "2 full-time coordinators, 15+ volunteer tutors", "budget_annual": 45000}, {"component": "Leadership Development Track", "description": "Progressive leadership training and real-world experience", "activities": ["Monthly leadership workshops", "Peer mentoring program", "Community service projects", "Youth-led initiative grants", "Leadership retreat and conferences"], "staffing": "1 full-time coordinator, 5+ adult mentors", "budget_annual": 35000}, {"component": "Career Exploration and Development", "description": "Exposure to career opportunities and skill development", "activities": ["Job shadowing programs", "Internship placements", "Skills workshops (financial literacy, communication, etc.)", "Entrepreneurship training", "Professional networking events"], "staffing": "1 part-time coordinator, 20+ professional mentors", "budget_annual": 25000}, {"component": "Spiritual Formation and Character Development", "description": "Holistic development rooted in faith and values", "activities": ["Weekly small group meetings", "Service learning projects", "Spiritual retreats and camps", "Character education curriculum", "Community worship and prayer"], "staffing": "2 part-time youth pastors, 10+ small group leaders", "budget_annual": 30000}], "five_year_timeline": {"year_1": "Launch academic support and basic leadership training for 30 youth", "year_2": "Add career exploration component, expand to 50 youth", "year_3": "Full program implementation serving 75 youth, launch alumni network", "year_4": "Youth-led community initiatives, expand to 100 youth", "year_5": "Program sustainability achieved, model ready for replication"}, "success_metrics": {"academic": ["90% high school graduation rate", "75% college enrollment rate", "Average GPA improvement of 1.0 point"], "leadership": ["50+ youth complete leadership training annually", "10+ youth-led community projects per year", "80% of participants report increased confidence and leadership skills"], "community_impact": ["200+ hours of community service per youth per year", "5+ community problems addressed through youth initiatives", "Measurable improvement in neighborhood youth engagement"]}, "sustainability_plan": {"funding_diversification": "Develop multiple revenue streams including grants, individual donors, corporate sponsorships, and fee-for-service programs", "alumni_engagement": "Create alumni network that provides ongoing support and mentorship", "community_ownership": "Transfer increasing responsibility to community members and partner organizations", "program_institutionalization": "Embed successful components into existing community institutions"}}',
  'discernment_plan',
  'Next Generation Leadership',
  ARRAY['Youth Development', 'Leadership', 'Education', 'Career Development', 'Spiritual Formation'],
  'YOUR_USER_ID', -- Replace with actual user_id
  NOW(),
  NOW()
);

-- Verify the insertions
SELECT 
  title, 
  resource_type, 
  scenario_title,
  array_length(tags, 1) as tag_count,
  length(content) as content_length,
  created_at
FROM resource_library 
WHERE resource_type IN ('vocational_statement', 'scenario_details', 'mission_statement', 'discernment_plan')
ORDER BY resource_type, created_at DESC;

-- Count by resource type
SELECT 
  resource_type, 
  COUNT(*) as count 
FROM resource_library 
WHERE resource_type IN ('vocational_statement', 'scenario_details', 'mission_statement', 'discernment_plan')
GROUP BY resource_type
ORDER BY resource_type;
