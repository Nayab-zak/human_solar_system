# SolarSystemOfPeople

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

## Solar System of People Application Setup Guide For Docker

This guide will help you run the Solar System of People application using Docker.

### Prerequisites
- Docker Desktop installed
- PowerShell (or any terminal)
- Browser (Chrome, Edge etc)

### 1. Install and Launch Docker Desktop

- Download and install Docker Desktop from 

[https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop).  

- Checkbox Recommended use WSL 2 instead of Hyper-V
- After installation, launch Docker Desktop from your applications.
- Accept terms, use recommended settings and Click Finish
- Give it admin previliges
- Sign up with your account Google/GitHub/Microsoft
- Create a username and click sign up
- Proceed to docker
- Skip survey

- First Error "Docker Engine Stopped", maybe because no distro is installed on wsl, confirm with...
```
wsl
```

- Install a distro
```
wsl --install -d Ubuntu
```
 
- To check list of distros and WSL version (wsl2 is the most used)
```
wsl --list --verbose
```

### 2. Pull the Docker Image
Open PowerShell and run:
```
docker pull hamid6426/solar-system-of-people:latest
```

### 3. Run the Docker Container
Execute this command in PowerShell to run the container on port 8085:
```
docker run -d -p 8085:80 hamid6426/solar-system-of-people:latest
```

#### This prompt may appear
Name: Window security alert
Simply make checkbox for public network to true and click Accept

### 4. Access the Application
Open Chrome and visit:
```
http://localhost:8085
```

### 5. Verify Container Status
Check running containers with:
```
docker ps
```

Expected output:
```
CONTAINER ID   IMAGE                                      COMMAND                  CREATED       STATUS       PORTS                  NAMES
ced43fe1517d   hamid6426/solar-system-of-people:latest   "/docker-entrypoint.…"   2 hours ago   Up 2 hours   0.0.0.0:8085->80/tcp   loving_kare
```

### Troubleshooting
If the application doesn't load:
- Ensure Docker Desktop is running
- Verify port 8085 isn't being used by other applications
- Check container logs with 
```
docker logs [CONTAINER_ID]
```

### Stopping the Container
To stop the container when finished:
```
docker stop [CONTAINER_ID] # Replace with your actual container ID
```

---

## Production Demo: How to Build and Serve

1. **Build the demo app:**
   ```bash
   npm run build:demo
   ```
   - Output will be in `dist/solar-system-of-people/browser` (for Angular 16+).

2. **Serve the built app (correct MIME types!):**
   - **Recommended:**
     ```bash
     npx serve -s dist/solar-system-of-people/browser
     ```
     - Open [http://localhost:3000](http://localhost:3000)
   - **Or (if you must use Python):**
     ```bash
     cd dist/solar-system-of-people/browser
     python3 -m http.server 8080
     ```
     - Open [http://localhost:8080](http://localhost:8080)
     - Note: Some browsers may block JS modules due to MIME type with Python server. Prefer `serve` for demos.

3. **Troubleshooting:**
   - If you see 404s or MIME errors, make sure you are serving from the `browser/` subdirectory, not the parent.
   - If you see a blank page, check the browser console for errors.

---

## Install
```bash
npm i trait-visual-lib three
```

---

## Features
- Physics-based node system (up to 10 attributes per node)
- Modern Angular/Material UI
- Efficient force calculations, spatial queries, and energy watchdog
- Auto low-power mode for performance
- Fully tested and documented

---

## Development
- `npm start` — Run the dev server (hot reload)
- `npm test` — Run all tests
- `npm run build:lib` — Build the Angular library
- `npm run build:demo` — Build the demo app
- `npx typedoc` — Generate API docs in `docs/`

---

## Project Structure
- `src/` — Main Angular app
- `projects/trait-visual-lib/` — Reusable library code
- `dist/solar-system-of-people/browser/` — Production build output

---

## Notes
- For best results, always use `npx serve` or a proper static server for production builds.
- Python's `http.server` is not recommended for Angular/React/Vue production builds due to MIME type issues with JS modules.