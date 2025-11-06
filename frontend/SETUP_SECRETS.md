# GitHub Actions Secrets Setup Guide

## 🔐 Required Secrets for Automatic Deployment

To enable automatic deployment, you need to configure FTP credentials in your GitHub repository secrets.

## 📝 Step-by-Step Instructions

### 1. Get Your FTP Credentials

You'll need the following information from your web hosting provider:
- **FTP Server**: Usually `ftp.yourdomain.com` or an IP address
- **FTP Username**: Your FTP account username
- **FTP Password**: Your FTP account password

**Where to find these:**
- Check your hosting provider's cPanel → FTP Accounts
- Or contact your hosting support

### 2. Add Secrets to GitHub

1. Go to your repository: https://github.com/idesignmedia6557/ImpactLink
2. Click on **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 3. Add These Three Secrets

Add each secret one by one:

#### Secret 1: FTP_SERVER
- Name: `FTP_SERVER`
- Value: `ftp.solovedhelpinghands.org.za` (or your FTP server address)

#### Secret 2: FTP_USERNAME
- Name: `FTP_USERNAME`
- Value: Your FTP username (e.g., `yourusername@solovedhelpinghands.org.za`)

#### Secret 3: FTP_PASSWORD
- Name: `FTP_PASSWORD`
- Value: Your FTP password

## ✅ Testing the Deployment

Once secrets are configured:

1. Make any change to a file in the `frontend/` folder
2. Commit and push to GitHub
3. Go to **Actions** tab in your repository
4. Watch the "Deploy ImpactLink Frontend" workflow run
5. When complete, check https://impactlink.solovedhelpinghands.org.za/

## 🔄 How Auto-Deployment Works

**Every time you:**
- Push changes to the `frontend/` folder on the `main` branch
- Or manually trigger the workflow from the Actions tab

**GitHub Actions will automatically:**
1. Install dependencies (`npm install`)
2. Build your React app (`npm run build`)
3. Deploy the built files to your server via FTP
4. Your live site updates immediately!

## 📍 Server Directory

The workflow deploys to `/public_html/` by default.

If your site is in a different folder, edit `.github/workflows/deploy.yml`:
```yaml
server-dir: /your-folder-here/
```

## 🆘 Troubleshooting

**Workflow fails?**
- Check that all three secrets are added correctly
- Verify FTP credentials work (test with FileZilla)
- Check Actions tab for error messages

**Site not updating?**
- Clear browser cache (Ctrl+Shift+R)
- Check server folder is correct
- Verify FTP user has write permissions

## 🎉 Success!

Once configured, you'll never need to manually deploy again. Just commit your changes to GitHub and watch your site update automatically!
