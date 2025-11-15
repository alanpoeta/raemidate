import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import queriesOptions from "../queries";
import api from "../api";
import Loading from "../helpers/Loading";
import useWebSocket from "../helpers/useWebSocket";

const Message = () => {
  const { recipientId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const queryOptions = queriesOptions.message;
  queryOptions.queryFn = () => api.get(`message/${recipientId}/`).then(res => res.data)
  queryOptions.queryKey = ["message", { user: recipientId }]
  const messagesQuery = useQuery(queryOptions);

  const queryClient = useQueryClient();

  const { socketRef, isOpen: socketIsOpen } = useWebSocket(`message/${recipientId}/`, {
    onmessage: e => {
      const message = JSON.parse(e.data);
      setMessages(messages => [...messages, message]);
    }
  });

  const isLoading = !socketIsOpen || messagesQuery.isLoading;

  const sendMessage = e => {
    e.preventDefault();
    socketRef.current.send(JSON.stringify({ text }));
    setText("");
    queryClient.invalidateQueries({ queryKey: messagesQuery.queryKey })
  }

  const unmatch = () => api.delete(`unmatch/${recipientId}/`);

  useEffect(() => {
    if (messagesQuery.isSuccess) {
      setMessages(messages => [...messagesQuery.data, ...messages]);
    };
  }, [messagesQuery.isLoading])
  
  if (isLoading) return <Loading />;
  return (
    <>
      <button onClick={unmatch}>Unmatch</button>
      <form onSubmit={sendMessage}>
        {messages.map(({ sender, text }, index) => (
          <p key={index}>{sender}: {text}</p>
        ))}
        <input value={text} onChange={e => setText(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </>
  );
}
 
export default Message;
