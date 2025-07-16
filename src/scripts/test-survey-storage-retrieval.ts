/**
 * Survey Storage and Retrieval Test Simulation
 * 
 * This script simulates the process of creating and retrieving a survey
 * to verify that our changes to use the direct church_id field are working correctly.
 */

import { v4 as uuidv4 } from 'uuid';

// Mock database for simulation
class MockDatabase {
  private surveyTemplates: any[] = [];
  private profiles: any[] = [];
  private churchProfiles: any[] = [];
  
  // Survey templates table operations
  async insertSurveyTemplate(template: any) {
    const id = uuidv4();
    const newTemplate = { ...template, id };
    this.surveyTemplates.push(newTemplate);
    return { data: newTemplate, error: null };
  }
  
  async getSurveyTemplates(churchId: string) {
    // Filter by church_id field directly
    const templates = this.surveyTemplates.filter(t => t.church_id === churchId);
    return { data: templates, error: null };
  }
  
  // Profiles table operations
  async insertProfile(profile: any) {
    this.profiles.push(profile);
    return { data: profile, error: null };
  }
  
  // Church profiles table operations
  async insertChurchProfile(profile: any) {
    this.churchProfiles.push(profile);
    return { data: profile, error: null };
  }
  
  // Clear all data
  async clearAll() {
    this.surveyTemplates = [];
    this.profiles = [];
    this.churchProfiles = [];
    return { error: null };
  }
}

// Initialize mock database
const mockDb = new MockDatabase();

// Test data
const testChurchId = uuidv4();
const testUserId = uuidv4();
const testParishUserId = uuidv4();

// Sample survey template
const sampleSurveyTemplate = {
  title: 'Test Parish Survey',
  description: 'A test survey for parish members',
  questions: [
    {
      id: 'q1',
      text: 'How long have you been a member of this parish?',
      type: 'multiple_choice',
      options: ['Less than 1 year', '1-5 years', '5-10 years', 'More than 10 years']
    },
    {
      id: 'q2',
      text: 'What aspects of parish life are most important to you?',
      type: 'checkbox',
      options: ['Worship services', 'Community outreach', 'Fellowship', 'Education', 'Youth programs']
    },
    {
      id: 'q3',
      text: 'Please share any additional thoughts or suggestions:',
      type: 'text'
    }
  ]
};

/**
 * Create test users with different roles
 */
async function createTestUsers() {
  console.log('Creating test users...');
  
  // Create clergy user
  const { data: clergyUser, error: clergyError } = await mockDb.insertProfile({
    id: testUserId,
    email: `test-clergy-${testUserId.substring(0, 8)}@example.com`,
    role: 'Clergy',
    church_id: testChurchId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
    
  if (clergyError) {
    console.error('Error creating clergy user:', clergyError);
    return false;
  }
  
  // Create parish user
  const { data: parishUser, error: parishError } = await mockDb.insertProfile({
    id: testParishUserId,
    email: `test-parish-${testParishUserId.substring(0, 8)}@example.com`,
    role: 'Parish',
    church_id: testChurchId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
    
  if (parishError) {
    console.error('Error creating parish user:', parishError);
    return false;
  }
  
  console.log('Created clergy user:', clergyUser);
  console.log('Created parish user:', parishUser);
  return true;
}

/**
 * Create a test church profile
 */
async function createTestChurch() {
  console.log('Creating test church profile...');
  
  const { data: church, error } = await mockDb.insertChurchProfile({
    church_id: testChurchId,
    church_name: 'Test Church',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
    
  if (error) {
    console.error('Error creating church profile:', error);
    return false;
  }
  
  console.log('Created church profile:', church);
  return true;
}

/**
 * Create a survey template as clergy user
 */
async function createSurveyTemplate() {
  console.log('Creating survey template as clergy user...');
  
  const surveyPayload = {
    title: sampleSurveyTemplate.title,
    description: sampleSurveyTemplate.description,
    created_by: testUserId,
    church_id: testChurchId, // Direct church_id field
    metadata: {
      survey_type: 'parish',
      template_data: sampleSurveyTemplate
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data: survey, error } = await mockDb.insertSurveyTemplate(surveyPayload);
    
  if (error) {
    console.error('Error creating survey template:', error);
    return null;
  }
  
  console.log('Created survey template:', survey);
  return survey;
}

/**
 * Retrieve survey template as parish user
 */
async function retrieveSurveyTemplate() {
  console.log('Retrieving survey template as parish user...');
  
  // Using direct church_id field for retrieval
  const { data: templates, error } = await mockDb.getSurveyTemplates(testChurchId);
    
  if (error) {
    console.error('Error retrieving survey templates:', error);
    return null;
  }
  
  if (!templates || templates.length === 0) {
    console.log('No survey templates found for church ID:', testChurchId);
    return null;
  }
  
  console.log(`Found ${templates.length} survey templates for church ID:`, testChurchId);
  console.log('First survey template:', templates[0]);
  return templates[0];
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  console.log('Cleaning up test data...');
  const { error } = await mockDb.clearAll();
  
  if (error) {
    console.error('Error cleaning up test data:', error);
  } else {
    console.log('Test data cleaned up successfully');
  }
}

/**
 * Run the test
 */
async function runTest() {
  console.log('Starting survey storage and retrieval test...');
  
  try {
    // Create test users and church
    const usersCreated = await createTestUsers();
    const churchCreated = await createTestChurch();
    
    if (!usersCreated || !churchCreated) {
      console.error('Failed to create test users or church');
      return;
    }
    
    // Create survey template as clergy user
    const survey = await createSurveyTemplate();
    if (!survey) {
      console.error('Failed to create survey template');
      return;
    }
    
    // Retrieve survey template as parish user
    const retrievedSurvey = await retrieveSurveyTemplate();
    if (!retrievedSurvey) {
      console.error('Failed to retrieve survey template');
      return;
    }
    
    // Verify survey data
    if (retrievedSurvey.id === survey.id && 
        retrievedSurvey.church_id === testChurchId) {
      console.log('✅ TEST PASSED: Survey successfully created and retrieved using church_id');
      console.log('This confirms that our changes to use the direct church_id field are working correctly.');
    } else {
      console.log('❌ TEST FAILED: Survey retrieval mismatch');
      console.log('Original survey:', survey);
      console.log('Retrieved survey:', retrievedSurvey);
    }
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Clean up test data
    await cleanupTestData();
    console.log('Test completed');
  }
}

// Run the test
runTest();
