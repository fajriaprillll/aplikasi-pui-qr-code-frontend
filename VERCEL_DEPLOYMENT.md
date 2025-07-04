# Deploying to Vercel

This document provides instructions for deploying this React application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Git repository with your code (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Push your code to a Git repository

If you haven't already, push your code to a Git repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 2. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your Git repository
4. Select the repository containing this project

### 3. Configure Project Settings

1. Keep the default framework preset (Vite)
2. Set the Build Command to: `npm run build-skip-ts`
3. Set the Output Directory to: `dist`
4. Click "Deploy"

### 4. Environment Variables

You need to set up the following environment variables in your Vercel project settings:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Environment Variables"
3. Add the following variable:
   - Name: `VITE_API_URL`
   - Value: Your production API URL (e.g., `https://your-backend-api.vercel.app/api`)
4. Click "Save"

### 5. Redeploy (if needed)

If you've added environment variables after the initial deployment:

1. Go to the "Deployments" tab
2. Find your latest deployment
3. Click the three dots menu (...)
4. Select "Redeploy"

## Troubleshooting

### API Connection Issues

If your frontend can't connect to your backend API:

1. Make sure your API URL is correct in the environment variables
2. Check that CORS is properly configured on your backend
3. Verify that your backend is deployed and accessible

### Build Failures

If the build fails:

1. Check the build logs in Vercel
2. Make sure all dependencies are correctly installed
3. Verify that the build script (`npm run build-skip-ts`) works locally

## Updating Your Deployment

Any new commits pushed to your main branch will automatically trigger a new deployment in Vercel.

## Custom Domain

To set up a custom domain:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Domains"
3. Add your domain and follow the instructions 