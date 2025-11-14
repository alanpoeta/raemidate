import { useEffect, useRef, useState } from "react";
import { auth } from "../api"
import { useAuth } from "./AuthContext";

const useWebSocket = (pathname, { onopen, onclose, onmessage, enabled = true } = {}) => {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef(null);
  
  useEffect(() => {
    const setupWebSocket = async () => {
      if (!enabled) return;
      
      if (!await auth()) {
        await logout();
        return;
      };

      const base = new URL(import.meta.env.VITE_API_URL);
      base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
      base.pathname = `ws/${pathname}`;
      base.searchParams.set('token', localStorage.getItem('access') || '');
      
      socketRef.current = new WebSocket(base.toString());

      socketRef.current.onopen = e => {
        if (onopen) onopen(e);
        console.log("Socket opened");
        setIsOpen(true);
      }
  
      socketRef.current.onclose = e => {
        if (onclose) onclose(e);
        console.error("Socket closed", e.code, e.reason);
        setIsOpen(false);
      };
  
      socketRef.current.onmessage = onmessage;
    }

    setupWebSocket();

    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) {
        socketRef.current?.close(1000, "disabled");
        socketRef.current = null;
      }
    };
  }, [pathname, enabled])
  
  return { socketRef, isOpen };
}
 
export default useWebSocket;
