FROM node:25-bookworm-slim AS build

WORKDIR /app

# Skip Puppeteer's own Chromium download in the build stage: the runtime
# stage installs the OS-packaged Chromium instead (see ADR 014), and
# Puppeteer isn't used at build time anyway.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/web/package.json packages/web/package.json
RUN npm ci

COPY tsconfig.base.json ./
COPY packages/core packages/core
COPY packages/web packages/web

# Type-check gate: fail the image build if the TypeScript doesn't compile.
# The runtime stage below still executes the server through tsx on source
# (see ADR 013), this build is not what ships in the final image.
RUN npm run build

RUN npm prune --omit=dev


FROM node:25-bookworm-slim

RUN apt-get update \
	&& apt-get install --no-install-recommends -y chromium fonts-liberation ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/node_modules node_modules
COPY --from=build /app/package.json package.json
COPY --from=build /app/tsconfig.base.json tsconfig.base.json
COPY --from=build /app/packages/core/package.json packages/core/package.json
COPY --from=build /app/packages/core/src packages/core/src
COPY --from=build /app/packages/core/tsconfig.json packages/core/tsconfig.json
COPY --from=build /app/packages/web/package.json packages/web/package.json
COPY --from=build /app/packages/web/tsconfig.json packages/web/tsconfig.json
COPY --from=build /app/packages/web/src packages/web/src
COPY --from=build /app/packages/web/public packages/web/public

RUN mkdir -p /home/node/.config/remarkable-nonogram-generator \
	&& chown -R node:node /home/node/.config /app

USER node
ENV HOME=/home/node

VOLUME ["/home/node/.config/remarkable-nonogram-generator"]

EXPOSE 4279

WORKDIR /app/packages/web
CMD ["npm", "start"]
