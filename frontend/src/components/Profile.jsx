import ProfileForm from "./ProfileForm";
import api from "../api";
import Loading from "./helpers/Loading";
import ProfileCard from "./ProfileCard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Error from "./helpers/Error";

const Profile = () => {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('profile/').then(res => res.data),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 0
  });
  const profile = profileQuery.data;

  const deleteProfileMutation = useMutation({
    mutationFn: () => api.delete('profile/'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile']}),
  })

  if (profileQuery.isLoading) {
    return <Loading />;
  } if (profileQuery.isError) {
    if (profileQuery.error.status === 404) return <ProfileForm />;
    return <Error />
  }  

  return (
    <>
      <p><b>My profile</b></p>
      <ProfileCard profile={profile} />
      <button onClick={() => deleteProfileMutation.mutate()}>Delete</button>
    </>
  );
}
 
export default Profile;
