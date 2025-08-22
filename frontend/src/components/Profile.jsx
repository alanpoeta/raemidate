import { useEffect, useState } from "react";
import ProfileForm from "./ProfileForm";
import api from "../api";
import Loading from "./Loading";
import ProfileCard from "./ProfileCard";

const Profile = () => {
  const [hasProfile, setHasProfile] = useState(null);
  const [profile, setProfile] = useState(null);

  const fetchProfile = () => {
    api.get('profile/')
    .then(res => {
      setHasProfile(true);
      setProfile(res.data);
    })
    .catch(error => {
      setHasProfile(false);
    });
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  if (hasProfile === null) {
    return <Loading />;
  } if (!hasProfile) {
    return (
      <ProfileForm fetchProfile={fetchProfile} />
    );
  }

  const deleteProfile = () => {
    api.delete('profile/');
    fetchProfile();
  };

  return (
    <>
      <p><b>My profile</b></p>
      {profile && <ProfileCard profile={profile} />}
      <button onClick={deleteProfile}>Delete</button>
    </>
  );
}
 
export default Profile;
