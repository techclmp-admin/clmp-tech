import React, { useState, useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Minimize2,
  Maximize2,
  Sparkles,
  LogIn
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = 'https://nkvhihqkfeqqkqhgthsv.supabase.co/functions/v1/ai-chat';

export const AIChatAssistant: React.FC = () => {
  const { user } = useAuth();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Check if AI Chatbot feature is enabled or upcoming globally
  const isChatbotEnabled = isFeatureEnabled('ai_chatbot');
  const isChatbotUpcoming = isFeatureUpcoming('ai_chatbot');
  
  const getWelcomeMessage = useCallback(() => {
    if (user) {
      return 'Hi! I\'m your CLMP AI Assistant. I can help you with:\n\n• **Budget & Expenses** - Track spending, analyze trends\n• **Project Management** - Tasks, timelines, teams\n• **Compliance** - Permits, inspections, safety\n• **Risk Analysis** - Weather alerts, risk mitigation\n\nHow can I help you today?';
    }
    return 'Welcome to CLMP AI Assistant! 👋\n\nTo start chatting with me, please **sign in** or **create an account**. I can help you with budget tracking, project management, compliance, and more!\n\n[Sign in or Sign up →](/auth)';
  }, [user]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m your CLMP AI Assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update welcome message when user changes
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date()
    }]);
  }, [getWelcomeMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';
    const assistantId = (Date.now() + 1).toString();

    try {
      // Get user's access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        // Show friendly sign-in prompt instead of error
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '🔐 To chat with me, please sign in first!\n\n[Sign in or Sign up →](/auth)\n\nOnce you\'re logged in, I\'ll be ready to help you with all your construction management needs.',
          timestamp: new Date()
        }]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: messages
            .filter(m => m.id !== 'welcome')
            .concat(userMessage)
            .map(m => ({ role: m.role, content: m.content })),
          context: { includeUserData: !!user }
        }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      // Add initial assistant message
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => 
                prev.map(m => m.id === assistantId 
                  ? { ...m, content: assistantContent }
                  : m
                )
              );
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again or contact support at info@clmptech.ca.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, user]);
  
  // If feature is disabled AND not upcoming, don't render the chatbot at all
  // This must be after all hooks to respect Rules of Hooks
  if (!isChatbotEnabled && !isChatbotUpcoming) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting with XSS protection
    const formatted = content
      .split('\n')
      .map((line, i) => {
        // Bold
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Links [text](url) - only allow safe relative URLs and https
        line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
          // Only allow relative paths or https URLs
          if (url.startsWith('/') || url.startsWith('https://')) {
            return `<a href="${url}" class="text-primary underline hover:text-primary/80">${text}</a>`;
          }
          return text; // Strip unsafe URLs
        });
        // Bullet points
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return `<li class="ml-4">${line.slice(2)}</li>`;
        }
        return line;
      })
      .join('<br />');
    
    // Sanitize with DOMPurify to prevent XSS attacks
    return DOMPurify.sanitize(formatted, {
      ALLOWED_TAGS: ['strong', 'a', 'li', 'br'],
      ALLOWED_ATTR: ['href', 'class'],
    });
  };

  // Show "Coming Soon" button if feature is upcoming
  if (isChatbotUpcoming && !isOpen) {
    return (
      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50">
        <Button
          disabled
          className="h-14 w-14 rounded-full shadow-lg p-0 opacity-60 relative"
          size="icon"
        >
          <Sparkles className="h-6 w-6" />
          <span className="sr-only">AI Assistant - Coming Soon</span>
        </Button>
        <Badge 
          variant="secondary" 
          className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5"
        >
          Soon
        </Badge>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 h-14 w-14 rounded-full shadow-lg z-50 p-0"
        size="icon"
      >
        <Sparkles className="h-6 w-6" />
        <span className="sr-only">Open AI Assistant</span>
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed z-50 shadow-2xl border transition-all duration-200",
      isMinimized 
        ? "bottom-24 md:bottom-6 right-4 md:right-6 w-72" 
        : "bottom-24 md:bottom-6 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-96 h-[60vh] md:h-[500px] max-h-[80vh]"
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-medium">CLMP AI Assistant</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <ScrollArea className="flex-1 h-[calc(100%-120px)]" ref={scrollRef}>
            <CardContent className="p-3 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 max-w-[80%] text-sm",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                    dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                  />
                  {message.role === 'user' && (
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-2 justify-start">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </CardContent>
          </ScrollArea>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="text-sm"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
