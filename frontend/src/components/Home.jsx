import api from "../api";
import ProfileCard from "./ProfileCard";
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Loading from "./Loading";
import Error from "./Error";


const Home = () => {
  const queryClient = useQueryClient();

  const fetchProfiles = async () => (await api.get('swipe/')).data

  const { data: profiles, isError, isFetching } = useQuery({
    queryKey: ['swipe'],
    queryFn: fetchProfiles,
    staleTime: Infinity,
  });
  
  if (isFetching) {
    return <Loading />;
  } else if (isError) {
    return <Error />;
  }

  const swipe = () => {
    // if (profiles.length === 9) queryClient.prefetchQuery({
    //   queryKey: ['swipe'],
    //   queryFn: fetchProfiles,
    //   staleTime: 0,
    // });
    if (profiles.length === 1) queryClient.invalidateQueries({ queryKey: ['swipe'] });
    else queryClient.setQueryData(["swipe"], profiles => profiles.slice(1));
  }
  
  return (
    <>
      <ProfileCard profile={profiles[0]} />
      <button onClick={swipe}>Left</button>
      <button onClick={swipe}>Right</button>
    </>
  );
}
 
export default Home;
