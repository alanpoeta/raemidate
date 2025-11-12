import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import queriesOptions from "../queries";
import api from "../api";
import Loading from "./helpers/Loading";

const DM = () => {
  const socketRef = useRef(null);
  const { recipientId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const queryOptions = queriesOptions.message;
  queryOptions.queryFn = () => api.get(`message/${recipientId}`).then(res => res.data)
  const messagesQuery = useQuery(queryOptions);

  const sendMessage = e => {
    e.preventDefault();
    socketRef.current.send(JSON.stringify({ text }));
    setText("");
  }

  useEffect(() => {
    if (messagesQuery.isLoading) return;

    setMessages(messagesQuery.data);

    console.log("Creating WS connection...");

    const base = new URL(import.meta.env.VITE_API_URL);
    base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
    base.pathname = `ws/dm/${recipientId}/`;
    base.searchParams.set('token', localStorage.getItem('access') || '');

    socketRef.current = new WebSocket(base.toString());

    socketRef.current.onopen = () => setIsLoading(false);

    socketRef.current.onclose = e => console.error("Chat socket closed", e.code, e.reason);

    socketRef.current.onmessage = e => {
      const message = JSON.parse(e.data);
      setMessages(messages => [...messages, message]);
    }

    return () => {
      if (socketRef.current) socketRef.current.close(1000, "component unmount");
      socketRef.current = null;
    }
  }, [recipientId, messagesQuery.isLoading])
  
  if (isLoading) return <Loading />;
  return (
    <form onSubmit={sendMessage}>
      {messages.map(({ sender, text }, index) => (
        <p key={index}>{sender}: {text}</p>
      ))}
      <input value={text} onChange={e => setText(e.target.value)} />
      <button type="submit">Send</button>
    </form>
  );
}
 
export default DM;
