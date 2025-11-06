import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const DM = () => {
  const socketRef = useRef(null);
  const { recipientId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setMessage] = useState(""); 

  useEffect(() => {
    console.log("Creating WS connection...")

    const base = new URL(import.meta.env.VITE_API_URL);
    base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
    base.pathname = `ws/dm/${recipientId}/`;
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
  }, [recipientId])
  
  return (
    <>
      <p>Chat with: {recipientId}</p>
      {messages.map(({ sender, text }, index) => (
        <p key={index}>{sender}: {text}</p>
      ))}
      <input value={text} onChange={e => setMessage(e.target.value)} />
      <button onClick={() => {
        socketRef.current.send(JSON.stringify({ text }));
        setMessage("");
      }}>Send</button>
    </>
  );
}
 
export default DM;
