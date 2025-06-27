
import { supabase } from '@/integrations/lib/supabase';
import { NetworkConnection, ConnectionData } from '@/types/NetworkTypes';
import { toast } from '@/hooks/use-toast';

// Helper to generate consistent connection strength metrics
const generateConnectionStrength = (base: number, variance: number = 0.1): number => {
  // Generate a score between base-variance and base+variance, capped at 0.95
  return Math.min(0.95, Math.max(0.3, base + (Math.random() * variance * 2) - variance));
};

// Helper to generate random positions for nodes
const generateRandomPosition = () => {
  return {
    x: Math.random() * 800,
    y: Math.random() * 600
  };
};

// Helper to generate a timestamp within the last year
const generateRandomTimestamp = () => {
  const now = new Date();
  // Random date between now and 1 year ago
  const timestamp = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
  return timestamp.toISOString();
};

// Helper to generate connection strength history
const generateConnectionHistory = (currentStrength: number) => {
  const history = [];
  const entries = Math.floor(Math.random() * 5) + 2; // 2-6 entries
  
  for (let i = 0; i < entries; i++) {
    // Each entry is between 0.3 and the current strength
    const strength = Math.max(0.3, Math.min(0.95, currentStrength * (0.7 + Math.random() * 0.3)));
    const date = new Date();
    date.setMonth(date.getMonth() - i * 2); // Entries every ~2 months
    
    history.push({
      date: date.toISOString(),
      strength
    });
  }
  
  return history;
};

// This function cleans up duplicate network connection records for a user
export async function cleanupDuplicateNetworkData(userId: string): Promise<boolean> {
  try {
    // Step 1: Fetch all network connections for the user
    const { data: connections, error: fetchError } = await supabase
      .from('network_connections')
      .select('*')
      .eq('user_id', userId);
    
    if (fetchError) throw fetchError;
    
    // If there's only one or no records, no cleanup needed
    if (!connections || connections.length <= 1) {
      return false;
    }
    
    console.log(`Found ${connections.length} network connection records for user ${userId}, cleaning up...`);
    
    // Sort by updated_at (newest first)
    connections.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    // Keep the newest record, delete the others
    const idsToDelete = connections.slice(1).map(conn => conn.id);
    
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('network_connections')
        .delete()
        .in('id', idsToDelete);
      
      if (deleteError) throw deleteError;
      
      console.log(`Deleted ${idsToDelete.length} duplicate network connection records for user ${userId}`);
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('Error cleaning up duplicate network data:', error);
    toast({
      title: 'Warning',
      description: 'Found duplicate network records, but failed to clean them up.',
      variant: 'default', // Changed from 'warning' to 'default' since warning is not a valid variant
    });
    return false;
  }
}

