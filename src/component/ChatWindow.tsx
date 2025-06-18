// src/components/ChatWindow.tsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import CommandButtons from "./CommandButtons";
import { AuthKitProvider, SignInButton, useProfile } from "@farcaster/auth-kit";

interface Message {
  text: string;
  isUser?: boolean;
  buttons?: { label: string; callback: string }[][];
}

function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Welcome to ForgeBot! Sign in with Farcaster to start." },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, profile } = useProfile();
  const [authData, setAuthData] = useState<{
    nonce: string | undefined;
    signature: string | undefined;
    message: string | undefined;
  } | null>(null);
  const lastCommand = useRef<{ fid: string | null; command: string; time: number }>({
    fid: null,
    command: "",
    time: 0,
  });

  useEffect(() => {
    const storedAuthData = sessionStorage.getItem("authData");
    const storedFid = sessionStorage.getItem("fid");
    console.log("Initial load: storedAuthData =", storedAuthData, "storedFid =", storedFid);
    if (storedAuthData) {
      setAuthData(JSON.parse(storedAuthData));
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && profile?.fid && authData) {
      console.log("Sign-in confirmed:", { fid: profile.fid, authData, profile });
      setMessages((prev) => [
        ...prev,
        { text: `Logged in as ${profile.displayName} (FID: ${profile.fid})` },
      ]);
      sessionStorage.setItem("fid", profile.fid.toString());
      sessionStorage.setItem("username", profile.username || "player");
      sessionStorage.setItem("displayName", profile.displayName || "User");
      sessionStorage.setItem("authData", JSON.stringify(authData));
      sendCommand("/start");
    } else {
      console.log("Sign-in incomplete:", { isAuthenticated, fid: profile?.fid, authData });
    }
  }, [isAuthenticated, profile, authData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendCommand = async (command: string) => {
    const fid = sessionStorage.getItem("fid");
    const username = sessionStorage.getItem("username");
    const displayName = sessionStorage.getItem("displayName");
    const storedAuthData = sessionStorage.getItem("authData");
    const userAuthData = storedAuthData ? JSON.parse(storedAuthData) : authData;

    console.log("sendCommand: Preparing request", { fid, username, displayName, command, userAuthData });

    if (
      lastCommand.current.fid === fid &&
      lastCommand.current.command === command &&
      Date.now() - lastCommand.current.time < 1000
    ) {
      console.log("Ignoring duplicate command:", command);
      return;
    }
    lastCommand.current = { fid, command, time: Date.now() };

    if (!fid || !userAuthData?.nonce || !userAuthData?.signature || !userAuthData?.message) {
      console.log("sendCommand: Missing required data", { fid, userAuthData });
      setMessages([...messages, { text: "Please sign in via Farcaster." }]);
      return;
    }

    setMessages([...messages, { text: command, isUser: true }]);
    setIsLoading(true);
    try {
      const payload = {
        command,
        fid,
        username,
        displayName,
        user: {
          nonce: userAuthData.nonce,
          signature: userAuthData.signature,
          message: userAuthData.message,
        },
      };
      console.log("sendCommand: Sending payload =", JSON.stringify(payload, null, 2));
      const { data } = await axios.post(
        "https://forgeback-production.up.railway.app/api/chat/command",
        payload,
        { withCredentials: true }
      );
      console.log("sendCommand: Response received =", data);
      setMessages((prev) => [
        ...prev,
        { text: data.response, buttons: data.buttons },
      ]);
    } catch (error) {
      console.error("Error processing command:", error);
      if (axios.isAxiosError(error)) {
        console.log("Axios error details:", {
          message: error.message,
          code: error.code,
          response: error.response
            ? { status: error.response.status, data: error.response.data }
            : null,
        });
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessages((prev) => [...prev, { text: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
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
    <AuthKitProvider
      config={{
        domain: "mini-testf.netlify.app",
        rpcUrl: `https://base-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
      }}
    >
      <div className="text-black flex flex-col h-[695px] w-[424px] bg-gray-100 p-4 font-sans text-sm">
        <div className="flex-1 overflow-y-auto mb-4 bg-white rounded-lg p-2 shadow">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 m-1 rounded ${msg.isUser ? "bg-blue-100 ml-8" : "bg-gray-200 mr-8"}`}
            >
              <pre className="whitespace-pre-wrap">{msg.text}</pre>
              {i === 0 && profile?.fid && (
                <p className="text-xs text-gray-500 mt-1">Your Farcaster ID: {profile.fid}</p>
              )}
              {i === 0 && profile?.username && (
                <p className="text-xs text-gray-500">Logged in as: {profile.username}</p>
              )}
              {i === 0 && profile?.displayName && (
                <p className="text-xs text-gray-500">Logged in as: {profile.displayName}</p>
              )}
              {msg.buttons && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.buttons.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex gap-2">
                      {row.map((btn, btnIdx) => (
                        <button
                          key={btnIdx}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                          onClick={() => handleButtonClick(btn.callback)}
                          disabled={isLoading}
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
       {!isAuthenticated && (
  <div className="mb-4 p-4 bg-white rounded-lg shadow z-50 flex flex-col items-center">
    <p className="mb-2 text-sm text-gray-700">Please sign in with Farcaster:</p>
    <div onClick={() => console.log("SignInButton clicked")}>
      <SignInButton
        nonce={async () => {
          console.log("SignInButton nonce requested");
          try {
            const response = await axios.get(
              "https://forgeback-production.up.railway.app/api/nonce",
              { withCredentials: true }
            );
            console.log("Fetched nonce:", response.data.nonce);
            return response.data.nonce;
          } catch (error) {
            console.error("Failed to fetch nonce:", error);
            throw error;
          }
        }}
        onSuccess={({ nonce, signature, message }) => {
          console.log("Farcaster sign-in successful:", { nonce, signature, message });
          setAuthData({ nonce, signature, message });
        }}
        onError={(error) => {
          console.error("Farcaster sign-in failed:", error);
          const errorMessage = error ? error.message || "Unknown error" : "Sign-in failed";
          setMessages((prev) => [
            ...prev,
            { text: `❌ Farcaster sign-in failed: ${errorMessage}` },
          ]);
        }}
      />
    </div>
  </div>
)}

        <CommandButtons onCommand={sendCommand} isLoading={isLoading} />
        <form onSubmit={handleSubmit} className="flex mt-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter command..."
            className="flex-1 p-2 rounded-l border border-gray-300"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-r"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </AuthKitProvider>
  );
}

export default ChatWindow;