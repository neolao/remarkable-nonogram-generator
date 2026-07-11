# Docker deployment

The app can run as a single Docker container: no Node.js install, no manual
build step. This covers the generic CLI flow and a Synology NAS-specific
walkthrough using Container Manager.

Saved nonograms and the reMarkable Cloud pairing credentials are stored under
`/home/node/.config/remarkable-nonogram-generator` inside the container. Mount
that path to a volume so the data survives container restarts and image
updates.

## Command line

Build the image from the repository root:

```sh
docker build -t remarkable-nonogram-generator .
```

Run it with a persistent volume:

```sh
docker volume create nonogram-data
docker run -d \
  --name remarkable-nonogram-generator \
  -p 4279:4279 \
  -v nonogram-data:/home/node/.config/remarkable-nonogram-generator \
  remarkable-nonogram-generator
```

Open `http://<host>:4279`.

### Building for multiple architectures (optional)

Synology NAS models use either an Intel/AMD or an ARM processor. If you push
the image to a registry so a NAS can pull it directly, build it for both with
[Docker Buildx](https://docs.docker.com/build/building/multi-platform/):

```sh
docker buildx build --platform linux/amd64,linux/arm64 -t <registry>/remarkable-nonogram-generator --push .
```

Building and running the image locally on the NAS itself (see the Container
Manager section below) doesn't need this — it naturally builds for whatever
architecture the NAS has.

To use a different port, set `PORT` and map it accordingly:

```sh
docker run -d \
  --name remarkable-nonogram-generator \
  -e PORT=8080 \
  -p 8080:8080 \
  -v nonogram-data:/home/node/.config/remarkable-nonogram-generator \
  remarkable-nonogram-generator
```

### Docker Compose

A ready-to-use `docker-compose.yml` is included at the repository root:

```sh
docker compose up -d --build
```

Edit the `ports` and `PORT` values in that file to change the listening port.
Data lives in the `nonogram-data` named volume it declares, so
`docker compose down` (without `-v`) keeps your nonograms and reMarkable
pairing intact; `docker compose up -d --build` again picks up right where you
left off, including after pulling a newer image.

## Synology NAS — Container Manager (DSM's Docker UI)

These steps use DSM's **Container Manager** app (the current name for what
used to be called **Docker** in older DSM versions — the underlying workflow
below is the same either way).

1. **Get the image onto the NAS.** Either:
   - Build it on another machine and push it to a registry (Docker Hub, GHCR,
     or a private registry) the NAS can pull from, or
   - Copy the repository to the NAS (e.g. via File Station or `git clone`
     over SSH) and build it locally from Container Manager's **Project**
     tab, pointing it at the repository's `docker-compose.yml`.
2. **Create a volume for persistent data**, in **Container Manager >
   Volume**: create a new volume (or reuse a shared folder) that will back
   `/home/node/.config/remarkable-nonogram-generator`.
3. **Create the container**, in **Container Manager > Container > Create**:
   - Select the `remarkable-nonogram-generator` image.
   - Under **Volume Settings**, mount the volume from step 2 to the
     container path `/home/node/.config/remarkable-nonogram-generator`.
   - Under **Port Settings**, map a local NAS port (e.g. `4279`) to the
     container's port `4279` (or whichever port `PORT` is set to).
   - Optionally, under **Environment**, add a `PORT` variable if you want the
     app to listen on a different internal port.
4. **Start the container.** Once running, open
   `http://<nas-address>:<the port you mapped>` in a browser.
5. **Updating the image later**: pull/rebuild the new image, stop the
   container, recreate it from the new image while re-mounting the same
   volume from step 2 — your saved nonograms and reMarkable pairing are
   preserved.

If your Container Manager version uses a **Project** (Compose) view instead
of the single-container wizard above, you can instead import the repository's
`docker-compose.yml` there directly, then edit the `ports`/`PORT` values and
the volume mapping to match your NAS before deploying — the settings map
one-to-one to the steps described above.

## Notes

- The image bundles Chromium (needed for importing puzzles from a
  nonograms.org URL) via the OS package rather than Puppeteer's own download,
  so the same image works on both Intel/AMD and ARM-based Synology models.
- The final image is a few hundred megabytes larger than a typical minimal
  Node.js image because of that bundled browser — this is expected.
