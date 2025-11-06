# ImpactLink Frontend - Complete Deployment Guide

## 🚀 Quick Start - Deploy Your Multi-Page React App

This guide will help you deploy your fully functional React application with multi-page navigation to replace the current static HTML site.

## ✅ Prerequisites

Before starting, ensure you have:
- Node.js (v16 or higher) installed on your computer
- Access to your web hosting account (FTP/cPanel/SSH)
- Terminal/Command Prompt access

## 📋 Step-by-Step Deployment Instructions

### Step 1: Clone the Repository

```bash
# Open terminal and navigate to where you want to work
cd ~/Desktop

# Clone the repository
git clone https://github.com/idesignmedia6557/ImpactLink.git

# Navigate to the frontend directory
cd ImpactLink/frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- React 18.2.0
- React Router DOM 6.20.0
- Axios for API calls
- Stripe payment libraries
- All other dependencies

### Step 3: Test Locally (Optional but Recommended)

```bash
npm start
```

This opens your app at `http://localhost:3000`. Test all pages:
- Home page (`/`)
- Discover page (`/discover`)
- Donate page (`/donate`)
- Dashboard (`/user/dashboard`)

Press `Ctrl+C` to stop the dev server when done.

### Step 4: Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

### Step 5: Deploy to Your Server

####

Option A: Using cPanel File Manager

1. Log into your cPanel account
2. Open "File Manager"
3. Navigate to `public_html` (or your site's root directory)
4. **BACKUP FIRST**: Download all existing files as a backup
5. Delete the old `index.html` and related files
6. Upload all contents from the `build/` folder
7. Make sure the new `index.html` is in the root

#### Option B: Using FTP (FileZilla)

1. Open FileZilla and connect to your server
2. Navigate to your site's root directory (usually `public_html` or `www`)
3. **BACKUP FIRST**: Download all existing files
4. Delete old files
5. Drag and drop everything from the `build/` folder to your server

### Step 6: Configure Server for React Router

For React Router to work properly, you need to configure your server to serve `index.html` for all routes.

#### For Apache (most shared hosting):

Create a `.htaccess` file in your site root with this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

## ✅ Testing Your Deployment

After deployment, test all navigation:

1. Go to `https://impactlink.solovedhelpinghands.org.za/`
2. Click "Discover Charities" - should go to `/discover`
3. Click "Start Donating" - should go to `/donate`
4. Click navigation links in the header
5. Test browser back/forward buttons
6. Refresh page on `/discover` - should stay on discover page (not 404)

## 🐞 Troubleshooting

**Issue**: Clicking links refreshes to homepage
**Solution**: Check that `.htaccess` file is uploaded and mod_rewrite is enabled

**Issue**: 404 errors on page refresh
**Solution**: Server routing not configured. Add/check `.htaccess` file

**Issue**: Blank white page
**Solution**: Check browser console for errors. Might be API endpoint issues.

**Issue**: Build fails
**Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install` again

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for errors (F12)
2. Verify all files uploaded correctly
3. Confirm `.htaccess` is in place
4. Check that your hosting supports Node.js React apps

## 🎉 Success!

Once deployed, your site will have:
- ✅ Multi-page navigation
- ✅ Working React Router
- ✅ All buttons linked to proper pages
- ✅ Fast, optimized performance
- ✅ Mobile-responsive design

---

**Repository**: https://github.com/idesignmedia6557/ImpactLink
**Live Site**: https://impactlink.solovedhelpinghands.org.za/
