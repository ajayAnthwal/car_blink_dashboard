import React, { useState } from "react";
import { Loader2, MessageSquareWarning, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInterfaceProps {
  query: Record<string, unknown>;
  isLoadingDetails: boolean;
  onReply: (message: string) => void;
  isReplying: boolean;
}

export default function ChatInterface({
  query,
  isLoadingDetails,
  onReply,
  isReplying,
}: ChatInterfaceProps) {
  const [replyMessage, setReplyMessage] = useState("");

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    onReply(replyMessage);
    setReplyMessage("");
  };

  if (isLoadingDetails) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary-orange animate-spin" />
      </div>
    );
  }

  if (!query) return null;

  return (
    <div className="flex flex-col h-[400px] max-w-4xl mx-auto bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
        {query.messages && (query.messages as any[]).length > 0 ? (
          (query.messages as any[]).map((reply: any) => {
            const isCustomer = reply.senderRole === "CUSTOMER";
            return (
              <div
                key={reply._id}
                className={`flex w-full ${isCustomer ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] font-medium text-gray-400 mb-1 px-1">
                    {isCustomer ? "You" : "Support Team"}
                  </span>
                  <div
                    className={`px-5 py-3 rounded-2xl text-sm shadow-sm ${
                      isCustomer 
                        ? 'bg-primary-navy text-white rounded-tr-sm' 
                        : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{reply.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
              <MessageSquareWarning className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No messages yet.<br/>Start the conversation below.</p>
          </div>
        )}
      </div>

      {/* Reply Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <form onSubmit={handleReplySubmit} className="flex space-x-3 items-end">
          <div className="flex-1 relative">
            <Input
              placeholder="Type your reply here..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl"
            />
          </div>
          <Button 
            type="submit" 
            className="rounded-xl px-6 h-10 shadow-sm"
            isLoading={isReplying} 
            disabled={!replyMessage.trim()}
          >
            <Send className="w-4 h-4 mr-2" /> Send
          </Button>
        </form>
      </div>
    </div>
  );
}
