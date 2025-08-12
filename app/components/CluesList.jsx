function CluesList({ clues }) {
  return (
    <div>
      <h4>Across</h4>
      <ul>
        {clues.across.map((c) => <li key={c.number}>{c.number}. {c.clue}</li>)}
      </ul>
      <h4>Down</h4>
      <ul>
        {clues.down.map((c) => <li key={c.number}>{c.number}. {c.clue}</li>)}
      </ul>
    </div>
  );
}

export default CluesList;
