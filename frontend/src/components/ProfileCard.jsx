import { desnakify } from "../helpers";

const ProfileCard = ({ profile }) => {
  return (
    <section>
      {Object.keys(profile).map(key => {
        if (key !== "photos" && key !== "username") {
          return <p key={key}><b>{desnakify(key)}</b>: {profile[key]}</p>;
        }
      })}
      <p>Pictures: </p>
      {profile.photos.map(photo => (
        <img
          key={photo.id}
          src={`data:image/jpeg;base64,${photo.blob}`}
          alt="profile"
          height="300px"
        />
      ))}
    </section>
  );
}
 
export default ProfileCard;
