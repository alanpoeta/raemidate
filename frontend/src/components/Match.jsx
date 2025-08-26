import { useQuery } from "@tanstack/react-query";
import api from "../api";
import Loading from "./helpers/Loading";
import Error from "./helpers/Error";
import ProfileCard from "./ProfileCard";

const Match = () => {
  const { data: profiles, isLoading, isError } = useQuery({
    queryKey: ["match"],
    queryFn: () => api.get('match/').then(res => res.data),
    refetchInterval: 30_000
  })

  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  if (profiles.length === 0) return <p>No matches.</p>;

  return (
    profiles.map(profile => <ProfileCard profile={profile} key={profile.user}/>)
  );
}
 
export default Match;
