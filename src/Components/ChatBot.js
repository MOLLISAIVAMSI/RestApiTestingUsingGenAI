import React, { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "Hi! I'm Nina, an AI Assistant. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (userMessage) => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5010/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      return data.response;
    } catch (error) {
      console.error('Error:', error);
      return 'Sorry, I encountered an error. Please try again.';
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue('');

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    // Get bot response
    const botResponse = await sendMessage(userMessage);

    setMessages(prev => [...prev, {
      type: 'bot',
      content: botResponse,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  return (
    <div className="fixed bottom-4 right-6 z-50 ">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#111827] hover:bg-[#0f172a] text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="w-80 shadow-xl rounded-lg overflow-hidden">
          {/* Chat Header */}
          <div className="bg-[#111827] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#111827] font-bold">
                i
              </div>
              <div>
                <div className="font-semibold">Nina</div>
                <div className="text-sm">AI Assistant</div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-[#0f172a] rounded-lg p-1"
            >
              ×
            </button>
          </div>

          {/* Chat Messages */}
          <div className="bg-white h-96 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-[#111827] text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {message.content}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {message.time}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="bg-white border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter a message"
                disabled={isLoading}
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-[#111827] disabled:bg-gray-100"
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="bg-[#111827] text-white p-2 rounded-lg hover:bg-[#0f172a] disabled:bg-[#374151]"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
