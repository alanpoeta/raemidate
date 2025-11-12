import { useQuery } from "@tanstack/react-query";
import Loading from "../helpers/Loading";
import Error from "../helpers/Error";
import queriesOptions from "../queries";
import { Link } from "react-router-dom";

const Match = () => {
  const { data: profiles, isLoading, isError } = useQuery(queriesOptions.match)

  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  if (profiles.length === 0) return <p>No matches.</p>;

  return (
    profiles.map(profile => (
      <>
        <Link key={profile.user} to={`/dm/${profile.user}`}>{profile.first_name} {profile.last_name}</Link>
        <br />
      </>
    ))
  );
}
 
export default Match;
