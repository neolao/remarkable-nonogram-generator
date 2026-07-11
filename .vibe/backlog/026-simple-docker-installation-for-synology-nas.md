---
status: todo
---
# Simple Docker Installation for Synology NAS

## Description
Package the web app as a Docker image so it can be deployed on a Synology NAS with minimal setup, instead of requiring a manual Node.js install and build. This should work both from the command line (`docker run`/`docker compose`) and from Synology's Container Manager (DSM's Docker UI), and must persist saved nonograms and reMarkable pairing credentials across container restarts and image updates.

## Acceptance Criteria
- [ ] A single Docker image builds the app and runs it with one command (`docker run` or `docker compose up`), with no manual build step required on the NAS
- [ ] Saved nonograms and reMarkable Cloud credentials survive a container restart or image update, via a mounted volume
- [ ] The listen port is configurable (matching the existing `PORT` env var) so it can be mapped to any free port on the NAS
- [ ] Setup steps are documented clearly enough for a user to deploy the container through Synology's Container Manager UI, not just the CLI

## Notes
Needs a `Dockerfile` and an example `docker-compose.yml`. The mounted volume must cover the file-based nonogram store and the file-based reMarkable credential store (`~/.config/remarkable-nonogram-generator/` by default per [[remarkable-cloud]]/[[nonogram-persistence]] — confirm exact paths before implementing). Open question: which DSM/Container Manager version(s) to target, since the Docker UI has changed name and layout across DSM releases.
