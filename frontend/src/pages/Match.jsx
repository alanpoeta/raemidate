import { useQuery } from "@tanstack/react-query";
import Loading from "../helpers/Loading";
import Error from "../helpers/Error";
import queriesOptions from "../queries";
import { Link } from "react-router-dom";
import React from "react";

const Match = () => {
  const { data: matches, isLoading, isError } = useQuery(queriesOptions.match)

  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  if (matches.length === 0) return <p>No matches.</p>;

  return (
    matches.map(({profile, unread_count}) => (
      <React.Fragment key={profile.user}>
        <Link to={`/message/${profile.user}`}>{profile.first_name} {profile.last_name}</Link>
        <p>{unread_count} Notifications</p>
        <br />
      </React.Fragment>
    ))
  );
}
 
export default Match;
