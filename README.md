# AgriAssist

A comprehensive agricultural assistance web application built with Next.js and designed for seamless deployment on Vercel.

## Features

- **Weather Forecast**: Get weather updates for your crops
- **Crop Calendar**: Track planting and harvesting seasons
- **Pest Control**: Identify and manage crop pests
- **Soil Health**: Monitor and improve soil conditions

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/Nithi-tech/AgriAssist.git
cd AgriAssist
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment on Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will automatically detect it's a Next.js project
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to deploy your application

### Option 3: Deploy via GitHub Integration

1. Connect your GitHub repository to Vercel
2. Any push to the main branch will automatically trigger a new deployment

## Environment Variables

For production deployment, you may need to set environment variables in your Vercel dashboard under Project Settings > Environment Variables.

## Technologies Used

- **Next.js 14**: React framework for production
- **React 18**: Frontend library
- **TypeScript**: Type safety
- **CSS Modules**: Scoped styling
- **Vercel**: Hosting and deployment platform

## Project Structure

```
AgriAssist/
├── pages/
│   ├── _app.tsx       # App component
│   └── index.tsx      # Home page
├── styles/
│   ├── globals.css    # Global styles
│   └── Home.module.css # Component styles
├── components/        # Reusable components
├── public/           # Static assets
├── next.config.js    # Next.js configuration
├── vercel.json       # Vercel deployment config
└── package.json      # Dependencies and scripts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.