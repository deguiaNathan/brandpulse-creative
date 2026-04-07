# BrandPulse

This repository contains the BrandPulse marketing site as a React + Vite app in [`website/`](./website).

## Project structure

- `website/`: deployable React/Vite app
- `website/src/legacy/brandpulse.html`: migrated source document used by the React app
- `Images/` and the other root files: non-deploy assets and working files

## GitHub

From the repository root:

```powershell
git init
git add .
git commit -m "Prepare BrandPulse for deployment"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

The root `.gitignore` excludes local build output, `node_modules`, Vercel metadata, and QA screenshots.

## Local development

```powershell
cd website
npm install
npm run dev
```

## Vercel deployment

Import this GitHub repository into Vercel, then set the **Root Directory** to `website`.

The app is a Vite project, so Vercel should detect it automatically. The project is also configured locally with [`website/vercel.json`](./website/vercel.json).

Expected settings:

- Framework Preset: `Vite`
- Root Directory: `website`
- Build Command: `npm run build`
- Output Directory: `dist`

No environment variables are currently required.

## Build check

```powershell
cd website
npm run build
```
