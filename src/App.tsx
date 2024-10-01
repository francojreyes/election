import "./App.css";
import cloneDeep from "lodash.clonedeep";
import React from "react";

const NONE = -1;
const WIDTH = 10;
const COLOURS = ["#3B9EFF", "#0090FF", "#2870BD", "#2870BD", "#205D9E", "#104D87", "#004074", "#003362"];

type InitialData = {
  names: string[];
  votes: number[][];
}

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const readCsv = (csv: string): InitialData => {
  const lines = csv.split(/[\r\n]+/);
  const names = lines[0].split(",");

  const votes = [];
  for (let i = 1; i < lines.length - 1; i++) {
    const prefs = lines[i].split(",");
    const vote = [];
    for (let j = 0; j < names.length; j++) {
      if (prefs[j] !== "") vote.push(j);
    }
    vote.sort((a, b) => +prefs[a] - +prefs[b]);
    while (vote.length < names.length) vote.push(NONE);
    votes.push(vote);
  }

  return { names, votes };
};

const compareVotes = (votesA: number[][], votesB: number[][]) => {
  const lengths = [...votesA.map(v => v.length), ...votesB.map(v => v.length)];
  const minLen = Math.min(...lengths);
  const maxLen = Math.max(...lengths);

  for (let i = minLen; i <= maxLen; i++) {
    const countA = votesA.filter(v => v.length >= i).length;
    const countB = votesB.filter(v => v.length >= i).length;
    if (countA < countB) return -1;
    else if (countA > countB) return 1;
  }

  return 0;
};

function App() {
  const [init, setInit] = React.useState<InitialData>({ names: [], votes: [] });
  const [distribution, setDistribution] = React.useState<number[][][]>([]);
  const [eliminated, setEliminated] = React.useState<number[]>([]);
  const [midRound, setMidRound] = React.useState(false);
  const [speed, setSpeed] = React.useState(150);
  const n = init.names.length;

  const handleUploadCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const { files } = e.target;
    if (!files) return;

    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = readerEvent => {
      if (!readerEvent.target?.result) return;

      const newInit = readCsv(readerEvent.target.result as string);
      setInit(newInit);
      setDistribution(newInit.names.map(() => []));
      setEliminated([]);
    };
  };

  const initialiseRound = async () => {
    for (let i = 0; i < init.votes.length; i++) {
      const vote = cloneDeep(init.votes[i]);
      while (vote.length && eliminated.includes(vote[0])) {
        vote.shift();
      }

      if (vote.length && vote[0] != NONE) {
        setDistribution(distribution => {
          const newDistribution = cloneDeep(distribution);
          newDistribution[vote[0]].push(vote);
          return newDistribution;
        });

        await sleep(speed);
      }
    }
  };

  const eliminate = async (person: number) => {
    const eliminatedVotes = distribution[person].length;
    for (let i = 0; i < eliminatedVotes; i++) {
      setDistribution(distribution => {
        const newDistribution = cloneDeep(distribution);
        const vote = newDistribution[person].shift()!;

        while (vote.length && (vote[0] == person || eliminated.includes(vote[0]))) {
          vote.shift();
        }
        if (vote.length && vote[0] != NONE) {
          newDistribution[vote[0]].push(vote);
        }
        return newDistribution;
      });

      await sleep(speed);
    }

    setEliminated([person, ...eliminated]);
  };

  const started = distribution.some(votes => votes.length !== 0);
  const handleStartRound = async () => {
    setMidRound(true);

    if (!started) {
      await initialiseRound();
    } else {
      let loser = NONE;
      for (let i = 0; i < n; i++) {
        if (eliminated.includes(i)) continue;
        if (loser == NONE || compareVotes(distribution[i], distribution[loser]) <= 0) {
          loser = i;
        }
      }

      await eliminate(loser);
    }

    setMidRound(false);
  };

  const ranked = [...Array(n).keys()]
    .filter((i) => !started || !eliminated.includes(i))
    .sort((a, b) => compareVotes(distribution[b], distribution[a]));

  // Look for a winner
  let winner = NONE;
  if (started && !midRound) {
    let count = 0;
    for (let i = 0; i < n; i++) {
      count += distribution[i].length;
    }
    if (distribution[ranked[0]].length > count / 2) {
      winner = ranked[0];
    }
  }

  const handleClick = async (person: number) => {
    if (midRound || winner !== NONE) return;
    setMidRound(true);
    await eliminate(person);
    setMidRound(false);
  };

  return (
    <div style={{ display: "flex", margin: "2rem", flexDirection: "column", gap: "3rem", width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem" }}>
          <label htmlFor="file">Election Data CSV</label>
          <input
            id="file"
            type="file"
            accept="text/csv"
            disabled={midRound}
            onChange={handleUploadCsv}
            style={{ width: 400 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem" }}>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
            <label htmlFor="speed" style={{ fontSize: "small" }}>Speed (ms)</label>
            <input
              id="speed"
              type="number"
              min="10"
              max="1000"
              value={speed}
              onChange={e => setSpeed(e.target.valueAsNumber)}
              disabled={midRound}
            />
          </div>
          <button onClick={handleStartRound} disabled={midRound || winner !== NONE}>Simulate Next Round</button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {distribution.map((votes, idx) =>
          <div
            key={idx} style={{
            display: "flex",
            flexDirection: "row",
            color:
              idx === winner
                ? "#FFCA16"
                : eliminated.includes(idx)
                  ? "rgb(0,0,0,0)"
                  : "initial"
          }}
          >
            <div style={{ width: 50 }}>
              {idx === winner
                ? "👑"
                : eliminated.includes(idx)
                  ? ""
                  : `#${ranked.indexOf(idx) + 1}`
              }
            </div>
            <div style={{ width: 250 }} onClick={() => handleClick(idx)}>{init.names[idx]}</div>
            <div style={{ display: "flex", flexDirection: "row" }}>
              {votes.sort((a, b) => b.length - a.length).map((vote, idx) =>
                <div
                  key={idx} style={{
                  backgroundColor: COLOURS[n - vote.length],
                  width: WIDTH
                }}
                />
              )}
              {votes.length !== 0 &&
                <div style={{ marginLeft: "1rem", color: "initial" }}>{votes.length}</div>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
