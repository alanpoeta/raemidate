import ProfileForm from "../components/ProfileForm";
import api from "../helpers/api";
import Loading from "../components/Loading";
import ProfileCard from "../components/ProfileCard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Error from "../components/Error";
import queriesOptions from "../helpers/queries";
import { useAuth } from "../helpers/AuthContext";

const Profile = () => {
  const queryClient = useQueryClient();
  const { user, setUser, prefetchQueries } = useAuth();

  const profileQuery = useQuery(queriesOptions.profile);
  const profile = profileQuery.data;

  const deleteProfileMutation = useMutation({
    mutationFn: () => api.delete('profile/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile']});
      prefetchQueries();
      setUser(user => {
        const newUser = {
          ...user,
          hasProfile: false
        }
        localStorage.setItem('user', JSON.stringify(newUser));

        return newUser
      });
    },
  })

  if (profileQuery.isLoading) {
    return <Loading />;
  } if (profileQuery.isError) {
    return <Error />
  }  
  if (!user.hasProfile) return <ProfileForm />;

  return (
    <>
      <p><b>My profile</b></p>
      <ProfileCard profile={profile} />
      <button onClick={() => deleteProfileMutation.mutate()}>Delete</button>
    </>
  );
}
 
export default Profile;
