import { useState, useEffect, useRef } from "react";
import axios from "axios";
import CommandButtons from "./CommandButtons";

interface Message {
  text: string;
  isUser?: boolean;
  buttons?: { label: string; callback: string }[][];
}

function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Welcome to ForgeBot! Use buttons or type commands." },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

 const sendCommand = async (command: string) => {
  const fid = sessionStorage.getItem("fid");

  if (!fid) {
    setMessages(prev => [
      ...prev,
      { text: "Please authenticate via Farcaster." },
    ]);
    return;
  }

  setMessages(prev => [...prev, { text: command, isUser: true }]);

  try {
    const { data } = await axios.post(
      "https://forgeback-production.up.railway.app/api/chat/command",
      { command, fid }
    );
    
    setMessages(prev => [
      ...prev,
      { text: data.response, buttons: data.buttons },
    ]);
  } catch (error) {
    const message = axios.isAxiosError(error) && error.response?.data?.message
      ? error.response.data.message
      : "Error processing command.";
    setMessages(prev => [...prev, { text: message }]);
  }
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendCommand(input);
      setInput("");
    }
  };

  const handleButtonClick = (callback: string) => {
    sendCommand(callback);
  };

  return (
    <div className="text-black flex flex-col h-[695px] w-[424px] bg-gray-100 p-4 font-sans text-sm">
      <div className="flex-1 overflow-y-auto mb-4 bg-white rounded-lg p-2 shadow">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 m-1 rounded ${msg.isUser ? "bg-blue-100 ml-8" : "bg-gray-200 mr-8"}`}
          >
            <pre className="whitespace-pre-wrap">{msg.text}</pre>
            {msg.buttons && (
              <div className="mt-2 flex flex-wrap gap-2">
                {msg.buttons.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex gap-2">
                    {row.map((btn, btnIdx) => (
                      <button
                        key={btnIdx}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                        onClick={() => handleButtonClick(btn.callback)}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <CommandButtons onCommand={sendCommand} />
      <form onSubmit={handleSubmit} className="flex mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter command..."
          className="flex-1 p-2 rounded-l border border-gray-300"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-r">
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;
