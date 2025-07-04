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

When configuring your project in Vercel, use these settings:

1. **Framework Preset**: Select "Vite"
2. **Build Command**: `npm run build-skip-ts`
3. **Output Directory**: `dist`
4. **Install Command**: Keep the default (`npm install`)
5. **Development Command**: Keep the default (`npm run dev`)

### 4. Environment Variables (CRITICAL)

You **must** set up the following environment variable in your Vercel project settings:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Environment Variables"
3. Add the following variable:
   - Name: `VITE_API_URL`
   - Value: Your production API URL (e.g., `https://your-backend-api.vercel.app/api`)
4. Make sure to select "Production" for the environment
5. Click "Save"

### 5. Deploy

After configuring your settings, click "Deploy". Vercel will:
1. Clone your repository
2. Install dependencies (which will run the postinstall script to fix the ReactNode issue)
3. Build your application
4. Deploy it to their global CDN

### 6. Verify Deployment

Once deployment is complete:
1. Click on the generated URL to verify your application works
2. Check that API requests are working correctly
3. Test all main functionality

## Troubleshooting

### Build Failures

If your build fails with errors about the output directory:
- Make sure you've set the correct output directory (`dist`)
- Check that the build command (`npm run build-skip-ts`) works locally

### API Connection Issues

If your frontend can't connect to your backend API:
- Verify the `VITE_API_URL` environment variable is set correctly
- Check that CORS is properly configured on your backend
- Make sure your backend is deployed and accessible

### ReactNode Import Error

If you see errors related to ReactNode imports:
- The postinstall script should automatically fix this issue
- If it doesn't, you may need to manually update the file in the Vercel console

## Custom Domain

To set up a custom domain:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Domains"
3. Add your domain and follow the instructions

## Updating Your Deployment

Any new commits pushed to your main branch will automatically trigger a new deployment in Vercel. 