import React, { useState, useRef } from 'react';
import { Send, X } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { translateResponse } from '@/utils/translateResponse';
import { type Language } from '@/providers/language-provider';

interface ReplyInputProps {
  messageId: string;
  onSendReply: (messageId: string, replyContent: string) => void;
  onCancel: () => void;
  disabled?: boolean;
  needsTranslation?: boolean; // Flag to determine if AI translation is needed
}

export default function ReplyInput({ 
  messageId, 
  onSendReply, 
  onCancel, 
  disabled = false,
  needsTranslation = false
}: ReplyInputProps) {
  const [reply, setReply] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { language, t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReply = reply.trim();
    if (!trimmedReply || disabled || isTranslating) return;

    setIsTranslating(true);

    try {
      let finalReply = trimmedReply;

      // If AI translation is needed and language is not English
      if (needsTranslation && language !== 'en') {
        try {
          finalReply = await translateResponse(trimmedReply, language as Language);
        } catch (error) {
          console.warn('Translation failed, using original text:', error);
          // Continue with original text if translation fails
        }
      }

      onSendReply(messageId, finalReply);
      setReply('');
      onCancel(); // Hide reply input after sending
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReply(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 80) + 'px';
  };

  // Focus on mount
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="mt-2 bg-gray-50 rounded-lg p-3 border-l-4 border-blue-200">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={reply}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={disabled 
              ? (t.pleaseLoginToReply || "Please log in to reply...") 
              : (t.writeReply || "Write a reply...")
            }
            disabled={disabled || isTranslating}
            className={`
              w-full p-2 rounded-lg border border-gray-300 
              resize-none min-h-[36px] max-h-[80px] text-sm
              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              placeholder:text-gray-400
            `}
            rows={1}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors duration-200"
          >
            <X size={16} />
          </button>
          <button
            type="submit"
            disabled={disabled || !reply.trim() || isTranslating}
            className={`
              flex items-center justify-center w-8 h-8 rounded-full 
              transition-colors duration-200
              ${disabled || !reply.trim() || isTranslating
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
              }
            `}
            title={isTranslating ? (t.translating || 'Translating...') : (t.sendReply || 'Send reply')}
          >
            {isTranslating ? (
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
      </form>
      <div className="mt-2 text-xs text-gray-500">
        {t.replyInstructions || 'Press Enter to send, Shift+Enter for new line, Esc to cancel'}
        {needsTranslation && language !== 'en' && (
          <span className="ml-2 text-blue-600">
            • {t.willBeTranslated || 'Will be translated to current language'}
          </span>
        )}
      </div>
    </div>
  );
}
