import { useEffect, useState } from "react";
import api from "../api";
import ProfileCard from "./ProfileCard";

const Home = () => {
  const [profiles, setProfiles] = useState({});

  const left = () => {
    setProfiles(prev => prev.slice(1));
  }

  useEffect(() => {
    api.get('swipe/')
    .then(data => {
      console.log(data.data);
      setProfiles(data.data);
    });
  }, []);

  return (
    <>
      {profiles.length > 0 &&
        <ProfileCard profile={profiles[0]} />
      }
      <button onClick={left}>Left</button>
      <button onClick={left}>Right</button>
    </>
  );
}
 
export default Home;
