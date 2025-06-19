
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type Message = {
  content: string;
  sender: 'user' | 'assistant';
};

export const useTestContext = () => {
  const location = useLocation();
  const isTestPage = location.pathname === '/test' || location.pathname === '/openai_test_plan';
  
  const [testContext, setTestContext] = useState({
    location: isTestPage ? 'Atlanta, GA' : '', // Only use default for test pages
    churchDescription: isTestPage 
      ? 'A 120-year-old Methodist church with declining membership but strong community roots and a desire to engage with young families.'
      : '',
    communityResearchSummary: isTestPage 
      ? 'The community is experiencing demographic shifts with increasing young professional population, rising housing costs, and a growing need for children\'s programs and community support services.'
      : ''
  });

  // Add the missing properties
  const locationKey = location.pathname + location.search;
  const sessionKey = 'session-' + Date.now();
  const isAuthenticated = true; // Default to true for now as we don't have access to the auth context directly

  useEffect(() => {
    // Skip fetching real data if we're on a test page
    if (isTestPage) return;
    
    // Get location from localStorage
    const location = localStorage.getItem('user_location') || '';
    
    // Get church assessment messages
    let churchDescription = '';
    try {
      const churchMessages = localStorage.getItem('church_assessment_messages');
      if (churchMessages) {
        const parsedMessages = JSON.parse(churchMessages);
        // Extract assistant messages as they will contain information about the church
        const assistantMessages = parsedMessages
          .filter((msg: any) => msg.sender === 'assistant')
          .map((msg: any) => msg.content);
        
        // Get the latest few messages to create a summary
        const recentMessages = assistantMessages.slice(-2);
        if (recentMessages.length > 0) {
          churchDescription = recentMessages.join(' ').substring(0, 300); // Limit to 300 chars
        }
      }
    } catch (error) {
      console.error('Error parsing church assessment messages:', error);
    }
    
    // Get community assessment messages
    let communityResearchSummary = '';
    try {
      const communityMessages = localStorage.getItem('community_assessment_messages');
      if (communityMessages) {
        const parsedMessages = JSON.parse(communityMessages);
        // Extract assistant messages as they will contain information about the community
        const assistantMessages = parsedMessages
          .filter((msg: any) => msg.sender === 'assistant')
          .map((msg: any) => msg.content);
        
        // Get the latest few messages to create a summary
        const recentMessages = assistantMessages.slice(-2);
        if (recentMessages.length > 0) {
          communityResearchSummary = recentMessages.join(' ').substring(0, 300); // Limit to 300 chars
        }
      }
    } catch (error) {
      console.error('Error parsing community assessment messages:', error);
    }

    // Set context based on actual data for non-test pages
    setTestContext({
      location,
      churchDescription,
      communityResearchSummary
    });
  }, [isTestPage]);

  return { 
    testContext,
    isAuthenticated,
    locationKey,
    sessionKey
  };
};
