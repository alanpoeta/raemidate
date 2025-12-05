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

  if (profileQuery.isLoading) return <Loading />;
  if (profileQuery.isError) return <Error />;
  if (!user.hasProfile) return <ProfileForm />;

  if (isEditing)
    return <ProfileForm profile={profile} onCancel={() => setIsEditing(false)} />;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative overflow-hidden bg-gray-100">
         <ProfileCard profile={profile} />
         
         {/* Edit Button Overlay */}
         <div className="absolute top-4 right-4 z-20">
           <button 
             onClick={() => setIsEditing(true)}
             className="bg-white/90 backdrop-blur text-gray-800 px-4 py-2 rounded-full font-bold shadow-lg text-sm border border-white/50"
           >
             Edit Profile
           </button>
         </div>
      </div>
    </div>
  );
}
 
export default Profile;
