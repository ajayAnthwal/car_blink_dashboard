import React, { useState } from "react";
import { Loader2, MessageSquareWarning, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInterfaceProps {
  query: any;
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
        {/* Initial Customer Query */}
        <div className="flex w-full justify-end">
          <div className="max-w-[85%] flex flex-col items-end">
            <span className="text-[11px] font-bold text-primary-orange mb-1 px-1">
              You (Original Query)
            </span>
            <div className="px-5 py-3 rounded-2xl text-sm shadow-sm bg-primary-navy text-white rounded-tr-sm space-y-1">
              <p className="font-bold text-amber-300 text-xs border-b border-white/20 pb-1">
                {String(query.subject || "")}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-100">
                {String(query.description || "")}
              </p>
              {Boolean(query.createdAt) && (
                <span className="text-[10px] text-slate-400 block text-right pt-1">
                  {new Date(String(query.createdAt)).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {query.messages && (query.messages as any[]).length > 0 && (
          (query.messages as any[]).map((reply: any, idx: number) => {
            const isCustomer = reply.senderRole === "CUSTOMER";
            return (
              <div
                key={reply._id || idx}
                className={`flex w-full ${isCustomer ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}>
                  <span className={`text-[11px] font-medium mb-1 px-1 ${isCustomer ? 'text-gray-400' : 'text-blue-600 font-bold'}`}>
                    {isCustomer ? "You" : "CarBlink Support Executive"}
                  </span>
                  <div
                    className={`px-5 py-3 rounded-2xl text-sm shadow-sm ${
                      isCustomer 
                        ? 'bg-primary-navy text-white rounded-tr-sm' 
                        : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{reply.message}</p>
                    {reply.createdAt && (
                      <span className={`text-[10px] block text-right pt-1 ${isCustomer ? 'text-slate-400' : 'text-gray-400'}`}>
                        {new Date(reply.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
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
