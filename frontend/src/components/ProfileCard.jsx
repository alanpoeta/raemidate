import { useState } from "react";
import { desnakify } from "../helpers/helpers";

const ProfileCard = ({ profile }) => {
  const [iPhoto, setIPhoto] = useState(0);
  const photo = profile.photos[iPhoto];
  const nPhotos = profile.photos.length;
  return (
    <section>
      {Object.keys(profile).map(key => {
        if (!["photos", "user"].includes(key))
          return <p key={key}><b>{desnakify(key)}</b>: {profile[key]}</p>;
      })}
      <p>Pictures: </p>
      <img
        key={photo.id}
        src={`data:image/jpeg;base64,${photo.blob}`}
        alt="profile"
        height="300px"
      />
      {nPhotos > 1 && <>
        <br />
        <button onClick={() => setIPhoto(i => ((i - 1 + nPhotos) % nPhotos))}>Previous photo</button>
        <button onClick={() => setIPhoto(i => (i + 1 + nPhotos) % nPhotos)}>Next photo</button>
      </>}
      
    </section>
  );
}
 
export default ProfileCard;
