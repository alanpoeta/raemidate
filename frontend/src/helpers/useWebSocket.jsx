import { useEffect, useRef, useState } from "react";

const useWebSocket = (pathname, { onopen, onclose, onmessage, onunmount } = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef(null);
  
  useEffect(() => {
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
      console.log("Socket closed", e.code, e.reason);
      setIsOpen(false);
    };

    socketRef.current.onmessage = onmessage;

    return () => {
      if (socketRef.current) socketRef.current.close(1000, "component unmount");
      socketRef.current = null;
      if (onunmount) onunmount();
    };
  }, [pathname])
  
  return { socketRef, isOpen };
}
 
export default useWebSocket;
