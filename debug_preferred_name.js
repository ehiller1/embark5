// Debug script to check preferred_name data flow
// Run this in your browser console while logged in

console.log('=== PREFERRED NAME DEBUG ===');

// Check localStorage for any preferred name data
console.log('1. LocalStorage check:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.toLowerCase().includes('preferred')) {
    console.log(`   ${key}: ${localStorage.getItem(key)}`);
  }
}

// Check if user is logged in and has profile data
console.log('2. Current user state:');
const user = window.supabase?.auth?.getUser?.();
if (user) {
  console.log('   User found:', user);
} else {
  console.log('   No user found in auth state');
}

// Check profile data from UserProfileProvider context
console.log('3. Profile context check:');
// This would need to be run in a React component context
console.log('   (Run this in React DevTools or component)');

// SQL query to check database directly
console.log('4. Database query to run in Supabase dashboard:');
console.log(`
SELECT 
  id, 
  email, 
  first_name, 
  last_name, 
  preferred_name,
  created_at,
  updated_at
FROM profiles 
WHERE preferred_name IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;
`);

console.log('5. Check all profiles for preferred_name field:');
console.log(`
SELECT 
  COUNT(*) as total_profiles,
  COUNT(preferred_name) as profiles_with_preferred_name,
  COUNT(CASE WHEN preferred_name IS NOT NULL AND preferred_name != '' THEN 1 END) as profiles_with_non_empty_preferred_name
FROM profiles;
`);

console.log('=== END DEBUG ===');
