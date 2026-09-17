# Heavyar Landing Page - Cloudflare Pages Ready

## 📦 Complete Deployment Package

This package contains everything you need to deploy the Heavyar landing page to Cloudflare Pages.

---

## 📁 Project Structure

```
heavyar-complete/
├── index.html                 # Homepage
├── styles.css                 # Global styles
├── script.js                  # Language switching
├── terms.html                 # Terms of service
├── privacy.html               # Privacy policy
├── delete-account.html        # Authenticated account deletion
├── delete-account.js          # Firebase Web Auth deletion flow
├── refund.html                # Refund policy
├── safety.html                # Safety guidelines
├── providers-terms.html       # Provider terms
├── faq.html                   # FAQ page
├── contact.html               # Contact page
├── assets/
│   ├── images/
│   │   ├── logo.png          # Heavyar logo (949 KB)
│   │   └── banner.jpg        # Hero banner (472 KB)
│   └── cert/
│       └── sbc-certificate.png  # Certificate badge (1.5 KB)
└── README.md                  # This file
```

**Total Files**: 17
**Total Pages**: 9 (1 homepage + 8 legal pages)

---

## ✅ Features Included

### Homepage (index.html):
- ✅ Hero section with banner background
- ✅ Logo and navigation
- ✅ Language toggle (العربية | English)
- ✅ Updated footer with certificate badge
- ✅ Responsive design
- ✅ SEO meta tags and favicon

### All Legal Pages (7 pages):
- ✅ Consistent navigation header
- ✅ Original Arabic content
- ✅ Professional styling
- ✅ Updated footer with certificate badge
- ✅ Links to all other pages
- ✅ Responsive layout

### Account deletion (delete-account.html):
- ✅ Arabic/English language toggle with RTL/LTR support
- ✅ Firebase Web Auth email/password sign-in
- ✅ Firebase password-reset email with generic account-safe messaging
- ✅ Authenticated Worker deletion request using `DELETE_MY_ACCOUNT`
- ✅ Explicit confirmation, safe errors, and session cleanup
- ✅ No UID/email accepted as proof and no server secrets in the site

### Footer (all 9 pages):
- ✅ Certificate badge (clickable)
- ✅ CR number: 7050191290
- ✅ Verification link to Ministry of Commerce
- ✅ Email: heavyar.official@gmail.com
- ✅ Links to all legal pages
- ✅ Copyright notice

---

## 🚀 Deployment Instructions

### Method 1: Cloudflare Pages (Recommended)

1. **Login to Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com/
   - Navigate to: Workers & Pages → Pages

2. **Create New Project**
   - Click "Create application"
   - Select "Pages"
   - Click "Upload assets"

3. **Upload Files**
    - Upload ALL files and folders from this package, including `delete-account.html` and `delete-account.js`
   - Maintain the folder structure (especially assets/)

4. **Build Settings**
   - Build command: (leave empty)
   - Build output directory: `/`
   - Root directory: `/`

5. **Deploy**
   - Click "Save and Deploy"
   - Your site will be live in seconds!

### Method 2: Direct Upload via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy . --project-name=heavyar
```

---

## 🧪 Local Testing

To test locally before deployment:

1. **Simple HTTP Server (Python)**:
   ```bash
   python3 -m http.server 8000
   ```
   Then open: http://localhost:8000

2. **Simple HTTP Server (Node.js)**:
   ```bash
   npx http-server -p 8000
   ```
   Then open: http://localhost:8000

3. **VS Code Live Server**:
   - Install "Live Server" extension
   - Right-click index.html
   - Select "Open with Live Server"

4. **Direct File Open**:
   - Simply double-click index.html
   - Opens in your default browser
   - All assets work with relative paths

---

## 📝 Important Notes

### All Image Paths Are Relative:
- Logo: `assets/images/logo.png`
- Banner: `assets/images/banner.jpg`
- Certificate: `assets/cert/sbc-certificate.png`

### No Build Step Required:
- Pure HTML, CSS, JavaScript
- No npm install needed
- No compilation or bundling
- Upload and deploy immediately

### Mobile Responsive:
- Works on all devices
- Touch-friendly buttons
- Optimized layouts
- Tested on mobile browsers

---

## 🔧 Customization

### Update Logo:
Replace `assets/images/logo.png` with your new logo (maintain filename)

### Update Banner:
Replace `assets/images/banner.jpg` with your new banner (maintain filename)

### Update Certificate:
Replace `assets/cert/sbc-certificate.png` with new certificate

### Update Content:
Edit HTML files directly - no build process needed

### Update Colors:
Edit `styles.css` → `:root` section for color variables

---

## 📞 Contact Information

**Email**: heavyar.official@gmail.com  
**Commercial Registration**: 7050191290  
**Verification**: https://eauthenticate.saudibusiness.gov.sa/certificate-details/0000195630

---

## ✅ Verification Checklist

Before deployment, verify:
- [ ] All 15 files are present
- [ ] Assets folder contains all images
- [ ] Open index.html in browser (works locally)
- [ ] Test language toggle (العربية ↔ English)
- [ ] Click on legal page links (all work)
- [ ] Check footer certificate badge (displays correctly)
- [ ] Test on mobile device (responsive)
- [ ] Verify all images load

---

## 🎉 Ready to Deploy!

This package is 100% ready for Cloudflare Pages deployment.

**Steps**:
1. Upload this entire folder to Cloudflare Pages
2. Wait 30 seconds for deployment
3. Your website is live!

No configuration needed. No build process. Just upload and go!

---

**Version**: 1.0.0  
**Last Updated**: February 21, 2026  
**Languages**: Arabic (RTL) + English (LTR)  
**Framework**: Pure HTML + CSS + JavaScript
