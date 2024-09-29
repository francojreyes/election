import csv
import os
import re
import sys

input_file = sys.argv[1]
output_dir = input_file.split("/")[-1].replace(".csv", "")
os.makedirs(output_dir, exist_ok=True)

# Read CSV
with open(input_file, "r") as f:
    reader = csv.reader(f)
    next(reader)
    header = next(reader)
    next(reader)
    data = list(reader)

# Remove irrelevant columns
header = header[10:-1]
for i in range(len(data)):
    data[i] =  data[i][10:-1]

# Dict of role name: [start, end, ...names]
roles: dict[str, list] = {}
for (idx, title) in enumerate(header):
    match = re.findall(r"position of (.*)\. If.*<strong>(.*)</strong>", title,)
    role, candidate = map(lambda s: s.strip(), match[0])
    if role in roles:
        roles[role][1] += 1
        roles[role].append(candidate)
    else:
        roles[role] = [idx, idx+1, candidate]

# Create the CSVs
for role in roles:
    with open(os.path.join(output_dir, role + ".csv"), "w") as f:
        writer = csv.writer(f)
        writer.writerow(roles[role][2:])
        for row in data:
            writer.writerow(row[roles[role][0]:roles[role][1]])
