# Modern Finds Guide - React + Bootstrap

A beautiful Pinterest-to-Amazon affiliate landing page built with React and Bootstrap.

## Features

- ✨ Dynamic category filtering
- 📦 Add/delete products on the fly
- 🏷️ Custom category creation
- 🗑️ Delete categories (protected defaults)
- 📱 Fully responsive design
- 🎨 Beautiful, modern aesthetics

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd modern-finds-guide
```

2. **IMPORTANT: Set up your admin password**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and change the password
# REACT_APP_ADMIN_PASSWORD=your_secure_password_here
```

**Security Note:** The `.env` file is already in `.gitignore` so your password won't be committed to GitHub.

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Build for Production

To create a production build:

```bash
npm run build
```

This creates an optimized build in the `build` folder.

## Deployment Options

**IMPORTANT:** For all deployment options, you must set the environment variable `REACT_APP_ADMIN_PASSWORD` in your hosting platform's settings.

### Option 1: Netlify (Recommended - Easiest)

1. Sign up at https://netlify.com
2. Drag and drop the `build` folder to Netlify
3. **Set environment variable:**
   - Go to Site Settings → Environment Variables
   - Add: `REACT_APP_ADMIN_PASSWORD` = `your_secure_password`
4. Redeploy the site

**Using Netlify CLI:**
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod

# Then in Netlify dashboard, set the environment variable
```

### Option 2: Vercel

1. Sign up at https://vercel.com
2. Install Vercel CLI:
```bash
npm install -g vercel
```
3. Deploy:
```bash
npm run build
vercel --prod
```
4. **Set environment variable:**
   - Go to Project Settings → Environment Variables
   - Add: `REACT_APP_ADMIN_PASSWORD` = `your_secure_password`
   - Redeploy

### Option 3: GitHub Pages

**Note:** GitHub Pages doesn't support environment variables for React apps. For GitHub Pages, you'll need to use a different approach (like a backend API for authentication). We recommend using Netlify or Vercel instead.

### Option 4: AWS Amplify

1. Install Amplify CLI:
```bash
npm install -g @aws-amplify/cli
```

2. Initialize and deploy:
```bash
amplify init
amplify add hosting
```

3. **Set environment variable:**
   - In AWS Amplify Console → Environment Variables
   - Add: `REACT_APP_ADMIN_PASSWORD` = `your_secure_password`

4. Deploy:
```bash
amplify publish
```

## Customization

### Security: Change Admin Password

**Local Development:**
Edit the `.env` file:
```
REACT_APP_ADMIN_PASSWORD=your_new_secure_password
```

**Production Deployment:**
Set the environment variable in your hosting platform's dashboard (see Deployment Options above).

**Important Security Notes:**
- Never commit your `.env` file to GitHub (it's already in `.gitignore`)
- Use a strong, unique password
- The `.env.example` file is safe to commit - it's just a template
- When others clone your repo, they need to create their own `.env` file

### Update Products
- Use the "Add New Product" form in the app
- Or edit the initial products in `src/App.js`

### Change Colors
Modify the color variables at the top of the component:
- `#FFF8F0` - Background cream
- `#8B9A7E` - Sage green
- `#D87750` - Terracotta
- `#2C2C2C` - Charcoal

### Add Your Affiliate Links
Replace `https://amazon.com/your-affiliate-link` with your actual Amazon Associate URLs.

## File Structure

```
react-app/
├── public/
│   └── index.html
├── src/
│   ├── App.js          (Main component)
│   └── index.js        (Entry point)
├── package.json
└── README.md
```

## Technologies Used

- React 18
- Bootstrap 5
- Google Fonts (Playfair Display, DM Sans)
- CSS3 Animations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available for personal and commercial use.
