import ProfileForm from "../components/ProfileForm";
import api from "../helpers/api";
import Loading from "../components/Loading";
import ProfileCard from "../components/ProfileCard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Error from "../components/Error";
import queriesOptions from "../helpers/queries";
import { useAuth } from "../helpers/AuthContext";
import { useState } from "react";

const Profile = () => {
  const queryClient = useQueryClient();
  const { user, prefetchQueries } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const profileQuery = useQuery({...queriesOptions.profile, enabled: user.hasProfile});
  const profile = profileQuery.data;

  const deleteProfileMutation = useMutation({
    mutationFn: () => api.delete('profile/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile']});
      prefetchQueries();
    },
  })

  if (profileQuery.isLoading) {
    return <Loading />;
  } if (profileQuery.isError) {
    return <Error />
  }  
  if (!user.hasProfile) return <ProfileForm />;

  if (isEditing)
    return <ProfileForm profile={profile} onCancel={() => setIsEditing(false)} />;

  return (
    <>
      <p><b>My profile</b></p>
      <ProfileCard profile={profile} />
      <button onClick={() => setIsEditing(true)}>Edit</button>
      <button onClick={() => deleteProfileMutation.mutate()}>Delete</button>
    </>
  );
}
 
export default Profile;
