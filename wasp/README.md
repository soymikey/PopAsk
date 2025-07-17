# <YOUR_APP_NAME>

This project is based on [OpenSaas](https://opensaas.sh) template and consists of three main dirs:

1. `app` - Your web app, built with [Wasp](https://wasp.sh).
2. `e2e-tests` - [Playwright](https://playwright.dev/) tests for your Wasp web app.
3. `blog` - Your blog / docs, built with [Astro](https://docs.astro.build) based on [Starlight](https://starlight.astro.build/) template.

For more details, check READMEs of each respective directory!

1. Position into app's root directory:
   cd poask-wasp/app

2. Run the development database (and leave it running):
   wasp db start

3. Open new terminal window (or tab) in that same dir and continue in it.

4. Apply initial database migrations:
   wasp db migrate-dev

5. Create initial dot env file from the template:
   cp .env.server.example .env.server

6. Last step: run the app!
   wasp start
