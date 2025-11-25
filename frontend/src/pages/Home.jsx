import ProfileCard from "../components/ProfileCard";
import { useQuery, useMutation } from '@tanstack/react-query'
import Loading from "../components/Loading";
import Error from "../components/Error";
import queryOptions from "../helpers/queries";
import useWebSocket from "../helpers/useWebSocket";
import { useEffect, useState } from "react";
import api from "../helpers/api";

const Home = ({ iProfile, setIProfile }) => {
  const swipeQuery = useQuery({
    ...queryOptions.swipe,
    refetchInterval: (query) => {
      return query.state.data?.length === 0 ? 20000 : false;
    },
  });
  const profiles = swipeQuery.data;
  const { socketRef, isOpen: socketIsOpen } = useWebSocket("swipe/");
  const isLoading = !socketIsOpen || swipeQuery.isFetching;

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

  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");
  const reportReasons = ["Harassment/Inappropriate behavior", "Incorrect age", "Impersonation"];
  const reportMutation = useMutation({
    mutationFn: () => api.post(`report-profile/${profiles[iProfile].user}/`, { reason }),
    onSuccess: () => {
      setShowReport(false);
      setReason("");
      alert("Report submitted.");
    },
  });

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
  
  if (!profiles?.length) return <p>No profiles left to show. Checking for new profiles...</p>;

  if (showReport)
    return (
      <article>
        <h4>Report Profile</h4>
        <p>Select a reason. This profile will be reviewed by staff.</p>
        <select value={reason} onChange={e => setReason(e.target.value)}>
          <option value="">-- Reason --</option>
          {reportReasons.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          disabled={!reason || reportMutation.isLoading}
          onClick={() => reportMutation.mutate()}
        >
          Confirm Report
        </button>
        <button
          onClick={() => {
            setShowReport(false);
            setReason("");
          }}
        >
          Cancel
        </button>
      </article>
    );
  
  return (
    <>
      <ProfileCard profile={profiles[iProfile]} />
      <button onClick={() => swipe("left")}>Left</button>
      <button onClick={() => swipe("right")}>Right</button>
      <button onClick={() => setShowReport(true)}>Report</button>
    </>
  );
}
 
export default Home;