// This function can be used to generate sample network data for testing
export async function generateSampleNetworkData(userId: string): Promise<boolean> {
  try {
    // First clean up any duplicate records
    await cleanupDuplicateNetworkData(userId);
    
    // Now check if the user already has network data with connections
    const { data: existingData } = await supabase
      .from('network_connections')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);
    
    // Type assertion with proper intermediate step for safety
    const existingTyped = existingData && existingData.length > 0 ? {
      ...existingData[0],
      church_similarity_data: existingData[0].church_similarity_data as unknown as ConnectionData,
      community_similarity_data: existingData[0].community_similarity_data as unknown as ConnectionData,
      plan_similarity_data: existingData[0].plan_similarity_data as unknown as ConnectionData
    } as NetworkConnection : null;
    
    // If data exists and has connections, return
    if (existingTyped && 
        existingTyped.church_similarity_data?.connections?.length > 0 && 
        existingTyped.community_similarity_data?.connections?.length > 0 && 
        existingTyped.plan_similarity_data?.connections?.length > 0) {
      return false;
    }

    // Sample church connections with rich data
    const churchConnections = [
      { 
        id: '1', 
        name: 'First Baptist Church', 
        similarity: generateConnectionStrength(0.85), 
        position: generateRandomPosition(),
        relationship_type: 'Denominational Partnership',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.85),
        attributes: { 
          'denomination': 'Baptist', 
          'size': 'Medium (250-600 members)', 
          'location': 'Urban',
          'theological_alignment': 'Evangelical',
          'ministry_focus': 'Family Ministry, Outreach',
          'cultural_resonance': 'Traditional with Contemporary Elements'
        } 
      },
      { 
        id: '2', 
        name: 'Grace Community Church', 
        similarity: generateConnectionStrength(0.72), 
        position: generateRandomPosition(),
        relationship_type: 'Local Partnership',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.72),
        attributes: { 
          'denomination': 'Non-denominational', 
          'size': 'Large (800+ members)', 
          'location': 'Suburban',
          'theological_alignment': 'Progressive Evangelical',
          'ministry_focus': 'Community Development, Arts',
          'cultural_resonance': 'Contemporary, Culturally Engaged'
        } 
      },
      { 
        id: '3', 
        name: 'St. Mark\'s Episcopal', 
        similarity: generateConnectionStrength(0.67), 
        position: generateRandomPosition(),
        relationship_type: 'Ecumenical Partnership',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.67),
        attributes: { 
          'denomination': 'Episcopal', 
          'size': 'Small (80-200 members)', 
          'location': 'Urban',
          'theological_alignment': 'Mainline Protestant',
          'ministry_focus': 'Social Justice, Liturgical Tradition',
          'cultural_resonance': 'Traditional, Socially Progressive'
        } 
      },
      { 
        id: '4', 
        name: 'Hillside Presbyterian', 
        similarity: generateConnectionStrength(0.59), 
        position: generateRandomPosition(),
        relationship_type: 'Resource Sharing',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.59),
        attributes: { 
          'denomination': 'Presbyterian', 
          'size': 'Medium (250-600 members)', 
          'location': 'Suburban',
          'theological_alignment': 'Reformed',
          'ministry_focus': 'Intergenerational, Education',
          'cultural_resonance': 'Traditional with Contemporary Elements'
        } 
      },
      { 
        id: '5', 
        name: 'Lakeside Lutheran', 
        similarity: generateConnectionStrength(0.52), 
        position: generateRandomPosition(),
        relationship_type: 'Program Collaboration',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.52),
        attributes: { 
          'denomination': 'Lutheran (ELCA)', 
          'size': 'Medium (250-600 members)', 
          'location': 'Suburban',
          'theological_alignment': 'Mainline Protestant',
          'ministry_focus': 'Community Service, Youth Ministry',
          'cultural_resonance': 'Traditional, Family-Oriented'
        } 
      },
      { 
        id: '6', 
        name: 'Resurrection Catholic Church', 
        similarity: generateConnectionStrength(0.48), 
        position: generateRandomPosition(),
        relationship_type: 'Occasional Collaboration',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.48),
        attributes: { 
          'denomination': 'Catholic', 
          'size': 'Large (800+ members)', 
          'location': 'Urban',
          'theological_alignment': 'Catholic',
          'ministry_focus': 'Social Services, Education',
          'cultural_resonance': 'Traditional, Diverse'
        } 
      },
      // New church connections
      { 
        id: '7', 
        name: 'Citylight Church', 
        similarity: generateConnectionStrength(0.78), 
        position: generateRandomPosition(),
        relationship_type: 'Strategic Partner',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.78),
        attributes: { 
          'denomination': 'Evangelical Free', 
          'size': 'Large (1000+ members)', 
          'location': 'Urban Center',
          'theological_alignment': 'Neo-Reformed',
          'ministry_focus': 'Church Planting, Urban Ministry',
          'cultural_resonance': 'Modern, Culturally Relevant'
        } 
      },
      { 
        id: '8', 
        name: 'Harvest Bible Chapel', 
        similarity: generateConnectionStrength(0.65), 
        position: generateRandomPosition(),
        relationship_type: 'Ministry Alliance',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.65),
        attributes: { 
          'denomination': 'Non-denominational', 
          'size': 'Large (750+ members)', 
          'location': 'Suburban',
          'theological_alignment': 'Conservative Evangelical',
          'ministry_focus': 'Biblical Teaching, Discipleship',
          'cultural_resonance': 'Contemporary, Family-Focused'
        } 
      },
      { 
        id: '9', 
        name: 'New Life Pentecostal', 
        similarity: generateConnectionStrength(0.55), 
        position: generateRandomPosition(),
        relationship_type: 'Prayer Network',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.55),
        attributes: { 
          'denomination': 'Pentecostal', 
          'size': 'Medium (400 members)', 
          'location': 'Urban',
          'theological_alignment': 'Charismatic',
          'ministry_focus': 'Worship, Evangelism',
          'cultural_resonance': 'Expressive, Multicultural'
        } 
      },
      { 
        id: '10', 
        name: 'Redeemer Church', 
        similarity: generateConnectionStrength(0.71), 
        position: generateRandomPosition(),
        relationship_type: 'Urban Ministry Network',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.71),
        attributes: { 
          'denomination': 'Presbyterian (PCA)', 
          'size': 'Medium (300 members)', 
          'location': 'Urban',
          'theological_alignment': 'Reformed',
          'ministry_focus': 'Cultural Engagement, Arts',
          'cultural_resonance': 'Intellectual, Urban Professional'
        } 
      },
      { 
        id: '11', 
        name: 'Living Waters Methodist', 
        similarity: generateConnectionStrength(0.61), 
        position: generateRandomPosition(),
        relationship_type: 'Social Justice Coalition',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.61),
        attributes: { 
          'denomination': 'United Methodist', 
          'size': 'Small (150 members)', 
          'location': 'Small Town',
          'theological_alignment': 'Progressive Mainline',
          'ministry_focus': 'Community Service, Social Justice',
          'cultural_resonance': 'Inclusive, Socially Engaged'
        } 
      }
    ];

    // Generate connections between church nodes
    const churchNodeConnections = [
      {
        source_id: '1', // First Baptist
        target_id: '2', // Grace Community
        source_type: 'church',
        target_type: 'church',
        strength: 0.65,
        relationship_type: 'Youth Program Partnership',
        bidirectional: true
      },
      {
        source_id: '2', // Grace Community
        target_id: '3', // St. Mark's Episcopal
        source_type: 'church',
        target_type: 'church',
        strength: 0.40,
        relationship_type: 'Food Bank Initiative',
        bidirectional: true
      },
      {
        source_id: '4', // Hillside Presbyterian
        target_id: '5', // Lakeside Lutheran
        source_type: 'church',
        target_type: 'church',
        strength: 0.55,
        relationship_type: 'Shared Resources',
        bidirectional: true
      },
      // New church-to-church connections
      {
        source_id: '7', // Citylight Church
        target_id: '8', // Harvest Bible Chapel
        source_type: 'church',
        target_type: 'church',
        strength: 0.60,
        relationship_type: 'Leadership Training',
        bidirectional: true
      },
      {
        source_id: '9', // New Life Pentecostal
        target_id: '10', // Redeemer Church
        source_type: 'church',
        target_type: 'church',
        strength: 0.45,
        relationship_type: 'Worship Conference',
        bidirectional: false
      },
      {
        source_id: '11', // Living Waters Methodist
        target_id: '3', // St. Mark's Episcopal
        source_type: 'church',
        target_type: 'church',
        strength: 0.70,
        relationship_type: 'Ecumenical Council',
        bidirectional: true
      },
      {
        source_id: '6', // Resurrection Catholic
        target_id: '11', // Living Waters Methodist
        source_type: 'church',
        target_type: 'church',
        strength: 0.50,
        relationship_type: 'Community Prayer Initiative',
        bidirectional: false
      }
    ];

    // Sample community connections with rich attributes
    const communityConnections = [
      { 
        id: '1', 
        name: 'Downtown Food Bank', 
        similarity: generateConnectionStrength(0.89), 
        position: generateRandomPosition(),
        relationship_type: 'Active Partnership',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.89),
        attributes: { 
          'type': 'Non-profit', 
          'focus': 'Food Security', 
          'area': 'Downtown',
          'demographic_overlap': 'High - Serves many church attendees',
          'proximity': '0.8 miles from church',
          'shared_mission_alignment': 'Very High',
          'engagement_history': 'Long-term partnership (5+ years)'
        } 
      },
      { 
        id: '2', 
        name: 'Eastside Community Center', 
        similarity: generateConnectionStrength(0.76), 
        position: generateRandomPosition(),
        relationship_type: 'Program Partner',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.76),
        attributes: { 
          'type': 'Community Org', 
          'focus': 'Youth Programs', 
          'area': 'East Side',
          'demographic_overlap': 'Medium - Some church families participate',
          'proximity': '2.3 miles from church',
          'shared_mission_alignment': 'High',
          'engagement_history': 'Occasional partnerships (2-3 events/year)'
        } 
      },
      { 
        id: '3', 
        name: 'Highland Neighborhood Association', 
        similarity: generateConnectionStrength(0.65), 
        position: generateRandomPosition(),
        relationship_type: 'Governance Connection',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.65),
        attributes: { 
          'type': 'Neighborhood Group', 
          'focus': 'Community Building', 
          'area': 'Highland',
          'demographic_overlap': 'High - Many church members live in area',
          'proximity': '0.4 miles from church',
          'shared_mission_alignment': 'Medium',
          'engagement_history': 'Regular attendance at meetings'
        } 
      },
      { 
        id: '4', 
        name: 'City Arts Initiative', 
        similarity: generateConnectionStrength(0.61), 
        position: generateRandomPosition(),
        relationship_type: 'Cultural Partnership',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.61),
        attributes: { 
          'type': 'Cultural Organization', 
          'focus': 'Arts Education', 
          'area': 'Citywide',
          'demographic_overlap': 'Low-Medium - Some interest overlap',
          'proximity': '3.1 miles from church',
          'shared_mission_alignment': 'Medium-High (creative expression)',
          'engagement_history': 'New partnership (< 1 year)'
        } 
      },
      { 
        id: '5', 
        name: 'Westside Elementary School', 
        similarity: generateConnectionStrength(0.58), 
        position: generateRandomPosition(),
        relationship_type: 'Education Partner',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.58),
        attributes: { 
          'type': 'Public School', 
          'focus': 'Education', 
          'area': 'West Side',
          'demographic_overlap': 'Medium - Some church families have children attending',
          'proximity': '1.7 miles from church',
          'shared_mission_alignment': 'Medium',
          'engagement_history': 'Tutoring program partnership (3 years)'
        } 
      },
      // New community connections
      { 
        id: '6', 
        name: 'Central City Homeless Shelter', 
        similarity: generateConnectionStrength(0.82), 
        position: generateRandomPosition(),
        relationship_type: 'Core Mission Partner',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.82),
        attributes: { 
          'type': 'Non-profit', 
          'focus': 'Homelessness', 
          'area': 'Downtown',
          'demographic_overlap': 'Medium-High - Regular volunteer base',
          'proximity': '1.2 miles from church',
          'shared_mission_alignment': 'Very High',
          'engagement_history': 'Weekly meal service program (4+ years)'
        } 
      },
      { 
        id: '7', 
        name: 'Riverfront Healthcare Clinic', 
        similarity: generateConnectionStrength(0.70), 
        position: generateRandomPosition(),
        relationship_type: 'Resource Partner',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.70),
        attributes: { 
          'type': 'Healthcare', 
          'focus': 'Low-income medical services', 
          'area': 'Riverfront District',
          'demographic_overlap': 'Low - Professional referral relationship',
          'proximity': '3.8 miles from church',
          'shared_mission_alignment': 'High',
          'engagement_history': 'Quarterly health fairs, referral system'
        } 
      },
      { 
        id: '8', 
        name: 'New Horizons Refugee Center', 
        similarity: generateConnectionStrength(0.75), 
        position: generateRandomPosition(),
        relationship_type: 'Ministry Focus',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.75),
        attributes: { 
          'type': 'Social Services', 
          'focus': 'Refugee Integration', 
          'area': 'North District',
          'demographic_overlap': 'Medium - Some refugee families attend church',
          'proximity': '2.5 miles from church',
          'shared_mission_alignment': 'Very High',
          'engagement_history': 'ESL classes, furniture donation program'
        } 
      },
      { 
        id: '9', 
        name: 'Metro University', 
        similarity: generateConnectionStrength(0.55), 
        position: generateRandomPosition(),
        relationship_type: 'Campus Ministry',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.55),
        attributes: { 
          'type': 'Educational Institution', 
          'focus': 'Higher Education', 
          'area': 'University District',
          'demographic_overlap': 'Medium - Several professors and students attend',
          'proximity': '4.2 miles from church',
          'shared_mission_alignment': 'Medium',
          'engagement_history': 'Student ministry, occasional lecture series'
        } 
      },
      { 
        id: '10', 
        name: 'Downtown Business Alliance', 
        similarity: generateConnectionStrength(0.48), 
        position: generateRandomPosition(),
        relationship_type: 'Community Network',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.48),
        attributes: { 
          'type': 'Business Network', 
          'focus': 'Economic Development', 
          'area': 'Downtown',
          'demographic_overlap': 'Medium - Several business owners attend church',
          'proximity': '0.6 miles from church',
          'shared_mission_alignment': 'Low-Medium',
          'engagement_history': 'Quarterly meetings, holiday initiatives'
        } 
      }
    ];

    // Generate connections between community nodes
    const communityNodeConnections = [
      {
        source_id: '1', // Downtown Food Bank
        target_id: '2', // Eastside Community Center
        source_type: 'community',
        target_type: 'community',
        strength: 0.70,
        relationship_type: 'Resource Sharing',
        bidirectional: true
      },
      {
        source_id: '3', // Highland Neighborhood Association
        target_id: '5', // Westside Elementary School
        source_type: 'community',
        target_type: 'community',
        strength: 0.45,
        relationship_type: 'Community Events',
        bidirectional: true
      },
      // New community-to-community connections
      {
        source_id: '6', // Homeless Shelter
        target_id: '7', // Healthcare Clinic
        source_type: 'community',
        target_type: 'community',
        strength: 0.75,
        relationship_type: 'Medical Services Partnership',
        bidirectional: true
      },
      {
        source_id: '8', // Refugee Center
        target_id: '10', // Business Alliance
        source_type: 'community',
        target_type: 'community',
        strength: 0.50,
        relationship_type: 'Job Placement Program',
        bidirectional: true
      },
      {
        source_id: '9', // Metro University
        target_id: '4', // City Arts Initiative
        source_type: 'community',
        target_type: 'community',
        strength: 0.60,
        relationship_type: 'Cultural Events',
        bidirectional: false
      },
      {
        source_id: '1', // Downtown Food Bank
        target_id: '6', // Homeless Shelter
        source_type: 'community',
        target_type: 'community',
        strength: 0.85,
        relationship_type: 'Nutrition Program',
        bidirectional: true
      }
    ];

    // Cross-domain connections (church to community)
    const crossDomainConnections = [
      {
        source_id: '1', // First Baptist Church
        target_id: '1', // Downtown Food Bank
        source_type: 'church',
        target_type: 'community',
        strength: 0.75,
        relationship_type: 'Volunteer Partnership',
        bidirectional: true
      },
      {
        source_id: '2', // Grace Community Church
        target_id: '4', // City Arts Initiative
        source_type: 'church',
        target_type: 'community',
        strength: 0.60,
        relationship_type: 'Facility Sharing',
        bidirectional: true
      },
      // New cross-domain connections
      {
        source_id: '7', // Citylight Church
        target_id: '6', // Homeless Shelter
        source_type: 'church',
        target_type: 'community',
        strength: 0.80,
        relationship_type: 'Meal Program',
        bidirectional: true
      },
      {
        source_id: '9', // New Life Pentecostal
        target_id: '8', // Refugee Center
        source_type: 'church',
        target_type: 'community',
        strength: 0.70,
        relationship_type: 'ESL Ministry',
        bidirectional: false
      },
      {
        source_id: '11', // Living Waters Methodist
        target_id: '10', // Business Alliance
        source_type: 'church',
        target_type: 'community',
        strength: 0.55,
        relationship_type: 'Economic Justice Initiative',
        bidirectional: true
      },
      {
        source_id: '3', // St. Mark's Episcopal
        target_id: '7', // Healthcare Clinic
        source_type: 'church',
        target_type: 'community',
        strength: 0.65,
        relationship_type: 'Health Ministry',
        bidirectional: true
      }
    ];

    // Sample plan connections with detailed attributes
    const planConnections = [
      { 
        id: '1', 
        name: 'Youth Ministry Expansion', 
        similarity: generateConnectionStrength(0.92), 
        position: generateRandomPosition(),
        relationship_type: 'Strategic Priority',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.92),
        attributes: { 
          'type': 'Growth', 
          'timeline': '1-2 years', 
          'resources': 'Medium',
          'strategic_priority': 'High',
          'implementation_progress': '65%',
          'community_impact_potential': 'High',
          'key_stakeholders': 'Youth Pastor, Parent Committee, Church Board'
        } 
      },
      { 
        id: '2', 
        name: 'Community Outreach Program', 
        similarity: generateConnectionStrength(0.84), 
        position: generateRandomPosition(),
        relationship_type: 'Mission-Critical',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.84),
        attributes: { 
          'type': 'Outreach', 
          'timeline': '6-12 months', 
          'resources': 'Low',
          'strategic_priority': 'High',
          'implementation_progress': '40%',
          'community_impact_potential': 'Very High',
          'key_stakeholders': 'Outreach Committee, Local Partners'
        } 
      },
      { 
        id: '3', 
        name: 'Worship Service Revitalization', 
        similarity: generateConnectionStrength(0.77), 
        position: generateRandomPosition(),
        relationship_type: 'Core Function',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.77),
        attributes: { 
          'type': 'Internal', 
          'timeline': '3-6 months', 
          'resources': 'Low',
          'strategic_priority': 'Medium',
          'implementation_progress': '85%',
          'community_impact_potential': 'Medium',
          'key_stakeholders': 'Worship Team, Pastoral Staff'
        } 
      },
      { 
        id: '4', 
        name: 'New Building Initiative', 
        similarity: generateConnectionStrength(0.62), 
        position: generateRandomPosition(),
        relationship_type: 'Growth-Oriented',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.62),
        attributes: { 
          'type': 'Facilities', 
          'timeline': '3-5 years', 
          'resources': 'High',
          'strategic_priority': 'Medium-High',
          'implementation_progress': '15%',
          'community_impact_potential': 'High',
          'key_stakeholders': 'Building Committee, Finance Team, Congregation'
        } 
      },
      { 
        id: '5', 
        name: 'Digital Ministry Launch', 
        similarity: generateConnectionStrength(0.58), 
        position: generateRandomPosition(),
        relationship_type: 'Innovation',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.58),
        attributes: { 
          'type': 'Tech', 
          'timeline': '1 year', 
          'resources': 'Medium',
          'strategic_priority': 'Medium',
          'implementation_progress': '30%',
          'community_impact_potential': 'Medium-High',
          'key_stakeholders': 'Communications Team, IT Volunteers'
        } 
      },
      { 
        id: '6', 
        name: 'Small Groups Restructure', 
        similarity: generateConnectionStrength(0.53), 
        position: generateRandomPosition(),
        relationship_type: 'Member Engagement',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.53),
        attributes: { 
          'type': 'Discipleship', 
          'timeline': '6-9 months', 
          'resources': 'Low',
          'strategic_priority': 'High',
          'implementation_progress': '70%',
          'community_impact_potential': 'Medium',
          'key_stakeholders': 'Small Group Leaders, Pastoral Staff'
        } 
      },
      { 
        id: '7', 
        name: 'Interfaith Dialogue Initiative', 
        similarity: generateConnectionStrength(0.45), 
        position: generateRandomPosition(),
        relationship_type: 'Community Relations',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.45),
        attributes: { 
          'type': 'Community Relations', 
          'timeline': '1-2 years', 
          'resources': 'Low',
          'strategic_priority': 'Medium-Low',
          'implementation_progress': '10%',
          'community_impact_potential': 'High',
          'key_stakeholders': 'Senior Pastor, Community Relations Team'
        } 
      },
      // New plan connections
      { 
        id: '8', 
        name: 'Leadership Development Pipeline', 
        similarity: generateConnectionStrength(0.79), 
        position: generateRandomPosition(),
        relationship_type: 'Capacity Building',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.79),
        attributes: { 
          'type': 'Organizational Growth', 
          'timeline': '2-3 years', 
          'resources': 'Medium',
          'strategic_priority': 'High',
          'implementation_progress': '25%',
          'community_impact_potential': 'Medium-High',
          'key_stakeholders': 'Leadership Board, Ministry Team Leaders'
        } 
      },
      { 
        id: '9', 
        name: 'Multicultural Worship Initiative', 
        similarity: generateConnectionStrength(0.68), 
        position: generateRandomPosition(),
        relationship_type: 'Diversity Focus',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.68),
        attributes: { 
          'type': 'Worship', 
          'timeline': '1 year', 
          'resources': 'Low-Medium',
          'strategic_priority': 'Medium',
          'implementation_progress': '45%',
          'community_impact_potential': 'Medium',
          'key_stakeholders': 'Worship Team, Cultural Representatives'
        } 
      },
      { 
        id: '10', 
        name: 'Family Ministry Redesign', 
        similarity: generateConnectionStrength(0.81), 
        position: generateRandomPosition(),
        relationship_type: 'Core Ministry',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.81),
        attributes: { 
          'type': 'Family Discipleship', 
          'timeline': '1-2 years', 
          'resources': 'Medium',
          'strategic_priority': 'Very High',
          'implementation_progress': '35%',
          'community_impact_potential': 'High',
          'key_stakeholders': 'Family Ministry Dir., Parents Council'
        } 
      },
      { 
        id: '11', 
        name: 'Community Garden Project', 
        similarity: generateConnectionStrength(0.69), 
        position: generateRandomPosition(),
        relationship_type: 'Neighborhood Outreach',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.69),
        attributes: { 
          'type': 'Sustainability', 
          'timeline': '1 year', 
          'resources': 'Low-Medium',
          'strategic_priority': 'Medium',
          'implementation_progress': '60%',
          'community_impact_potential': 'High',
          'key_stakeholders': 'Green Team, Neighborhood Association'
        } 
      },
      { 
        id: '12', 
        name: 'Mental Health Ministry', 
        similarity: generateConnectionStrength(0.74), 
        position: generateRandomPosition(),
        relationship_type: 'Specialized Care',
        last_interaction: generateRandomTimestamp(),
        connection_strength_history: generateConnectionHistory(0.74),
        attributes: { 
          'type': 'Counseling/Support', 
          'timeline': '6-12 months', 
          'resources': 'Medium',
          'strategic_priority': 'Medium-High',
          'implementation_progress': '20%',
          'community_impact_potential': 'Very High',
          'key_stakeholders': 'Care Team, Professional Counselors'
        } 
      }
    ];

    // Generate connections between plan elements
    const planNodeConnections = [
      {
        source_id: '1', // Youth Ministry Expansion
        target_id: '2', // Community Outreach Program
        source_type: 'plan',
        target_type: 'plan',
        strength: 0.65,
        relationship_type: 'Shared Resources',
        bidirectional: true
      },
      {
        source_id: '2', // Community Outreach Program
        target_id: '7', // Interfaith Dialogue Initiative
        source_type: 'plan',
        target_type: 'plan',
        strength: 0.40,
        relationship_type: 'Strategic Alignment',
        bidirectional: true
      },
      {
        source_id: '3', // Worship Service Revitalization
        target_id: '5', // Digital Ministry Launch
        source_type: 'plan',
        target_type: 'plan',
        strength: 0.55,
        relationship_type: 'Integration Dependency',
        bidirectional: true
      },
      // New plan-to-plan connections
      {
        source_id: '8', // Leadership Development Pipeline
        target_id: '6', // Small Groups Restructure
        source_type: 'plan',
        target_type: 'plan',
        strength: 0.70,
        relationship_type: 'Personnel Overlap',
        bidirectional: true
      },
      {
        source_id: '10', // Family Ministry Redesign
        target_id: '1', // Youth Ministry Expansion
        source_type: 'plan',
        target_type: 'plan',
        strength: 0.80,
        relationship_type: 'Strategic Integration',
        bidirectional: true
      },
      {
        source_id: '11', // Community Garden Project
        target_id: '2', // Community Outreach Program
        source_type: 'plan',
        target_type: 'plan',
        strength: 0.60,
        relationship_type: 'Shared Audience',
        bidirectional: false
      },
      {
        source_id: '12', // Mental Health Ministry
        target_id: '7', // Interfaith Dialogue
        source_type: 'plan',
        target_type: 'plan',
        strength: 0.45,
        relationship_type: 'Complementary Goals',
        bidirectional: false
      },
      {
        source_id: '9', // Multicultural Worship
        target_id: '3', // Worship Revitalization
        source_type: 'plan',
        target_type: 'plan',
        strength: 0.75,
        relationship_type: 'Direct Enhancement',
        bidirectional: true
      }
    ];

    // Create connections between church/community and plans
    const churchToPlanConnections = [
      {
        source_id: '1', // First Baptist Church
        target_id: '1', // Youth Ministry Expansion
        source_type: 'church',
        target_type: 'plan',
        strength: 0.80,
        relationship_type: 'Primary Stakeholder',
        bidirectional: false
      },
      // New church-to-plan connections
      {
        source_id: '7', // Citylight Church
        target_id: '8', // Leadership Development Pipeline
        source_type: 'church',
        target_type: 'plan',
        strength: 0.75,
        relationship_type: 'Initiative Owner',
        bidirectional: false
      },
      {
        source_id: '2', // Grace Community
        target_id: '9', // Multicultural Worship
        source_type: 'church',
        target_type: 'plan',
        strength: 0.65,
        relationship_type: 'Program Sponsor',
        bidirectional: false
      },
      {
        source_id: '3', // St. Mark's
        target_id: '12', // Mental Health Ministry
        source_type: 'church',
        target_type: 'plan',
        strength: 0.70,
        relationship_type: 'Facility Host',
        bidirectional: true
      }
    ];

    const communityToPlanConnections = [
      {
        source_id: '2', // Eastside Community Center
        target_id: '2', // Community Outreach Program
        source_type: 'community',
        target_type: 'plan',
        strength: 0.75,
        relationship_type: 'Implementation Partner',
        bidirectional: false
      },
      // New community-to-plan connections
      {
        source_id: '6', // Homeless Shelter
        target_id: '11', // Community Garden
        source_type: 'community',
        target_type: 'plan',
        strength: 0.65,
        relationship_type: 'Food Security Partner',
        bidirectional: true
      },
      {
        source_id: '7', // Healthcare Clinic
        target_id: '12', // Mental Health Ministry
        source_type: 'community',
        target_type: 'plan',
        strength: 0.85,
        relationship_type: 'Service Provider',
        bidirectional: true
      },
      {
        source_id: '9', // Metro University
        target_id: '8', // Leadership Development
        source_type: 'community',
        target_type: 'plan',
        strength: 0.60,
        relationship_type: 'Educational Resource',
        bidirectional: false
      }
    ];

    // Update or create the network data structure
    let networkData;
    if (existingTyped) {
      // Update existing record
      const { error } = await supabase
        .from('network_connections')
        .update({
          church_similarity_data: { 
            connections: churchConnections,
            connections_between_nodes: [
              ...churchNodeConnections,
              ...crossDomainConnections,
              ...churchToPlanConnections
            ]
          },
          community_similarity_data: { 
            connections: communityConnections,
            connections_between_nodes: [
              ...communityNodeConnections,
              ...crossDomainConnections,
              ...communityToPlanConnections
            ]
          },
          plan_similarity_data: { 
            connections: planConnections,
            connections_between_nodes: [
              ...planNodeConnections,
              ...churchToPlanConnections,
              ...communityToPlanConnections
            ]
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTyped.id);

      if (error) throw error;
      
      networkData = {
        ...existingTyped,
        church_similarity_data: { 
          connections: churchConnections,
          connections_between_nodes: [
            ...churchNodeConnections,
            ...crossDomainConnections,
            ...churchToPlanConnections
          ]
        },
        community_similarity_data: { 
          connections: communityConnections,
          connections_between_nodes: [
            ...communityNodeConnections,
            ...crossDomainConnections,
            ...communityToPlanConnections
          ]
        },
        plan_similarity_data: { 
          connections: planConnections,
          connections_between_nodes: [
            ...planNodeConnections,
            ...churchToPlanConnections,
            ...communityToPlanConnections
          ]
        }
      };
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('network_connections')
        .insert({
          user_id: userId,
          church_similarity_data: { 
            connections: churchConnections,
            connections_between_nodes: [
              ...churchNodeConnections,
              ...crossDomainConnections,
              ...churchToPlanConnections
            ]
          },
          community_similarity_data: { 
            connections: communityConnections,
            connections_between_nodes: [
              ...communityNodeConnections,
              ...crossDomainConnections,
              ...communityToPlanConnections
            ]
          },
          plan_similarity_data: { 
            connections: planConnections,
            connections_between_nodes: [
              ...planNodeConnections,
              ...churchToPlanConnections,
              ...communityToPlanConnections
            ]
          }
        })
        .select()
        .single();

      if (error) throw error;
      
      // Type assertion with proper intermediate step
      networkData = data ? {
        ...data,
        church_similarity_data: data.church_similarity_data as unknown as ConnectionData,
        community_similarity_data: data.community_similarity_data as unknown as ConnectionData,
        plan_similarity_data: data.plan_similarity_data as unknown as ConnectionData
      } as NetworkConnection : null;
    }
    
    console.log('Enhanced network data generated successfully:', networkData);
    return true;
  } catch (error: any) {
    console.error('Error generating enhanced network data:', error);
    toast({
      title: 'Error',
      description: 'Failed to generate enhanced network data.',
      variant: 'destructive',
    });
    return false;
  }
}
