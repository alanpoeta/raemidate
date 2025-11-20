import { useMutation } from "@tanstack/react-query";
import api from "../helpers/api";
import { useAuth } from "../helpers/AuthContext";

const Settings = () => {
  const { logout } = useAuth();

  const deleteUserMutation = useMutation({
    mutationFn: () => api.delete('user/'),
    onSuccess: logout,
  });

  return (
    <div>
      <h1>Settings</h1>
      <button
        disabled={deleteUserMutation.isLoading}
        onClick={() => deleteUserMutation.mutate()}
      >
        {deleteUserMutation.isLoading ? 'Deleting...' : 'Delete Account'}
      </button>
    </div>
  );
};

export default Settings;
