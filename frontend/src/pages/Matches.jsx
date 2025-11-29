import { useQuery } from "@tanstack/react-query";
import Loading from "../components/Loading";
import Error from "../components/Error";
import queriesOptions from "../helpers/queries";
import { Link } from "react-router-dom";
import React from "react";

const Matches = () => {
  const { data: matches, isLoading, isError } = useQuery(queriesOptions.matches);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  if (matches.length === 0) return <p>No matches.</p>;

  return (
    matches.map(({profile, unread_count}) => (
      <React.Fragment key={profile.user}>
        <Link to={`/message/${profile.user}`}>{profile.first_name} {profile.last_name}</Link>
        {unread_count !== 0 && <p>{unread_count} Notifications</p>}
        <br />
      </React.Fragment>
    ))
  );
}
 
export default Matches;
