# Election Simulator

## Usage
To load up the simulator:
```
npm install
npm run dev
```

Upload a CSV of the following form, where the header is the candidate names, and the data rows are (partially filled) preferential ballots:
```csv
Candidate 1, Candidate 2, Candidate 3
,1,
1,2,
2,3,1
```
The simulator assumes the data is well-formed. It may crash without error if there is malformed data.

Click "Simulate Next Round" to visualise the round, and keep doing so until a winner is found (a candidate gets >50% votes).

To manually eliminate a candidate, click on their name. You may want to do so if:
- There are multiple seats for one role, and you want to rerun excluding winners of previous seats
- One of the candidates won another role that they preferenced higher

## Generating the CSVs
There is a script `extract.py` that takes in the file name of a Qualtrics export CSV and creates a directory of the same name containing separate CSVs for each role to be used with the simulator. For example:
```
python3 extract.py ~/Downloads/DevSoc_2025_AGM_Election_September_29_2024_12.26.csv
```
will result in
```
DevSoc_2025_AGM_Election_September_29_2024_12.26/
├── Administrative Officer.csv
├── Co-President (Non-Female).csv
├── Co-President (Non-Male).csv
├── Vice-President (Externals).csv
├── Vice-President (Internals) & Welfare Officer.csv
├── Vice-President (Project Operations).csv
└── Vice-President (Projects).csv
```

Note that this assumes the headers are written in the format used by the 2025 DevSoc Election:
```
... position of [ROLE]. If ... <strong>[CANDIDATE NAME]</strong> ...
```
If the format varies, you will need to edit the `TITLE_PATTERN` regex in `extract.py`