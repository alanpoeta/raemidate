import { useState } from "react";
import { desnakify } from "../helpers/helpers";

const ProfileCard = ({ profile }) => {
  const [iPhoto, setIPhoto] = useState(0);
  const nPhotos = profile.photos?.length || 0;
  
  if (!profile) return null;

  const photo = profile.photos[iPhoto];

  // Helper to show age if birth_date exists
  const getAge = (dateString) => {
    if (!dateString) return "";
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const nextPhoto = () => setIPhoto(i => (i + 1 + nPhotos) % nPhotos);
  const prevPhoto = () => setIPhoto(i => (i - 1 + nPhotos) % nPhotos);

  return (
    <div className="relative w-full h-full bg-black sm:rounded-xl overflow-hidden shadow-lg select-none">
      {/* Photo Layer */}
      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
        {photo ? (
          <img
            key={photo.id}
            src={`data:image/jpeg;base64,${photo.blob}`}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white">No Photos</div>
        )}
      </div>

      {/* Tap Zones for Navigation */}
      {nPhotos > 1 && (
        <>
          <div className="absolute inset-y-0 left-0 w-1/2 z-10" onClick={prevPhoto}></div>
          <div className="absolute inset-y-0 right-0 w-1/2 z-10" onClick={nextPhoto}></div>
          
          {/* Photo Indicator Bars */}
          <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
            {profile.photos.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 flex-1 rounded-full drop-shadow-md ${idx === iPhoto ? 'bg-white' : 'bg-white/40'}`}
              ></div>
            ))}
          </div>
        </>
      )}

      {/* Info Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10 flex flex-col justify-end p-6">
        <div className="text-white mb-16">
          <div className="flex items-baseline gap-2 mb-1">
            <h2 className="text-3xl font-bold">{profile.first_name} {profile.last_name}</h2>
            <span className="text-xl font-medium opacity-90">{getAge(profile.birth_date)}</span>
          </div>
          
          <div className="text-sm font-medium opacity-80 mb-2">
            {profile.gender && desnakify(profile.gender)}
          </div>

          {profile.bio && (
            <p className="text-gray-200 text-sm line-clamp-3 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Detailed Info for own profile view mostly */}
          <div className="mt-4 space-y-1 text-xs text-gray-400 hidden">
            {/* Kept hidden logic for public view, but structure remains if needed */}
          </div>
        </div>
      </div>
    </div>
  );
}
 
export default ProfileCard;
