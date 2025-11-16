import { useContext, createContext } from "react";
import useWebSocket from "./useWebSocket";
import { useAuth } from "./AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import queriesOptions from "../queries";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  const enabled = isAuthenticated && user?.hasProfile;
  const notificationQuery = useQuery({...queriesOptions.unreadCount, enabled});
  const unreadCount = notificationQuery.data?.unread_count

  const { isOpen: socketIsOpen } = useWebSocket("notification/", {
    enabled,
    onmessage: e => {
      const message = JSON.parse(e.data);
      queryClient.setQueryData(notificationQuery.key, notifications => [...(notifications || []), message]);
    }
  });

  const notificationValue = {
    unreadCount, isLoading: notificationQuery.isLoading || !socketIsOpen
  };

  return (
    <NotificationContext.Provider value={notificationValue}>
      { children }
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within NotificationProvider.");
  return context;
}
