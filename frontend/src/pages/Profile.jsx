import ProfileForm from "../components/ProfileForm";
import Loading from "../components/Loading";
import ProfileCard from "../components/ProfileCard";
import { useQuery } from "@tanstack/react-query";
import Error from "../components/Error";
import queriesOptions from "../helpers/queries";
import { useAuth } from "../helpers/AuthContext";
import { useState } from "react";

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const profileQuery = useQuery({...queriesOptions.profile, enabled: user.hasProfile});
  const profile = profileQuery.data;

  if (profileQuery.isLoading)
    return <Loading />;
  if (profileQuery.isError)
    return <Error />;
  if (!user.hasProfile)
    return <ProfileForm />;

  if (isEditing)
    return <ProfileForm profile={profile} onCancel={() => setIsEditing(false)} />;

  return (
    <>
      <p><b>My profile</b></p>
      <ProfileCard profile={profile} />
      <button onClick={() => setIsEditing(true)}>Edit</button>
    </>
  );
}
 
export default Profile;
