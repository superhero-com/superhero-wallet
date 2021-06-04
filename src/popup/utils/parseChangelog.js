export default async () => {
  const changelogUrl = (await (await fetch(
    'https://api.github.com/repos/aeternity/superhero-wallet/contents/CHANGELOG.md?ref=master',
    { headers: { 'Content-Type': 'application/json' } },
  )).json()).git_url;
  const changelogFull = atob((await (await fetch(changelogUrl)).json()).content);
  const versionsChangelog = await [...changelogFull.matchAll(/\[(\d+\.\d+\.\d+)\].*?\n(.*?)(?=\[\d+\.\d+\.\d+\])/sg)].slice(0, 2)
    .reduce(async (vcl, [, version, versionChangelog]) => ({
      ...await vcl,
      [version]: await [...versionChangelog.matchAll(/\s+### ([\w ]+)\s+(.*?)(?=\s{2,})/sg)]
        .reduce(async (td, [, topic, details]) => ({
          ...await td,
          [topic]: await Promise.all([...details.matchAll(/\[[\w\d]+\](\(.*?)\)/sg)]
            .map(async ([, commit]) => {
              const apiUrl = `https://api.github.com/repos/aeternity/superhero-wallet/commits/${commit.substr(commit.lastIndexOf('/') + 1)}/pulls`;
              const prs = (await (await fetch(apiUrl, { headers: { 'Content-Type': 'application/json', Accept: 'application/vnd.github.groot-preview+json' } }))
                .json()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
              let issuesImgs = [];
              const otherImgs = [...[...prs[0].body.matchAll(/\[image\]\((.*?)\)/g)].map((i) => i[1]), ...[...prs[0].body.matchAll(/https:.*?\.(png|jpg|gif)/g)].map((i) => i[0])];
              if (topic !== 'Features') {
                const closesIssues = [...prs[0].body.matchAll(/[Closes|closes|Close|close|Fixes|fixes|Fix|fix]\s+#(\d+)/g)].map(([, issue]) => issue);
                const issues = await Promise.all(closesIssues.map(async (i) => (await fetch(`https://api.github.com/repos/aeternity/superhero-wallet/issues/${i}`, { headers: { 'Content-Type': 'application/json' } })).json()));
                issuesImgs = issues.reduce((iss, i) => [...iss, ...i.body.matchAll(/<img.*>/g)], []);
              }
              const allImgs = [...[...prs[0].body.matchAll(/<img.*>/g), ...issuesImgs].map((i) => i[0].match(/src="(.*)"/)[1]), ...otherImgs];
              const scannedImgs = [];
              allImgs.forEach((i) => !scannedImgs.includes(i) && scannedImgs.push(i));
              return { [prs[0].title]: scannedImgs };
            })),
        }), Promise.resolve({})),
    }), Promise.resolve({}));

  const imgsObj = versionsChangelog;
  const prs = [];
  const r = Object.keys(imgsObj).reduce((k, v) => ({ ...k, [v]: {} }), {});
  Object.keys(imgsObj).forEach((v) => ['Features', 'Bug Fixes', 'Style', 'Maintenance'].forEach((t) => imgsObj[v][t] && Object.assign(r[v],
    {
      [t]: imgsObj[v][t]
        .filter((pr) => Object.values(pr)[0].length)
        .filter((pr) => {
          if (prs.includes(Object.keys(pr)[0])) return false;
          prs.push(Object.keys(pr)[0]);
          return true;
        }),
    })));
};
