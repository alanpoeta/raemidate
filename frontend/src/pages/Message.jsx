import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import queriesOptions from "../helpers/queries";
import api from "../helpers/api";
import Loading from "../components/Loading";
import useWebSocket from "../helpers/useWebSocket";
import { useNotification } from "../helpers/NotificationContext";

const Message = () => {
  let { recipientId } = useParams();
  recipientId = parseInt(recipientId);
  const [text, setText] = useState("");
  const queryClient = useQueryClient();
  const { handleUnmatch, setActiveRecipientId, isLoading: notificationIsLoading } = useNotification();

  const messagesKey = ["message", recipientId];

  useEffect(() => {
    if (notificationIsLoading) return;
    setActiveRecipientId(recipientId);
    return () => {
      setActiveRecipientId(null);
    };
  }, [recipientId, notificationIsLoading]);

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

  const navigate = useNavigate();

  const unmatchMutation = useMutation({
    mutationFn: () => api.delete(`match/${recipientId}/`),
    onSuccess: () => {
      handleUnmatch(recipientId);
      navigate("/matches");
    },
  })

  if (isLoading) return <Loading />;

  const messages = messagesQuery.data || [];

  return (
    <>
      <button onClick={() => unmatchMutation.mutate()}>Unmatch</button>
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
