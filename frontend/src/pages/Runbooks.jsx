import { useState } from "react";
import usePolling from "../hooks/usePolling.js";
import { RunbookAPI } from "../services/api";
import RunbookCard from "../components/dr/RunbookCard.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

export default function Runbooks() {
  const [selected, setSelected] = useState(1);
  const list = usePolling(RunbookAPI.list, 0);
  const detail = usePolling(() => RunbookAPI.get(selected), 0, [selected]);

  return (
    <>
      <div className="page-head"><h2>DR runbooks (12)</h2></div>
      {list.loading && <LoadingSpinner />}
      {list.error && <p className="alert alert-bad">{list.error}</p>}
      <div className="split">
        <div className="runbook-list">
          {list.data?.map((rb) => <RunbookCard key={rb.number} runbook={rb} active={rb.number === selected} onSelect={setSelected} />)}
        </div>
        <article className="card runbook-detail">
          {detail.loading && <LoadingSpinner />}
          {detail.data && (
            <>
              <h3>#{detail.data.number} {detail.data.title}</h3>
              <pre className="markdown">{detail.data.content}</pre>
            </>
          )}
        </article>
      </div>
    </>
  );
}
