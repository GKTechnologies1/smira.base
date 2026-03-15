import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, MessageCircle, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import { cn } from '@/lib/utils';
import { useTalk } from '../components/talk/TalkContext';

export default function Chat() {
  const { openTalk } = useTalk();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversation?.id) {
      const unsub = base44.agents.subscribeToConversation(activeConversation.id, (data) => {
        setMessages(data.messages || []);
      });
      return () => unsub();
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    const convos = await base44.agents.listConversations({ agent_name: 'smira' });
    setConversations(convos);
    if (convos.length > 0) {
      const latest = await base44.agents.getConversation(convos[0].id);
      setActiveConversation(latest);
      setMessages(latest.messages || []);
    }
    setLoading(false);
  };

  const createNewConversation = async () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const convo = await base44.agents.createConversation({
      agent_name: 'smira',
      metadata: { name: `Smira · ${today}` },
    });
    setActiveConversation(convo);
    setMessages([]);
    setConversations(prev => [convo, ...prev]);
    setShowSidebar(false);
  };

  const selectConversation = async (convo) => {
    const full = await base44.agents.getConversation(convo.id);
    setActiveConversation(full);
    setMessages(full.messages || []);
    setShowSidebar(false);
  };

  const sendMessage = async (content) => {
    setSending(true);
    await base44.agents.addMessage(activeConversation, { role: 'user', content });
    setSending(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Empty state
  if (!activeConversation) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"
            style={{ background: 'linear-gradient(135deg, #0D1B2A, #0a2f26)', border: '1px solid #00C9A720' }}>
            ✦
          </div>
          <h2 className="text-2xl font-lora font-medium mb-2">Say hello to Smira</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Tell me about your day, your plans, a worry, or something on your mind. I'm listening.
          </p>
          <Button onClick={createNewConversation} size="lg" className="rounded-2xl">
            <MessageCircle className="w-4 h-4 mr-2" />
            Start a Conversation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 pl-10 lg:pl-0">
          <button onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg, #0D1B2A, #0a2f26)', border: '1px solid #00C9A720' }}>
            ✦
          </div>
          <div>
            <h3 className="text-sm font-semibold font-lora">Smira</h3>
            <p className="text-xs text-muted-foreground">Here with you</p>
          </div>
        </div>
        <Button onClick={createNewConversation} variant="outline" size="sm" className="rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
      </div>

      {/* Conversation sidebar (mobile overlay, hidden on desktop for simplicity) */}
      {showSidebar && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setShowSidebar(false)} />
          <div className="fixed top-0 right-0 h-full w-72 bg-card border-l border-border z-40 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-4">Conversations</h3>
            <div className="space-y-2">
              {conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl text-sm transition-colors",
                    activeConversation?.id === c.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  )}
                >
                  {c.metadata?.name || 'Conversation'}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Say hello to Smira ✨</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Talk to Smira */}
      <div className="px-4 pb-2 pt-1 border-t border-border bg-card/80">
        <button
          onClick={() => openTalk('Chat')}
          className="w-full flex items-center justify-center gap-3 font-lora text-white text-[16px] font-medium rounded-[28px] mb-1"
          style={{
            height: 56,
            background: '#1D9E75',
            boxShadow: '0 4px 20px #1D9E7530',
          }}
        >
          <Mic className="w-5 h-5" />
          Talk to Smira
        </button>
        <p className="text-xs text-muted-foreground text-center pb-1">Speak naturally in any language.</p>
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={sending} />
    </div>
  );
}