import { RoundtableConversation } from "./RoundtableConversation";
import { RoundtableInput } from "./RoundtableInput";
import { useRoundtableMessaging } from "./useRoundtableMessaging";

export function RoundtableContainer() {
  const {
    roundtableMessages,
    sendRoundtableMessage,
    isProcessing,
    currentMessage,
    setCurrentMessage
  } = useRoundtableMessaging();

  // Create a wrapper function that returns a Promise and matches the expected signature
  const handleSendMessage = async (): Promise<void> => {
    if (currentMessage.trim()) {
      sendRoundtableMessage(currentMessage);
      setCurrentMessage('');
    }
    return Promise.resolve();
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh] border rounded-lg overflow-hidden">
      <RoundtableConversation messages={roundtableMessages} />
      <RoundtableInput 
        onSend={handleSendMessage} 
        isSending={isProcessing}
        value={currentMessage}
        onChange={setCurrentMessage}
      />
    </div>
  );
}
