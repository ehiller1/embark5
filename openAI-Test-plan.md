# OpenAI Test Plan

## 1. Conversation Interface Parameter Inspection Test

### Objective
To verify that the ConversationInterface component correctly:
- Retrieves and populates the conversation prompt from the database
- Formats companion information correctly
- Constructs the message payload for OpenAI
- Handles the response parsing

### Test Steps

#### 1.1 Prompt Retrieval and Population
1. Navigate to the conversation interface
2. Verify that the system prompt is loaded from the database
3. Check that the following placeholders are correctly populated:
   - `$(companion_name)`
   - `$(companion_type)`
   - `$(companion_traits)`
   - `$(companion_speech)`
   - `$(companion_knowledge)`

#### 1.2 Message Payload Construction
1. Enter a test message in the conversation interface
2. Before sending, inspect the constructed message payload:
   ```json
   {
     "messages": [
       {
         "role": "system",
         "content": "[populated system prompt]"
       },
       {
         "role": "user",
         "content": "[test message]"
       }
     ]
   }
   ```
3. Verify that:
   - The system prompt is correctly formatted
   - The user message is properly included
   - The message structure matches OpenAI's requirements

#### 1.3 Response Handling
1. Send the test message
2. Inspect the raw response from OpenAI
3. Verify that the response is correctly parsed and displayed
4. Check that JSON responses are properly handled:
   ```json
   {
     "messages": [
       {
         "role": "system",
         "content": "[response content]"
       }
     ]
   }
   ```

### Expected Results
- System prompt is correctly retrieved and populated
- Message payload is properly formatted
- JSON responses are correctly parsed and displayed
- No raw JSON is shown to the user

### Test Data
```typescript
// Example companion data
const testCompanion = {
  companion: "Test Companion",
  companion_type: "Community Leader",
  traits: "Empathetic, Knowledgeable",
  speech_pattern: "Professional",
  knowledge_domains: "Community Development, Social Services"
};

// Example test message
const testMessage = "What are the key factors we should consider in our community assessment?";
```

### Notes
- This test should be run in a development environment with access to the database
- The test should be repeated with different companion configurations
- Response parsing should be verified for both JSON and non-JSON responses
- The test should include error handling scenarios

## 2. Existing Tests
[Previous test sections remain unchanged...] 