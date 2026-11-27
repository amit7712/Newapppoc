# Branch Deployment Package

This folder contains branch-specific deployment material and does not merge or copy application code from another branch.

## Docker
From the repository root:

    docker compose -f deploy/docker-compose.yml up --build

Open http://localhost:8080

## Local Node/Vite
From the repository root:

    npm ci
    npm run build
    npm run preview

## Server
Build the image on the target server and run it with Docker:

    docker build -f deploy/Dockerfile -t alphabet-flipper .
    docker run -d --name alphabet-flipper --restart unless-stopped -p 80:80 alphabet-flipper

The image serves the Vite SPA through nginx and includes SPA fallback routing.

## Important
The deploy directory is only deployment material. GitHub Actions should ignore changes under deploy/** so deployment documentation/configuration does not start the normal CI/CD workflows.
