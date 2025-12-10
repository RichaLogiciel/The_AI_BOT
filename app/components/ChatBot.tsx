'use client';

import { useState, useRef, useEffect } from 'react';
import { SendIcon } from '../assets/sendIcon'

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hi! Ask me anything.', sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isDark, setIsDark] = useState(false); // Default to light theme
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Add bot reply immediately
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I will answer soon.',
        sender: 'bot'
      };
      setMessages(prev => [...prev, botMessage]);
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const themeClasses = isDark
    ? {
        container: 'bg-gray-900 text-gray-100',
        chatArea: 'bg-gray-900',
        inputArea: 'bg-gray-800 border-gray-700',
        input: 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400',
        botMessage: 'bg-gray-700 text-gray-100',
        userMessage: 'bg-blue-600 text-white',
        sendButton: 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600',
        header: 'bg-gray-800 border-gray-700',
        toggleButton: 'bg-gray-700 hover:bg-gray-600'
      }
    : {
        container: 'bg-white text-gray-900',
        chatArea: 'bg-gray-50',
        inputArea: 'bg-white border-gray-200',
        input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
        botMessage: 'bg-gray-100 text-gray-900',
        userMessage: 'bg-blue-500 text-white',
        sendButton: 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300',
        header: 'bg-white border-gray-200 shadow-sm',
        toggleButton: 'bg-gray-100 hover:bg-gray-200'
      };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <div className={`flex flex-col w-full max-w-xl h-[700px] ${themeClasses.container} rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700`}>
        {/* Header with Theme Toggle */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${themeClasses.header}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h2 className="font-semibold text-base">ChatBot</h2>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${themeClasses.toggleButton}`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m6.364 6.364l-1.591 1.591M21 12h-2.25m-6.364 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Chat Area */}
        <div className={`flex-grow overflow-y-auto p-4 space-y-3 ${themeClasses.chatArea}`}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                  message.sender === 'user'
                    ? themeClasses.userMessage
                    : themeClasses.botMessage
                }`}
                style={{
                  borderRadius: message.sender === 'user' 
                    ? '1rem 1rem 0.25rem 1rem' 
                    : '1rem 1rem 1rem 0.25rem'
                }}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`border-t ${themeClasses.inputArea} p-3`}>
          <div className="flex items-end gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className={`flex-grow resize-none rounded-xl border px-4 py-2.5 text-sm ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              style={{
                maxHeight: '100px',
                overflowY: 'auto'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={inputValue.trim() === ''}
              className={`flex-shrink-0 h-10 w-10 rounded-xl ${themeClasses.sendButton} disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg disabled:opacity-50`}
              aria-label="Send message"
            > <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

