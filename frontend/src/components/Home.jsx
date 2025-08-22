import api from "../api";
import ProfileCard from "./ProfileCard";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Loading from "./Loading";
import Error from "./Error";
import { useEffect, useRef } from "react";


const Home = () => {
  const queryClient = useQueryClient();

  const fetchProfiles = async () => {
    const data = (await api.get('swipe/')).data;
    return data;
  };
  
  const swipeQuery = useQuery({
    queryKey: ['swipe'],
    queryFn: fetchProfiles,
    staleTime: Infinity,
  });

  const profiles = swipeQuery.data;
  
  const leftSwiped = useRef([]);
  const rightSwiped = useRef([]);
  
  const swipeMutation = useMutation({
    mutationFn: () => {
      if (!leftSwiped.current.length && !rightSwiped.current.length) return Promise.resolve();
      const res = api.post("swipe/", [leftSwiped.current, rightSwiped.current]);
      leftSwiped.current = [];
      rightSwiped.current = [];
      queryClient.invalidateQueries({ queryKey: ['swipe'] });
      return res;
    }
  });
  
  const swipe = (direction) => {
    // if (profiles.length === 9) queryClient.prefetchQuery({
    //   queryKey: ['swipe'],
    //   queryFn: fetchProfiles,
    //   staleTime: 0,
    // });
    const id = profiles[0].user;
    if (direction == "left") leftSwiped.current.push(id);
    else rightSwiped.current.push(id);
    if (profiles.length !== 1) queryClient.setQueryData(["swipe"], profiles => profiles.slice(1));
    else {
      swipeMutation.mutate();
    };
  }

  useEffect(() => {
    window.addEventListener("beforeunload", swipeMutation.mutate)
    return () => {
      swipeMutation.mutate();
      window.removeEventListener("beforeunload", swipeMutation.mutate);
    };
  }, []);
  
  if (swipeQuery.isFetching) {
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
