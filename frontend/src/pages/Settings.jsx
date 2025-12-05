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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Settings</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Username</p>
          <p className="text-gray-800 font-medium">{user.username}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Email</p>
          <p className="text-gray-800 font-medium">{user.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        {!confirmDelete ? (
          <button 
            onClick={() => setConfirmDelete(true)}
            className="w-full py-3 border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="text-red-800 font-medium mb-3 text-sm">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 bg-white text-gray-600 rounded-lg font-semibold border border-gray-200"
              >
                Cancel
              </button>
              <button
                disabled={deleteUserMutation.isPending}
                onClick={() => deleteUserMutation.mutate()}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50"
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
