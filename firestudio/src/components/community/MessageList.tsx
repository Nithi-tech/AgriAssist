import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { MessageSquare, User } from 'lucide-react';
import { MessageWithState, DbReply } from '@/types/community';
import LikeButton from './LikeButton';
import ReplyInput from './ReplyInput';

interface MessageListProps {
  messages: MessageWithState[];
  currentUser: any;
  onToggleLike: (messageId: string) => void;
  onSendReply: (messageId: string, replyContent: string) => void;
  onToggleReplyInput: (messageId: string) => void;
  getDisplayName: (user: any) => string;
}

export default function MessageList({
  messages,
  currentUser,
  onToggleLike,
  onSendReply,
  onToggleReplyInput,
  getDisplayName
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only auto-scroll if user is near the bottom (within 100px)
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (isNearBottom) {
        scrollToBottom();
      }
    }
  }, [messages]);

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return '';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return format(date, 'MMM d, yyyy');
      }
    } catch {
      return '';
    }
  };

  const shouldShowDateSeparator = (currentMessage: MessageWithState, previousMessage?: MessageWithState) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.created_at).toDateString();
    const previousDate = new Date(previousMessage.created_at).toDateString();
    
    return currentDate !== previousDate;
  };

  const ReplyBubble = ({ reply }: { reply: DbReply }) => (
    <div className="flex items-start gap-2 mt-2 ml-4">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
        <User size={12} className="text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-md">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs font-medium text-gray-700">
              {getDisplayName(reply.user)}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(reply.created_at)}
            </span>
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            {reply.reply_content}
          </p>
        </div>
      </div>
    </div>
  );

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No messages yet
          </h3>
          <p className="text-gray-500">
            Be the first to start the conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
    >
      {messages.map((message, index) => (
        <React.Fragment key={message.id}>
          {shouldShowDateSeparator(message, messages[index - 1]) && (
            <div className="flex items-center justify-center my-6">
              <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                {formatDate(message.created_at)}
              </div>
            </div>
          )}
          
          <div className="group">
            {/* Main message */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 max-w-2xl">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {getDisplayName(message.user)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap break-words mb-3">
                    {message.content}
                  </p>
                  
                  {/* Message actions */}
                  <div className="flex items-center gap-3">
                    <LikeButton
                      messageId={message.id}
                      isLiked={message.isLiked}
                      likeCount={message.like_count || 0}
                      onToggleLike={onToggleLike}
                      disabled={!currentUser}
                    />
                    <button
                      onClick={() => onToggleReplyInput(message.id)}
                      disabled={!currentUser}
                      className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        transition-colors duration-200 hover:bg-gray-100
                        ${!currentUser 
                          ? 'opacity-50 cursor-not-allowed text-gray-400' 
                          : 'text-gray-500 hover:text-blue-600 cursor-pointer'
                        }
                      `}
                    >
                      <MessageSquare size={14} />
                      Reply
                    </button>
                  </div>
                </div>

                {/* Replies */}
                {message.replies && message.replies.length > 0 && (
                  <div className="mt-2">
                    {message.replies.map((reply) => (
                      <ReplyBubble key={reply.id} reply={reply} />
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {message.showReplyInput && (
                  <ReplyInput
                    messageId={message.id}
                    onSendReply={onSendReply}
                    onCancel={() => onToggleReplyInput(message.id)}
                    disabled={!currentUser}
                  />
                )}
              </div>
            </div>
          </div>
        </React.Fragment>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
