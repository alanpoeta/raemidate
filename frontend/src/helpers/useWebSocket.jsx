import { useEffect, useRef, useState } from "react";
import { auth } from "./api"
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const useWebSocket = (pathname, { onopen, onclose, onmessage, enabled = true } = {}) => {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!enabled) return;
    
    auth()
    .then(isAuthenticated => {
      if (!isAuthenticated) logout();
    })

    const base = new URL(import.meta.env.VITE_API_URL);
    base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
    base.pathname = `ws/${pathname}`;
    const accessToken = localStorage.getItem("access") || "";
    socketRef.current = new WebSocket(base.toString(), [`Bearer.${accessToken}`]);

    socketRef.current.onopen = e => {
      if (onopen) onopen(e);
      setIsOpen(true);
    }

    socketRef.current.onclose = e => {
      if (onclose) onclose(e);
      if (e.code !== 1000) console.error("Socket closed", e.code, e.reason);
      setIsOpen(false);
      if ([WebSocket.CLOSING, WebSocket.CLOSED].includes(socketRef.current?.readyState)) {
        if (window.history.length > 1) navigate(-1);
        else navigate("/", { replace: true });
      }
    };

    socketRef.current.onmessage = onmessage;
    return () => {
      if ([WebSocket.OPEN, WebSocket.CONNECTING].includes(socketRef.current?.readyState)) {
        socketRef.current?.close(1000, "disabled");
        socketRef.current = null;
      }
    };
  }, [pathname, enabled])
  
  return { socketRef, isOpen };
}
 
export default useWebSocket;
