import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import ChatWindow from "./component/ChatWindow";
import { useAccount } from "wagmi";

function App() {  const { isConnected, connector, address } = useAccount();

  useEffect(() => {
    console.log("App.tsx: sdk.actions.ready() called");
    sdk.actions.ready();
  }, []);

  useEffect(() => {
    console.log("App.tsx: Wagmi connection status changed.");
    console.log("  isConnected:", isConnected);
    console.log("  connector:", connector);
    console.log("  address:", address);

    if (isConnected && connector?.id === "farcasterFrame") {
      sessionStorage.setItem("fid", address || "");
      console.log("FID (wallet address) set in sessionStorage:", address);
    } else if (isConnected && connector?.id !== "farcasterFrame") {
      console.log("Connected, but not via Farcaster Frame connector.");
    } else if (!isConnected) {
      console.log("Not connected to any wallet.");
    }  }, [isConnected, connector, address]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-200">
      <ChatWindow />
    </div>
  );
}

export default App;
