import api from "../api";
import ProfileCard from "./ProfileCard";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Loading from "./helpers/Loading";
import Error from "./helpers/Error";
import { useEffect, useRef } from "react";
import { useAuth } from "./helpers/authContext";
import queryOptions from "../queries";

const Home = () => {
  const queryClient = useQueryClient();
  const { setCleanupFn, isLoading } = useAuth();

  const swipeQuery = useQuery(queryOptions.swipe);
  const profiles = swipeQuery.data;
  
  const leftSwiped = useRef([]);
  const rightSwiped = useRef([]);
  
  const swipeMutation = useMutation({
    mutationFn: () => {
      if (!leftSwiped.current.length && !rightSwiped.current.length) {
        return Promise.resolve();
      }
      return api.post("swipe/", [leftSwiped.current, rightSwiped.current]);
    },
    onSuccess: (_, unmounting=false) => {
      leftSwiped.current = [];
      rightSwiped.current = [];
      if (!unmounting) queryClient.invalidateQueries({ queryKey: ['swipe'] });
    }
  });
  
  const swipe = (direction) => {
    const id = profiles[0].user;
    if (direction == "left") leftSwiped.current.push(id);
    else rightSwiped.current.push(id);
    if (profiles.length !== 1) queryClient.setQueryData(["swipe"], profiles => profiles.slice(1));
    else swipeMutation.mutate();
  }

  useEffect(() => {
    setCleanupFn(() => async () => await swipeMutation.mutateAsync());
    window.addEventListener("beforeunload", () => swipeMutation.mutate(true));
    return () => {
      if (!isLoading) swipeMutation.mutate(true);
      window.removeEventListener("beforeunload", () => swipeMutation.mutate(true));
    };
  }, []);
  
  if (swipeQuery.isLoading) {
    return <Loading />;
  } else if (swipeQuery.isError) {
    return <Error />;
  }

  if (profiles.length == 0) return <p>No profiles left to show.</p>
  
  return (
    <>
      <ProfileCard profile={profiles[0]} />
      <button onClick={() => swipe("left")}>Left</button>
      <button onClick={() => swipe("right")}>Right</button>
    </>
  );
}
 
export default Home;
