import { useContext, createContext, useState } from "react";
import useWebSocket from "./useWebSocket";
import { useAuth } from "./AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import queriesOptions from "./queries";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [activeRecipientId, setActiveRecipientIdNaive] = useState(null);
  
  const enabled = isAuthenticated && user?.hasProfile && user?.isEmailVerified && user?.acceptedTos;
  
  const matchesQuery = useQuery({...queriesOptions.matches, enabled});
  
  const handleUnmatch = (id) => {
    queryClient.setQueryData(
      queriesOptions.matches.queryKey,
      prev => prev ? prev.filter(match => match.profile.user !== id) : prev
    );
  };

  const setActiveRecipientId = (recipientId) => {
    setActiveRecipientIdNaive(recipientId);
    
    if (recipientId) {
      queryClient.setQueryData(queriesOptions.matches.queryKey, matches => {
        if (!matches) return matches;
        return matches.map(match => 
          match.profile.user === recipientId
            ? { ...match, unread_count: 0 }
            : match
        );
      });
    }
  };

  const { isOpen: socketIsOpen } = useWebSocket("notification/", {
    enabled,
    onmessage: e => {
      const notification = JSON.parse(e.data);
      
      if (notification.type === "unmatch") {
        handleUnmatch(notification.id);
      } else if (notification.type === "message") {
        if (activeRecipientId === notification.id)
          return;
        
        queryClient.setQueryData(queriesOptions.matches.queryKey, matches => {
          if (!matches) return matches;
          const i = matches.findIndex(match => match.profile.user === notification.id);
          if (i === -1) return matches;
          
          return [
            ...matches.slice(0, i),
            {
              ...matches[i],
              unread_count: matches[i].unread_count + 1
            },
            ...matches.slice(i + 1)
          ];
        });
      } else if (notification.type === "match") {
        queryClient.invalidateQueries({ queryKey: queriesOptions.matches.queryKey });
      }
    }
  });
  
  const unreadCount = (matchesQuery.data || []).reduce((sum, match) => sum + (match.unread_count || 0), 0);

  const notificationValue = {
      unreadCount,
      isLoading: matchesQuery.isLoading || !socketIsOpen,
      handleUnmatch,
      setActiveRecipientId
    }

  return (
    <NotificationContext.Provider value={notificationValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within NotificationProvider.");
  return context;
};
