import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import api from "../helpers/api";
import { useAuth } from "../helpers/AuthContext";

const Settings = () => {
  const { user, logout } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteUserMutation = useMutation({
    mutationFn: () => api.delete('user/'),
    onSuccess: logout,
  });

  return (
    <div>
      <h1>Settings</h1>
      <p>Username: {user.username}</p>
      <p>Email: {user.email}</p>
      {!confirmDelete ? (
        <button onClick={() => setConfirmDelete(true)}>Delete Account</button>
      ) : (
        <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <span>Confirm delete?</span>
          <button
            disabled={deleteUserMutation.isLoading}
            onClick={() => deleteUserMutation.mutate()}
          >
            {deleteUserMutation.isLoading ? "Deleting..." : "Yes, delete"}
          </button>
          <button onClick={() => setConfirmDelete(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Settings;
