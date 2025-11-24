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
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const reportReasons = ["Harassment", "Incorrect age", "Impersonation"];
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
  
  const reportMutation = useMutation({
    mutationFn: () => api.post(`report/${recipientId}/`, { reason }),
    onSuccess: () => {
      setShowReport(false);
      setReason("");
      alert("Report submitted.");
    },
  });

  if (isLoading) return <Loading />;

  const messages = messagesQuery.data || [];

  return (
    <>
      {!confirmUnmatch ? (
        <button onClick={() => setConfirmUnmatch(true)}>Unmatch</button>
      ) : (
        <span >
          <span>Are you sure?</span>
          <button
            disabled={unmatchMutation.isLoading}
            onClick={() => unmatchMutation.mutate()}
          >
            Yes, unmatch
          </button>
          <button onClick={() => setConfirmUnmatch(false)}>Cancel</button>
        </span>
      )}
      <button onClick={() => setShowReport(true)}>Report</button>
      {showReport && (
        <article>
          <h4>Report Conversation</h4>
            <p>Select a reason. A moderator will review this conversation (all messages become visible to staff).</p>
            <select value={reason} onChange={e => setReason(e.target.value)}>
              <option value="">-- Reason --</option>
              {reportReasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button
              disabled={!reason || reportMutation.isLoading}
              onClick={() => reportMutation.mutate()}
            >
              Confirm Report
            </button>
            <button
              onClick={() => {
                setShowReport(false);
                setReason("");
            }}>
              Cancel
            </button>
        </article>
      )}
      <form onSubmit={sendMessage}>
        {messages.map(({ sender, text, created_at }, i) => (
          <p key={i}>{sender}: {text}  |  {created_at}</p>
        ))}
        <input value={text} onChange={e => setText(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </>
  );
};

export default Message;
