import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import ChatWindow from "./component/ChatWindow";
import { useAccount } from "wagmi";

function App() {
  const { isConnected, connector, address } = useAccount();

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  useEffect(() => {
    if (isConnected && connector?.id === "farcasterFrame") {
      // The FID is typically part of the Farcaster Frame context or can be derived
      // from the connected account. For simplicity, we'll assume the address
      // can be used as a unique identifier or that the FID is implicitly handled
      // by the connector and passed to the backend.
      // In a real application, you might get the FID from a specific Farcaster SDK method
      // or from the backend after a successful authentication flow.
      // For now, we'll simulate storing an FID based on connection.
      sessionStorage.setItem("fid", address || "");
    }
  }, [isConnected, connector, address]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-200">
      <ChatWindow />
    </div>
  );
}

export default App;
