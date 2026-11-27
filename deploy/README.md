# Branch Deployment Package

This branch owns this deployment package; no merge with other branches is required.

## Docker
From repository root:
    docker compose -f deploy/docker-compose.yml up --build
Open http://localhost:8080

## Server
    docker build -f deploy/Dockerfile -t alphabet-flipper .
    docker run -d --name alphabet-flipper --restart unless-stopped -p 80:80 alphabet-flipper

## Local
    npm ci
    npm run build
    npm run preview

The image serves the Vite SPA with nginx and SPA fallback routing.

Changes under deploy/** are deployment material only. CI/CD workflows should ignore deploy/** so these files do not start normal application Actions.
