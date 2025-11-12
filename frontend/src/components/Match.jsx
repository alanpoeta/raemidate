import { useQuery } from "@tanstack/react-query";
import Loading from "./helpers/Loading";
import Error from "./helpers/Error";
import ProfileCard from "./ProfileCard";
import queryOptions from "../queries";

const Match = () => {
  const { data: profiles, isLoading, isError } = useQuery(queriesOptions.match)

  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  if (profiles.length === 0) return <p>No matches.</p>;

  return (
    profiles.map(profile => <ProfileCard profile={profile} key={profile.user}/>)
  );
}
 
export default Match;
