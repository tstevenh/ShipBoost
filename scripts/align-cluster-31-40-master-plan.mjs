#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const planPath =
  "/Users/tsth/Coding/shipboost/ShipBoost-Docs/SEO-Plan/Cluster 31-40/cluster-31-40-master-plan.md";

let text = await readFile(planPath, "utf8");

const replacements = [
  [
    `Anchor tools:
- CapCut
- VEED
- Kapwing
- Clipchamp
- InVideo
- Descript
- Canva
- Adobe Express
- Runway
- Riverside`,
    `Anchor tools:
- CapCut
- VEED
- Kapwing
- Clipchamp
- InVideo
- Descript
- Runway
- Canva Video
- Adobe Premiere Pro
- DaVinci Resolve`,
  ],
  [
    `Anchor tools:
- Obsidian
- Evernote
- OneNote
- Notion
- Capacities
- Anytype
- Logseq
- Mem
- Craft
- Reflect`,
    `Anchor tools:
- Obsidian
- Evernote
- Microsoft OneNote
- Notion
- Capacities
- Anytype
- Logseq
- Mem
- Craft
- Reflect`,
  ],
  [
    `Anchor tools:
- GitHub
- GitLab
- Bitbucket
- Gitea
- Codeberg
- SourceHut
- Azure DevOps
- AWS CodeCommit`,
    `Anchor tools:
- GitHub
- GitLab
- Bitbucket
- Gitea
- Codeberg
- SourceHut
- Azure DevOps
- AWS CodeCommit
- Gerrit
- Phorge`,
  ],
  [
    `Anchor tools:
- GitHub
- GitLab
- Bitbucket
- Gitea
- Codeberg
- SourceHut
- Azure DevOps
- AWS CodeCommit
- Gerrit
- Phorge
- Gerrit
- Phorge`,
    `Anchor tools:
- GitHub
- GitLab
- Bitbucket
- Gitea
- Codeberg
- SourceHut
- Azure DevOps
- AWS CodeCommit
- Gerrit
- Phorge`,
  ],
  [
    `Anchor tools:
- Softr
- Airtable
- Firebase
- Supabase
- Bubble
- Glide
- Adalo
- Baserow
- Xano
- Retool
- Appsmith`,
    `Anchor tools:
- Softr
- Firebase
- Airtable
- Supabase
- Bubble
- Glide
- Adalo
- Baserow
- Xano
- Retool`,
  ],
  [
    `Anchor tools:
- Apollo
- Salesloft
- Outreach
- Reply.io
- Instantly
- Lemlist
- Woodpecker
- Smartlead
- Clay
- ZoomInfo
- Lusha`,
    `Anchor tools:
- Apollo
- Salesloft
- Outreach
- Reply.io
- Instantly
- Lemlist
- Woodpecker
- Smartlead
- Clay
- ZoomInfo`,
  ],
  [
    `Anchor tools:
- Wix
- Webflow
- Framer
- Squarespace
- WordPress
- Carrd
- Dorik
- Typedream
- Webstudio
- Duda`,
    `Anchor tools:
- Wix
- Webflow
- WordPress
- Squarespace
- Framer
- Carrd
- Dorik
- Typedream
- Webstudio
- Duda`,
  ],
  [
    `Anchor tools:
- Postman
- Insomnia
- Swagger
- Stoplight
- Bruno
- Hoppscotch
- ReadMe
- Redocly
- Kong Insomnia
- Apidog`,
    `Anchor tools:
- Postman
- Swagger
- Insomnia
- Stoplight
- Bruno
- Hoppscotch
- ReadMe
- Redocly
- Apidog
- Kong Insomnia`,
  ],
];

for (const [from, to] of replacements) {
  if (!text.includes(from) && text.includes(to)) {
    continue;
  }
  if (!text.includes(from)) {
    throw new Error(`Could not find expected block:\n${from}`);
  }
  text = text.replace(from, to);
}

await writeFile(planPath, text);
console.log(JSON.stringify({ planPath, replacements: replacements.length }, null, 2));
