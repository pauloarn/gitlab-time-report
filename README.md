# GitLab Time Report

A web application for generating and visualizing time reports from GitLab.

## Features

- Track time spent on GitLab issues and merge requests
- Generate detailed time reports
- Visualize time data with intuitive UI
- Export data to various formats

## Tech Stack

- **Frontend**: React with Vite
- **Styling**: TailwindCSS
- **UI Components**: Radix UI
- **API Integration**: Apollo Client (GraphQL)
- **Date Handling**: date-fns

## Installation

### Prerequisites

- Node.js 18 or newer
- npm or yarn

### Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gitlab-time-report
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your GitLab API token:
   ```bash
   VITE_GITLAB_API_TOKEN=your_gitlab_token
   VITE_GITLAB_API_URL=https://gitlab.com/api/v4
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Docker Setup

This project can be run using Docker:

1. Build the Docker image:
   ```bash
   docker build -t gitlab-time-report .
   ```

2. Run the container:
   ```bash
   docker run -p 80:80 gitlab-time-report
   ```

The application will be available at http://localhost:80

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
gitlab-time-report/
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   ├── pages/         # Page components
│   ├── graphql/       # GraphQL queries and mutations
│   ├── styles/        # Global styles
│   ├── App.tsx        # Main App component
│   └── main.tsx       # Entry point
├── .dockerignore      # Docker ignore file
├── .gitignore         # Git ignore file
├── Dockerfile         # Docker configuration
├── index.html         # HTML entry point
├── package.json       # Dependencies and scripts
├── postcss.config.js  # PostCSS configuration
├── tailwind.config.js # Tailwind configuration
└── vite.config.js     # Vite configuration
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Attribution Required
When using or redistributing this software, you must give appropriate credit by including the names of the original authors:

- Paulo Amador Neto
- Matthews Soares Goncalves 