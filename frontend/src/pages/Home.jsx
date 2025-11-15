import ProfileCard from "../components/ProfileCard";
import { useQuery } from '@tanstack/react-query'
import Loading from "../helpers/Loading";
import Error from "../helpers/Error";
import queryOptions from "../queries";
import useWebSocket from "../helpers/useWebSocket";
import { useEffect } from "react";

const Home = ({ iProfile, setIProfile }) => {
  const swipeQuery = useQuery({
    ...queryOptions.swipe,
    refetchInterval: (query) => {
      return query.state.data?.length === 0 ? 20000 : false;
    },
  });
  const profiles = swipeQuery.data;
  const { socketRef, isOpen: socketIsOpen } = useWebSocket("swipe/");
  const isLoading = !socketIsOpen || swipeQuery.isPending;

  const swipe = async (direction) => {
    if (!socketIsOpen) return;

    const id = profiles[iProfile].user
    socketRef.current.send(JSON.stringify({ id, direction }));

    if (iProfile >= profiles.length - 1) {
      await swipeQuery.refetch();
      setIProfile(0);
      return;
    }
    setIProfile(i => i + 1);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (
        e.repeat
        || e.target 
        && (
          e.target.tagName === 'INPUT'
          || e.target.tagName === 'TEXTAREA'
          || e.target.isContentEditable
        )
        || !profiles?.length
      ) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        swipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        swipe('right');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profiles, iProfile, swipe]);
  
  if (swipeQuery.isError) return <Error />;
  if (isLoading) return <Loading />;
  
  if (!profiles?.length) return <p>No profiles left to show. Checking for new profiles...</p>
  
  return (
    <>
      <ProfileCard profile={profiles[iProfile]} />
      <button onClick={() => swipe("left")}>Left</button>
      <button onClick={() => swipe("right")}>Right</button>
    </>
  );
}
 
export default Home;
