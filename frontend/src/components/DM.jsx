import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

const DM = () => {
  const socketRef = useRef(null);
  const { peerId } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(""); 

  useEffect(() => {
    console.log("Creating WS connection...")

    const base = new URL(import.meta.env.VITE_API_URL);
    base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
    base.pathname = `ws/dm/${peerId}/`;
    base.searchParams.set('token', localStorage.getItem('access') || '');

    socketRef.current = new WebSocket(base.toString());

    socketRef.current.onclose = (e) => console.error("Chat socket closed", e.code, e.reason);

    socketRef.current.onmessage = e => {
      const message = JSON.parse(e.data);
      setMessages(messages => [...messages, message])
    }

    return () => {
      if (socketRef.current) socketRef.current.close(1000, "component unmount");
      socketRef.current = null;
    }
  }, [peerId])
  
  return (
    <>
      <p>Chat with: {peerId}</p>
      {messages.map(({ sender, message }, index) => (
        <p key={index}>{sender}: {message}</p>
      ))}
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={() => {
        socketRef.current.send(JSON.stringify({ message }));
        setMessage("");
      }}>Send</button>
    </>
  );
}
 
export default DM;
