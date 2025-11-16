import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import queriesOptions from "../queries";
import api from "../api";
import Loading from "../helpers/Loading";
import useWebSocket from "../helpers/useWebSocket";

const Message = () => {
  const { recipientId } = useParams();
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const messagesKey = ["message", recipientId];

  const messagesQuery = useQuery({
    ...queriesOptions.message,
    queryKey: messagesKey,
    queryFn: () => api.get(`message/${recipientId}/`).then(res => res.data),
  });

  const { socketRef, isOpen: socketIsOpen } = useWebSocket(`message/${recipientId}/`, {
    onmessage: e => {
      const msg = JSON.parse(e.data);
      queryClient.setQueryData(messagesKey, old => [...(old || []), msg]);
    }
  });

  const isLoading = !socketIsOpen || messagesQuery.isLoading;

  const sendMessage = e => {
    e.preventDefault();
    socketRef.current.send(JSON.stringify({ text }));
    setText("");
  };

  const unmatch = () => api.delete(`unmatch/${recipientId}/`);

  if (isLoading) return <Loading />;

  const messages = messagesQuery.data || [];

  return (
    <>
      <button onClick={unmatch}>Unmatch</button>
      <form onSubmit={sendMessage}>
        {messages.map(({ sender, text }, i) => (
          <p key={i}>{sender}: {text}</p>
        ))}
        <input value={text} onChange={e => setText(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </>
  );
};

export default Message;
