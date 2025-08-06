// Clear CommunityAssessment localStorage cache to fix duplicate messages
// Run this in the browser console on the CommunityAssessment page

console.log('Clearing CommunityAssessment localStorage cache...');

// Clear the specific keys that might be causing issues
const keysToRemove = [
  'community_assessment_messages',
  'community_research_notes'
];

keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log(`Removing ${key} from localStorage`);
    localStorage.removeItem(key);
  } else {
    console.log(`${key} not found in localStorage`);
  }
});

console.log('Cache cleared! Please refresh the page to see the clean interface.');

// Optional: Show what's left in localStorage
console.log('Remaining localStorage keys:', Object.keys(localStorage));
