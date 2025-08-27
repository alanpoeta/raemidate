import ProfileForm from "./ProfileForm";
import api from "../api";
import Loading from "./helpers/Loading";
import ProfileCard from "./ProfileCard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Error from "./helpers/Error";
import queryOptions from "../queries";

const Profile = () => {
  const queryClient = useQueryClient();

  const profileQuery = useQuery(queryOptions.profile);
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
