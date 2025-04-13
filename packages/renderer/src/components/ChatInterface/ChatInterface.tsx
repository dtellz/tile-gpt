import React, { useState, useRef, useEffect } from 'react';
import { useLog } from '../../hooks/useLogContext';
import { useWorkspace } from '../../hooks/useWorkspaceContext';
import './ChatInterface.css';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatInterfaceProps {
  activeTab?: { id: string; path: string; name: string } | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeTab }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addLog } = useLog();
  const { workspacePath } = useWorkspace();

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          content: 'Welcome to TileGPT! I can help you with your Tiled maps. What would you like to do?',
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
    }
  }, [messages.length]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Log the message
      addLog(`User message: ${inputValue}`, 'info');

      // In the future, this will call the backend API
      // For now, we'll just simulate a response
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          content: simulateResponse(inputValue, workspacePath, activeTab?.path),
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prevMessages => [...prevMessages, assistantMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      addLog(`Error sending message: ${error}`, 'error');
      setIsLoading(false);
    }
  };

  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>TileGPT Assistant</h2>
        {workspacePath && (
          <div className="chat-workspace-info">
            <span>Workspace: {workspacePath}</span>
            {activeTab && <span>Active file: {activeTab.name}</span>}
          </div>
        )}
      </div>

      <div className="chat-messages">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`chat-message ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">{message.content}</div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message assistant-message">
            <div className="message-content loading">
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          disabled={isLoading}
        />
        <button 
          className="send-button" 
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Temporary function to simulate responses until backend is ready
function simulateResponse(message: string, workspacePath?: string, activeFilePath?: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (!workspacePath) {
    return "Please select a workspace first to access your Tiled maps.";
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your Tiled companion. I can help you with your map files. What would you like to do?";
  }
  
  if (lowerMessage.includes('help')) {
    return "I can help you with various tasks related to your Tiled maps. For example:\n\n" +
      "- Analyze map structure\n" +
      "- Suggest improvements\n" +
      "- Generate new map elements\n" +
      "- Explain tileset properties\n\n" +
      "Just select a map file from the file explorer and ask me a specific question!";
  }
  
  if (activeFilePath && (activeFilePath.endsWith('.tmx') || activeFilePath.endsWith('.tsx'))) {
    if (lowerMessage.includes('analyze') || lowerMessage.includes('structure')) {
      return `I'll analyze the structure of ${activeFilePath.split('/').pop()}. This file appears to be a ${activeFilePath.endsWith('.tmx') ? 'Tiled map' : 'tileset'} file. When the backend is connected, I'll provide detailed information about its layers, objects, and properties.`;
    }
    
    if (lowerMessage.includes('improve') || lowerMessage.includes('suggestion')) {
      return `Based on the ${activeFilePath.split('/').pop()} file, I could suggest improvements to your map design. Once the backend is connected, I'll analyze your map and provide specific recommendations.`;
    }
  }
  
  return "I understand you're asking about your Tiled maps. Once the backend is connected, I'll be able to provide more specific assistance. For now, you can browse your files in the explorer and I'll help guide you through using this companion app.";
}
