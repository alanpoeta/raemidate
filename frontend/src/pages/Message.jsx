import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useRef } from "react";
import queriesOptions from "../helpers/queries";
import api from "../helpers/api";
import Loading from "../components/Loading";
import useWebSocket from "../helpers/useWebSocket";
import { useNotification } from "../helpers/NotificationContext";

const Message = ({ recipientId, navigate }) => {
  recipientId = parseInt(recipientId);
  const [text, setText] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");
  const [showConfirmUnmatch, setConfirmUnmatch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  
  const reportReasons = ["Harassment/Inappropriate behavior", "Incorrect age", "Impersonation"];
  const queryClient = useQueryClient();
  const { handleUnmatch, setActiveRecipientId, isLoading: notificationIsLoading } = useNotification();

  const matchesQuery = useQuery(queriesOptions.matches);
  const recipientProfile = useMemo(
    () => (matchesQuery.data || []).find(i => i.profile.user === recipientId)?.profile,
    [recipientId]
  )

  useEffect(() => {
    if (notificationIsLoading) return;
    setActiveRecipientId(recipientId);
    return () => {
      setActiveRecipientId(null);
    };
  }, [recipientId, notificationIsLoading]);

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

  // Auto-scroll to bottom
  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (isLoading) return;
  
    messagesEndRef.current?.scrollIntoView(firstRenderRef.current ? {} : { behavior: "smooth" });
    firstRenderRef.current = false;
  }, [isLoading, messagesQuery.data]);

  const sendMessage = e => {
    e.preventDefault();
    if (!text.trim()) return;
    socketRef.current.send(JSON.stringify({ text }));
    setText("");
  };

  const unmatchMutation = useMutation({
    mutationFn: () => api.delete(`match/${recipientId}/`),
    onSuccess: () => {
      handleUnmatch(recipientId);
      navigate('matches');
    },
  })
  
  const reportMutation = useMutation({
    mutationFn: () => api.post(`report-conversation/${recipientId}/`, { reason }),
    onSuccess: () => {
      setShowReport(false);
      setReason("");
      alert("Report submitted.");
    },
  });

  if (isLoading) return <Loading />;
  
  if (showReport) return (
    <div className="p-6">
      <h4 className="text-xl font-bold mb-4">Report Conversation</h4>
      <p className="text-gray-600 mb-4 text-sm">Select a reason. All messages will be reviewed.</p>
      <select 
        value={reason} 
        onChange={e => setReason(e.target.value)}
        className="w-full p-3 border rounded-lg mb-6"
      >
        <option value="">-- Select Reason --</option>
        {reportReasons.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <button
        disabled={!reason || reportMutation.isPending}
        onClick={() => reportMutation.mutate()}
        className="w-full py-3 bg-red-500 text-white rounded-xl font-bold mb-3 disabled:opacity-50"
      >
        {reportMutation.isPending ? "Reporting" : "Confirm Report"}
      </button>
      <button
        onClick={() => { setShowReport(false); setReason(""); }}
        className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold"
      >
        Cancel
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('matches')} className="p-1 -ml-1 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          {recipientProfile && (
             <div className="flex items-center gap-2">
                <img 
                  src={`data:image/jpeg;base64,${recipientProfile.photos[0].blob}`} 
                  className="w-8 h-8 rounded-full object-cover" 
                  alt=""
                />
                <span className="font-bold text-gray-800">{recipientProfile.first_name}</span>
             </div>
          )}
        </div>
        
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-400">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
            </svg>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 top-10 bg-white shadow-xl border border-gray-100 rounded-lg w-40 py-1 z-20">
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => { setConfirmUnmatch(true); setShowMenu(false); }}
                >
                  Unmatch
                </button>
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => { setShowReport(true); setShowMenu(false); }}
                >
                  Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showConfirmUnmatch && (
        <div className="absolute inset-0 z-30 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <h3 className="text-lg font-bold mb-2">Unmatch {recipientProfile?.first_name}?</h3>
          <p className="text-gray-500 text-sm mb-6 text-center">You will lose this conversation forever.</p>
          <div className="flex gap-4 w-full max-w-xs">
             <button onClick={() => setConfirmUnmatch(false)} className="flex-1 py-2 bg-gray-200 rounded-lg font-semibold">Cancel</button>
             <button 
               onClick={() => unmatchMutation.mutate()} 
               className="flex-1 py-2 bg-red-500 text-white rounded-lg font-semibold disabled:opacity-50"
               disabled={unmatchMutation.isPending}
            >
              {unmatchMutation.isPending ? "Unmatching" : "Unmatch"}
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {(messagesQuery.data || []).map(({ sender, text, created_at }, i) => {
          const isMe = sender !== recipientId;
          // Basic time formatting
          const time = new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  isMe 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}
              >
                {text}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">{time}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
        <input 
          value={text} 
          onChange={e => setText(e.target.value)} 
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          placeholder="Type a message..."
        />
        <button 
          type="submit" 
          disabled={!text.trim()}
          className="p-2.5 bg-primary text-white rounded-full disabled:opacity-50 disabled:bg-gray-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Message;
