
import React, { useState } from "react";
import { ChatMessage } from "@/lib/requestService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage }) => {
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const handleSendMessage = () => {
    if (message.trim() && user) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-80 border rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b">
        <h3 className="font-medium">Chat</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Nenhuma mensagem ainda. Inicie uma conversa.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isCurrentUser = msg.userId === user?.uid;
              const timestampDate = msg.timestamp instanceof Date ? 
                msg.timestamp : 
                new Date(msg.timestamp);

              return (
                <div
                  key={index}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      isCurrentUser
                        ? "bg-eccos-blue text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    <div className="text-xs mb-1 font-medium">
                      {isCurrentUser ? "Você" : msg.userName}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.message}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {formatDistanceToNow(timestampDate, {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t flex">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="min-h-[60px] resize-none flex-1"
        />
        <Button
          type="button"
          onClick={handleSendMessage}
          disabled={!message.trim()}
          className="ml-2 self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Chat;
