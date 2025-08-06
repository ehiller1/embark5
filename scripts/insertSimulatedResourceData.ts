import { supabase } from '../src/integrations/lib/supabase';

/**
 * Script to insert simulated vocational_statement, scenario_details, and discernment_plan 
 * data into the resource_library table for testing/demo purposes
 */

const simulatedData = [
  {
    title: "Community Outreach Vocational Statement",
    content: "I feel called to serve my community through compassionate outreach programs that address the needs of the most vulnerable. My vocation is to bridge the gap between our church and the broader community, creating meaningful connections that reflect Christ's love. I am particularly drawn to working with families in crisis, providing both spiritual support and practical assistance. This calling has been confirmed through prayer, community feedback, and my personal experiences of transformation through service.",
    resource_type: "vocational_statement",
    category: "Ministry Plan",
    tags: ["Community Service", "Outreach", "Families", "Crisis Support"],
    scenario_title: "Urban Community Ministry"
  },
  {
    title: "Youth Ministry Vocational Statement", 
    content: "God has placed a deep burden on my heart for the spiritual development of young people in our community. I believe I am called to create safe spaces where teenagers can explore their faith, ask difficult questions, and develop authentic relationships with Christ and each other. My vocation involves mentoring, teaching, and advocating for youth both within our church walls and in the broader community. I see this calling as essential for the future of our church and the transformation of our neighborhood.",
    resource_type: "vocational_statement",
    category: "Youth Ministry",
    tags: ["Youth", "Mentoring", "Discipleship", "Community"],
    scenario_title: "Next Generation Leadership"
  },
  {
    title: "Comprehensive Community Discernment Plan",
    content: JSON.stringify({
      title: "Three-Year Community Transformation Initiative",
      description: "A strategic plan for deepening our church's engagement with the local community through targeted ministries and partnerships.",
      steps: [
        {
          title: "Community Assessment and Relationship Building",
          description: "Conduct comprehensive neighborhood analysis, establish partnerships with local organizations, and build trust through consistent presence and service.",
          timeline: "Months 1-6",
          resources_needed: ["Community liaison coordinator", "Survey materials", "Partnership agreements"],
          success_metrics: ["10+ community partnerships established", "Neighborhood demographic analysis completed", "Monthly community events launched"]
        },
        {
          title: "Program Development and Launch",
          description: "Design and implement targeted ministry programs based on community assessment findings, focusing on identified needs and opportunities.",
          timeline: "Months 7-18", 
          resources_needed: ["Program coordinators", "Facility space", "Ministry supplies", "Volunteer recruitment"],
          success_metrics: ["3+ new ministry programs launched", "50+ community members regularly engaged", "Volunteer base of 25+ active members"]
        },
        {
          title: "Sustainability and Expansion",
          description: "Establish long-term funding, develop leadership pipeline, and explore opportunities for program expansion and replication.",
          timeline: "Months 19-36",
          resources_needed: ["Fundraising strategy", "Leadership development program", "Impact measurement tools"],
          success_metrics: ["Self-sustaining funding model", "Local leadership pipeline established", "Measurable community impact documented"]
        }
      ],
      budget_considerations: {
        year_1: 75000,
        year_2: 95000, 
        year_3: 85000,
        funding_sources: ["Church budget allocation", "Grant opportunities", "Community partnerships", "Individual donors"]
      },
      risk_mitigation: [
        "Develop multiple funding streams to reduce financial risk",
        "Build strong community partnerships for sustainability",
        "Create flexible program structures that can adapt to changing needs",
        "Establish clear communication channels with church leadership"
      ]
    }),
    resource_type: "discernment_plan",
    category: "Ministry Plan",
    tags: ["Strategic Planning", "Community Engagement", "Long-term", "Transformation"],
    scenario_title: "Community Transformation Initiative"
  },
  {
    title: "Food Security Ministry Scenario",
    content: "Our neighborhood faces significant food insecurity, with 35% of families struggling to access nutritious meals regularly. Local schools report increasing numbers of students relying on free breakfast and lunch programs, and several elderly residents have limited mobility for grocery shopping. The nearest full-service grocery store is 2.5 miles away, creating a food desert situation. However, we have identified opportunities including: a vacant lot suitable for community gardening, partnerships with local farms, and a network of volunteers willing to help with food distribution. This scenario presents both urgent needs and sustainable solutions that could transform our community's relationship with food security while building stronger neighborhood connections.",
    resource_type: "scenario_details", 
    category: "Community Outreach",
    tags: ["Food Security", "Community Garden", "Partnerships", "Sustainability"],
    scenario_title: "Neighborhood Food Security Initiative"
  },
  {
    title: "Senior Care Ministry Scenario",
    content: "Our community has a growing population of seniors (65+) who make up 28% of our neighborhood demographics. Many live alone and face challenges with transportation, social isolation, and accessing healthcare services. We've identified 45+ seniors within a 6-block radius who could benefit from regular check-ins, assistance with errands, and social connection opportunities. The local senior center closed last year due to budget cuts, leaving a significant gap in services. Our church has the space, volunteer capacity, and heart to address this need through a comprehensive senior care ministry that includes weekly social gatherings, transportation assistance, home visits, and advocacy for senior-friendly community improvements.",
    resource_type: "scenario_details",
    category: "Senior Ministry", 
    tags: ["Seniors", "Social Isolation", "Transportation", "Healthcare", "Advocacy"],
    scenario_title: "Caring for Our Elders Initiative"
  },
  {
    title: "Educational Support Discernment Plan",
    content: JSON.stringify({
      title: "Community Learning Hub Development",
      description: "Establishing our church as a center for educational support and lifelong learning opportunities for all ages.",
      steps: [
        {
          title: "Needs Assessment and Space Preparation",
          description: "Survey community educational needs, prepare church facilities for learning activities, and recruit qualified volunteers and tutors.",
          timeline: "Months 1-4",
          resources_needed: ["Educational needs survey", "Facility modifications", "Learning materials", "Volunteer screening"],
          success_metrics: ["Community needs assessment completed", "Learning spaces prepared", "15+ qualified tutors recruited"]
        },
        {
          title: "Program Launch and Community Engagement", 
          description: "Launch after-school tutoring, adult literacy classes, and computer skills workshops while building partnerships with local schools.",
          timeline: "Months 5-12",
          resources_needed: ["Curriculum development", "Technology equipment", "School partnerships", "Marketing materials"],
          success_metrics: ["30+ students in after-school program", "20+ adults in literacy classes", "2+ school partnerships established"]
        },
        {
          title: "Expansion and Specialization",
          description: "Add specialized programs like ESL classes, job skills training, and college prep while developing sustainable funding model.",
          timeline: "Months 13-24", 
          resources_needed: ["Specialized instructors", "Advanced curriculum", "Career counseling resources", "Grant funding"],
          success_metrics: ["5+ specialized programs running", "Job placement rate of 70%+", "College enrollment increase of 25%"]
        }
      ],
      community_impact: {
        immediate: "Improved academic performance for local students, increased adult literacy rates",
        long_term: "Higher graduation rates, increased employment opportunities, stronger community economic development"
      },
      partnerships: ["Local school district", "Community college", "Public library", "Workforce development agency"]
    }),
    resource_type: "discernment_plan",
    category: "Education",
    tags: ["Education", "Tutoring", "Adult Learning", "Community Development"],
    scenario_title: "Community Learning Hub"
  }
];

async function insertSimulatedData() {
  try {
    console.log('Starting insertion of simulated resource data...');
    
    // Get the current user's profile to use their church_id
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return;
    }

    // Get user profile to get church_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.church_id) {
      console.error('Error getting user profile or church_id:', profileError);
      return;
    }

    console.log(`Using church_id: ${profile.church_id}`);

    // Insert each simulated resource
    for (const resource of simulatedData) {
      const resourceData = {
        ...resource,
        id: crypto.randomUUID(),
        user_id: user.id,
        church_id: profile.church_id,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('resource_library')
        .insert([resourceData])
        .select()
        .single();

      if (error) {
        console.error(`Error inserting resource "${resource.title}":`, error);
      } else {
        console.log(`✓ Successfully inserted: ${resource.title}`);
      }
    }

    console.log('Finished inserting simulated resource data!');
    
  } catch (error) {
    console.error('Error in insertSimulatedData:', error);
  }
}

// Run the script
insertSimulatedData();
