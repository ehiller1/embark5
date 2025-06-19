import { useState } from 'react';
import { useOpenAI } from './useOpenAI';
import { usePrompts } from './usePrompts';
import { supabase } from '../lib/supabase';

interface ChurchAvatar {
  id: string;
  avatar_name: string;
  role: string;
  avatar_point_of_view: string;
}

interface CommunityAvatar {
  id: string;
  avatar_name: string;
  role: string;
  avatar_point_of_view: string;
}

interface Companion {
  id: string;
  name: string;
  role: string;
  description: string;
}

// MissionalAvatar interface removed as it's not being used

interface DiscernmentPlan {
  id: string;
  title: string;
  description: string;
  steps: Array<{ title: string; description: string }>;
  [key: string]: any; // Allow for additional properties
  church_avatar_id: string | null;
  community_avatar_id: string | null;
}

export const useDiscernmentPlan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DiscernmentPlan | null>(null);
  const { generateResponse } = useOpenAI();
  const { getPromptByType } = usePrompts();

  const generateDiscernmentPlan = async (
    researchSummary: string,
    narrative: string,
    churchAvatar: ChurchAvatar,
    communityAvatar: CommunityAvatar,
    companionAvatar: Companion
    // Removed unused missionalAvatar parameter
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Retrieve the 'discernment_plan' prompt template
      const { data: promptData, error: promptError } = await getPromptByType('discernment_plan');
      if (promptError || !promptData?.prompt) {
        console.error('[DiscernmentPlan] Failed to fetch discernment_plan prompt:', promptError);
        throw new Error('Prompt fetch error');
      }

      // 2. Format avatar information consistently
      const churchAvatarInfo = churchAvatar
        ? `${churchAvatar.avatar_name} (${churchAvatar.role} with ${churchAvatar.avatar_point_of_view})`
        : 'No church avatar selected';

      const communityAvatarInfo = communityAvatar
        ? `${communityAvatar.avatar_name} (${communityAvatar.role} with ${communityAvatar.avatar_point_of_view})`
        : 'No community avatar selected';

      // 3. Populate placeholders
      const template = promptData.prompt;
      const fullPrompt = template
        .replace(/\$\(\s*ResearchSummary\s*\)/g, researchSummary)
        .replace(/\$\(\s*vocational_statement\s*\)/g, narrative)
        .replace(/\$\(\s*companion_avatar\s*\)/g, JSON.stringify(companionAvatar))
        .replace(/\$\(\s*church_avatar\s*\)/g, churchAvatarInfo)
        .replace(/\$\(\s*community_avatar\s*\)/g, communityAvatarInfo);

      // 4. Call OpenAI
      const response = await generateResponse({
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        maxTokens: 2500 // Increased from 1000 to handle larger JSON structures
      });
      if (!response?.text) {
        throw new Error('No AI response');
      }

      // 5. Parse JSON with better error handling
      console.log('[DiscernmentPlan] Raw response text:', response.text.substring(0, 200) + '...');
      
      let parsed: any;
      let parsedPlan: DiscernmentPlan;
      
      try {
        let jsonString = response.text;
        // 1. Remove markdown fences if present
        const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
          jsonString = markdownMatch[1];
        }

        // 2. Trim whitespace
        jsonString = jsonString.trim();

        try {
          // 3. Attempt to parse directly
          parsed = JSON.parse(jsonString);
          console.log('[DiscernmentPlan] Successfully parsed JSON directly.');
        } catch (e1: unknown) {
          const error = e1 as Error;
          console.warn('[DiscernmentPlan] Initial JSON.parse failed. Attempting to repair string...', error.message);
          
          // 4. If direct parse fails, try to repair common issues
          let repairedJsonString = jsonString
            .replace(/\r?\n|\r/g, '\\n') // Escape raw newlines
            .replace(/(?<!\\)'/g, '"'); // Replace unescaped single quotes with double quotes for strings/keys
          
          // Remove trailing commas before closing curly or square brackets
          repairedJsonString = repairedJsonString.replace(/,\s*([}\]])/g, '$1');
          
          // Fix unterminated strings by looking for unclosed quotes at the end of the string
          // Check if there are an odd number of unescaped quotes, which indicates an unterminated string
          const quoteMatches = repairedJsonString.match(/(?<!\\)"/g);
          if (quoteMatches && quoteMatches.length % 2 !== 0) {
            console.log('[DiscernmentPlan] Detected unterminated string, attempting to fix');
            // Add a closing quote to fix the unterminated string
            repairedJsonString += '"';
          }
          
          // Check for incomplete JSON structure by ensuring brackets are balanced
          const openBraces = (repairedJsonString.match(/{/g) || []).length;
          const closeBraces = (repairedJsonString.match(/}/g) || []).length;
          const openBrackets = (repairedJsonString.match(/\[/g) || []).length;
          const closeBrackets = (repairedJsonString.match(/\]/g) || []).length;
          
          // Add missing closing braces/brackets if needed
          if (openBraces > closeBraces) {
            console.log(`[DiscernmentPlan] Adding ${openBraces - closeBraces} missing closing braces`);
            repairedJsonString += '}'.repeat(openBraces - closeBraces);
          }
          if (openBrackets > closeBrackets) {
            console.log(`[DiscernmentPlan] Adding ${openBrackets - closeBrackets} missing closing brackets`);
            repairedJsonString += ']'.repeat(openBrackets - closeBrackets);
          }

          try {
            parsed = JSON.parse(repairedJsonString);
            console.log('[DiscernmentPlan] Successfully parsed JSON after repairing string.');
          } catch (e2: unknown) {
            const error = e2 as Error;
            console.error('[DiscernmentPlan] JSON parse error after attempting repair:', error.message);
            console.error('[DiscernmentPlan] Original string snippet (first 500 chars):', jsonString.substring(0,500));
            console.error('[DiscernmentPlan] Repaired string snippet (first 500 chars):', repairedJsonString.substring(0,500));
            
            // Last resort: use regex to extract the most important parts of the JSON
            console.log('[DiscernmentPlan] Attempting to extract key sections using regex...');
            try {
              // Extract the mission statement if possible
              const missionStatementMatch = jsonString.match(/"Mission Statement"\s*:\s*"([^"]+)"/i);
              const missionStatement = missionStatementMatch ? missionStatementMatch[1] : 'Mission statement unavailable';
              
              // Extract some action steps if possible
              const actionSteps: string[] = [];
              const actionStepRegex = /"Step \d+"\s*:\s*"([^"]+)"/g;
              let match;
              while ((match = actionStepRegex.exec(jsonString)) !== null && actionSteps.length < 5) {
                actionSteps.push(match[1]);
              }
              
              // Create a minimal valid structure with what we could extract
              parsed = {
                discernment_plan: {
                  section_1_mission_statement_and_biblical_foundation: {
                    "Mission Statement": missionStatement
                  },
                  section_2_action_plan: {
                    action_steps: actionSteps.length > 0 ? actionSteps : ['Review church property usage', 'Identify community needs', 'Develop implementation plan']
                  }
                }
              };
              console.log('[DiscernmentPlan] Successfully created a partial plan from extracted data');
            } catch (e3: unknown) {
              console.error('[DiscernmentPlan] Regex extraction also failed:', e3);
              throw e2; // Re-throw the original parsing error if regex approach also fails
            }
          }
        }
        console.log('[DiscernmentPlan] Successfully parsed JSON');
        
        // Handle the expected format from the API with discernment_plan top level key
        if (parsed.discernment_plan) {
          const dp = parsed.discernment_plan;
            
          // Format a unified plan from the three sections
          parsedPlan = {
            id: '', // Will be generated by Supabase
            title: 'Discernment Plan',
            description: dp.section_1_mission_statement_and_biblical_foundation?.mission_statement || 'Discernment plan for property repurposing',
            steps: [] as Array<{ title: string; description: string }>,
            church_avatar_id: churchAvatar?.id || null,
            community_avatar_id: communityAvatar?.id || null
          };
            
          // Extract steps from section 1
          if (dp.section_1_mission_statement_and_biblical_foundation) {
            const section1 = dp.section_1_mission_statement_and_biblical_foundation;
            
            // Handle section 1 mission statement - could be a string or an object with a 'Mission Statement' key
            let missionStatement = '';
            if (typeof section1.mission_statement === 'string') {
              missionStatement = section1.mission_statement;
            } else if (section1['Mission Statement']) {
              missionStatement = section1['Mission Statement'];
            }
            
            parsedPlan.steps.push({
              title: 'Mission Statement and Foundation',
              description: missionStatement || ''
            });
            
            // Handle biblical justifications - formats vary
            let biblicalJustification = '';
            if (typeof section1.biblical_justification === 'string') {
              biblicalJustification = section1.biblical_justification;
            } else if (typeof section1['Biblical Justification'] === 'string') {
              biblicalJustification = section1['Biblical Justification'];
            } else if (Array.isArray(section1.biblical_justification)) {
              biblicalJustification = section1.biblical_justification.map((item: any) => {
                if (typeof item === 'string') return item;
                if (item.verse && item.text) return `${item.verse}: ${item.text}`;
                return JSON.stringify(item);
              }).join('\n');
            }
            
            if (biblicalJustification) {
              parsedPlan.steps.push({
                title: 'Biblical Justification',
                description: biblicalJustification
              });
            }
            
            // Add church history connection if present
            if (section1.connection_to_church_history || section1['Connection to Church History']) {
              const churchHistory = section1.connection_to_church_history || section1['Connection to Church History'];
              parsedPlan.steps.push({
                title: 'Connection to Church History',
                description: typeof churchHistory === 'string' ? churchHistory : JSON.stringify(churchHistory, null, 2)
              });
            }
            
            // Add church values reflection if present
            if (section1.church_values_reflection || section1['Church Values Reflection']) {
              const churchValues = section1.church_values_reflection || section1['Church Values Reflection'];
              let valuesText = '';
              
              if (Array.isArray(churchValues)) {
                valuesText = churchValues.join('\n');
              } else if (typeof churchValues === 'string') {
                valuesText = churchValues;
              } else {
                valuesText = JSON.stringify(churchValues, null, 2);
              }
              
              parsedPlan.steps.push({
                title: 'Church Values Reflection',
                description: valuesText
              });
            }
            
            // Add community needs addressed if present
            if (section1.community_needs_address || section1['Community Needs Address']) {
              const communityNeeds = section1.community_needs_address || section1['Community Needs Address'];
              let needsText = '';
              
              if (Array.isArray(communityNeeds)) {
                needsText = communityNeeds.join('\n');
              } else if (typeof communityNeeds === 'string') {
                needsText = communityNeeds;
              } else {
                needsText = JSON.stringify(communityNeeds, null, 2);
              }
              
              parsedPlan.steps.push({
                title: 'Community Needs Address',
                description: needsText
              });
            }
          }
            
          // Extract steps from section 2
          if (dp.section_2_action_plan) {
            const section2 = dp.section_2_action_plan;
            
            // Handle objectives and goals - could be array or object
            if (section2.objectives_and_goals) {
              let objectives = '';
              
              if (Array.isArray(section2.objectives_and_goals)) {
                objectives = section2.objectives_and_goals.join('\n');
              } else if (typeof section2.objectives_and_goals === 'string') {
                objectives = section2.objectives_and_goals;
              } else {
                objectives = JSON.stringify(section2.objectives_and_goals, null, 2);
              }
              
              parsedPlan.steps.push({
                title: 'Objectives and Goals',
                description: objectives
              });
            }
            
            // Handle action steps - complex object structure with Step, Responsible, Timeline, Outcome
            if (section2.action_steps) {
              let actionSteps = '';
              
              if (Array.isArray(section2.action_steps)) {
                actionSteps = section2.action_steps.map((step: any) => {
                  // Handle string format
                  if (typeof step === 'string') return step;
                  
                  // Handle object with description property
                  if (typeof step.description === 'string') {
                    let formattedStep = step.description;
                    if (step.date) formattedStep = `${step.date}: ${formattedStep}`;
                    if (step.responsible) formattedStep += ` (${step.responsible})`;
                    return formattedStep;
                  }
                  
                  // Handle format {"Step 1":"...","Responsible":"...","Timeline":"...","Outcome":"..."}
                  const stepKey = Object.keys(step).find(key => key.toLowerCase().includes('step'));
                  if (stepKey && step[stepKey]) {
                    let formattedStep = `${stepKey}: ${step[stepKey]}`;
                    
                    // Add responsible party if available
                    if (step.Responsible || step.responsible) {
                      formattedStep += `\nResponsible: ${step.Responsible || step.responsible}`;
                    }
                    
                    // Add timeline if available
                    if (step.Timeline || step.timeline) {
                      formattedStep += `\nTimeline: ${step.Timeline || step.timeline}`;
                    }
                    
                    // Add outcome if available
                    if (step.Outcome || step.outcome || step.Desired_Outcome || step['Desired Outcome']) {
                      const outcome = step.Outcome || step.outcome || step.Desired_Outcome || step['Desired Outcome'];
                      formattedStep += `\nExpected outcome: ${outcome}`;
                    }
                    
                    return formattedStep;
                  }
                  
                  // Fallback to JSON stringify
                  return JSON.stringify(step);
                }).join('\n\n'); // Double line break for better readability
              } else if (typeof section2.action_steps === 'string') {
                actionSteps = section2.action_steps;
              } else {
                actionSteps = JSON.stringify(section2.action_steps, null, 2);
              }
              
              parsedPlan.steps.push({
                title: 'Action Steps',
                description: actionSteps
              });
            }
            
            // Handle stakeholders if present
            if (section2.stakeholders) {
              let stakeholdersText = '';
              
              if (Array.isArray(section2.stakeholders)) {
                stakeholdersText = section2.stakeholders.map((item: any) => {
                  if (typeof item === 'string') return item;
                  if (item.stakeholder) return `${item.stakeholder}: ${item.description || ''}`;
                  return JSON.stringify(item);
                }).join('\n');
              } else if (typeof section2.stakeholders === 'string') {
                stakeholdersText = section2.stakeholders;
              }
              
              if (stakeholdersText) {
                parsedPlan.steps.push({
                  title: 'Stakeholders',
                  description: stakeholdersText
                });
              }
            }
            
            // Handle resource requirements if present
            if (section2.resource_requirements) {
              let resourceText = '';
              const resources = section2.resource_requirements;
              
              // Handle budget
              if (resources.budget) {
                resourceText += '## Budget\n';
                if (typeof resources.budget === 'string') {
                  resourceText += resources.budget + '\n\n';
                } else {
                  // Format budget as list of items with costs
                  resourceText += Object.entries(resources.budget)
                    .map(([item, cost]) => `- ${item}: $${cost}`)
                    .join('\n') + '\n\n';
                }
              }
              
              // Handle personnel
              if (resources.personnel) {
                resourceText += '## Personnel\n';
                if (Array.isArray(resources.personnel)) {
                  resourceText += resources.personnel.map((p: any) => `- ${p}`).join('\n') + '\n\n';
                } else if (typeof resources.personnel === 'string') {
                  resourceText += resources.personnel + '\n\n';
                }
              }
              
              // Handle materials
              if (resources.materials) {
                resourceText += '## Materials\n';
                if (Array.isArray(resources.materials)) {
                  resourceText += resources.materials.map((m: any) => `- ${m}`).join('\n') + '\n\n';
                } else if (typeof resources.materials === 'string') {
                  resourceText += resources.materials + '\n\n';
                }
              }
              
              if (resourceText) {
                parsedPlan.steps.push({
                  title: 'Resource Requirements',
                  description: resourceText
                });
              }
            }
            
            // Handle challenge mitigation if present
            if (section2.challenge_mitigation) {
              let challengesText = '';
              
              if (Array.isArray(section2.challenge_mitigation)) {
                challengesText = section2.challenge_mitigation.map((item: any) => {
                  if (typeof item === 'string') return item;
                  if (item.challenge && item.mitigation) {
                    return `**${item.challenge}**\n${item.mitigation}`;
                  }
                  return JSON.stringify(item);
                }).join('\n\n');
              } else if (typeof section2.challenge_mitigation === 'string') {
                challengesText = section2.challenge_mitigation;
              }
              
              if (challengesText) {
                parsedPlan.steps.push({
                  title: 'Challenge Mitigation',
                  description: challengesText
                });
              }
            }
            
            // Handle clergy next steps if present
            if (section2.clergy_next_steps) {
              let clergySteps = '';
              
              if (Array.isArray(section2.clergy_next_steps)) {
                clergySteps = section2.clergy_next_steps.map((step: any, index: number) => {
                  return `${index + 1}. ${typeof step === 'string' ? step : JSON.stringify(step)}`;
                }).join('\n');
              } else if (typeof section2.clergy_next_steps === 'string') {
                clergySteps = section2.clergy_next_steps;
              }
              
              if (clergySteps) {
                parsedPlan.steps.push({
                  title: 'Clergy Next Steps',
                  description: clergySteps
                });
              }
            }
          }
            
          // Extract steps from section 3 if present
          if (dp.section_3_implementation_timeline || dp.section_3_implementation_details) {
            const section3 = dp.section_3_implementation_timeline || dp.section_3_implementation_details;
            
            // Handle implementation timeline if it exists
            if (dp.section_3_implementation_timeline) {
              let timelineText = '';
              
              if (typeof section3 === 'string') {
                timelineText = section3;
              } else if (typeof section3.timeline === 'string') {
                timelineText = section3.timeline;
              } else if (typeof section3 === 'object') {
                timelineText = JSON.stringify(section3, null, 2);
              }
              
              if (timelineText) {
                parsedPlan.steps.push({
                  title: 'Implementation Timeline',
                  description: timelineText
                });
              }
            }
            
            // Handle implementation details if they exist
            if (dp.section_3_implementation_details) {
              // Lay leader responsibilities
              if (section3.lay_leader_responsibilities || section3['Lay Leader Responsibilities']) {
                const layLeaders = section3.lay_leader_responsibilities || section3['Lay Leader Responsibilities'];
                parsedPlan.steps.push({
                  title: 'Lay Leader Responsibilities',
                  description: typeof layLeaders === 'string' ? layLeaders : JSON.stringify(layLeaders, null, 2)
                });
              }
              
              // Vestry actions
              if (section3.vestry_actions || section3['Vestry Actions']) {
                const vestryActions = section3.vestry_actions || section3['Vestry Actions'];
                parsedPlan.steps.push({
                  title: 'Vestry Actions',
                  description: typeof vestryActions === 'string' ? vestryActions : JSON.stringify(vestryActions, null, 2)
                });
              }
              
              // Clergy duties
              if (section3.clergy_duties || section3['Clergy Duties']) {
                const clergyDuties = section3.clergy_duties || section3['Clergy Duties'];
                parsedPlan.steps.push({
                  title: 'Clergy Duties',
                  description: typeof clergyDuties === 'string' ? clergyDuties : JSON.stringify(clergyDuties, null, 2)
                });
              }
              
              // Parish engagement methods
              if (section3.parish_engagement_methods || section3['Parish Engagement Methods']) {
                const engagementMethods = section3.parish_engagement_methods || section3['Parish Engagement Methods'];
                parsedPlan.steps.push({
                  title: 'Parish Engagement Methods',
                  description: typeof engagementMethods === 'string' ? engagementMethods : JSON.stringify(engagementMethods, null, 2)
                });
              }
              
              // Religious elements
              if (section3.religious_elements || section3['Religious Elements']) {
                const religiousElements = section3.religious_elements || section3['Religious Elements'];
                parsedPlan.steps.push({
                  title: 'Religious Elements',
                  description: typeof religiousElements === 'string' ? religiousElements : JSON.stringify(religiousElements, null, 2)
                });
              }
            }
          }
        } else if (parsed.title && Array.isArray(parsed.steps)) {
          // Simpler format with just title, description, and steps
          parsedPlan = parsed;
        } else {
          // Fallback: use the entire parsed object
          parsedPlan = {
            id: '', // Will be generated by Supabase
            title: parsed.title || 'Discernment Plan',
            description: parsed.description || 'Generated plan',
            steps: [],
            church_avatar_id: churchAvatar?.id || null,
            community_avatar_id: communityAvatar?.id || null
          };
            
          // Try to extract meaningful content from any structure
          Object.entries(parsed).forEach(([key, value]) => {
            if (key !== 'title' && key !== 'description' && key !== 'steps') {
              const stepTitle = key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
              parsedPlan.steps.push({
                title: stepTitle,
                description: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
              });
            }
          });
        }
      }
      catch (parseError: unknown) {
        console.error('[DiscernmentPlan] Error during response parsing:', parseError);
        // Create a minimal valid plan that won't crash the app
        parsedPlan = {
          id: '',
          title: 'Discernment Plan',
          description: 'There was an error generating the plan. Please try again.',
          steps: [{
            title: 'Error',
            description: 'Failed to parse AI response. Please try regenerating the plan.'
          }],
          church_avatar_id: churchAvatar?.id || null,
          community_avatar_id: communityAvatar?.id || null
        };
      }

      // 6. Save plan to Supabase (using resource_library table with resource_type)
      const planContentForDb = {
        ...parsedPlan, // This contains title, description, steps from AI
        // Add avatar IDs directly into the content JSON
        church_avatar_id: churchAvatar?.id,
        community_avatar_id: communityAvatar?.id,
      };

      // Extract only the data and error we need from the Supabase response
      const { data, error: insertError } = await supabase
        .from('resource_library')
        .insert({ 
          title: planContentForDb.title, // Use title from the plan itself
          content: planContentForDb,    // Store the enriched plan object
          resource_type: 'discernment_plan',
          // No 'metadata' column here, as it does not exist in the table schema
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Enhanced logging of the data returned from Supabase
      console.log('[DiscernmentPlan] Raw Supabase returned data:', JSON.stringify(data, null, 2));
      
      // Parse the content field - it's returned as a string from Supabase
      let contentObj;
      try {
        contentObj = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
        console.log('[DiscernmentPlan] Parsed content object:', contentObj);
        console.log('[DiscernmentPlan] Steps in parsed content:', contentObj.steps);
      } catch (parseError) {
        console.error('[DiscernmentPlan] Error parsing content JSON:', parseError);
        contentObj = { 
          title: 'Discernment Plan', 
          description: 'A plan for discerning next steps.',
          steps: [] 
        };
      }
      
      // Map the returned data (Supabase row) to the DiscernmentPlan state type
      const newPlanForState: DiscernmentPlan = {
        id: data.id,
        title: contentObj.title || 'Discernment Plan',
        description: contentObj.description || 'A plan for discerning next steps.',
        steps: Array.isArray(contentObj.steps) ? contentObj.steps : [], // Ensure steps is always an array
        church_avatar_id: contentObj.church_avatar_id, // Extracted from content
        community_avatar_id: contentObj.community_avatar_id, // Extracted from content
        // Spread any other properties from content that might be part of DiscernmentPlan's [key: string]: any;
        ...contentObj
      };
      
      // Validate the plan structure before returning
      console.log('[DiscernmentPlan] Final plan object:', JSON.stringify(newPlanForState, null, 2));
      if (!Array.isArray(newPlanForState.steps)) {
        console.error('[DiscernmentPlan] Steps array is missing or invalid in the final plan object');
        // Force it to be an array to prevent errors downstream
        newPlanForState.steps = [];
      }

      setPlan(newPlanForState);
      return newPlanForState;
    } catch (err) {
      console.error('[DiscernmentPlan] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, plan, generateDiscernmentPlan };
}; 