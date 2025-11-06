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
- **Package Manager**: pnpm
- **Code Quality**: ESLint 9, TypeScript, Commitlint, Husky

## Installation

### Prerequisites

- Node.js 18 or newer
- pnpm (install with `npm install -g pnpm`)

### Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gitlab-time-report
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file with your GitLab API token:
   ```bash
   VITE_GITLAB_API_TOKEN=your_gitlab_token
   VITE_GITLAB_API_URL=https://gitlab.com/api/v4
   ```

4. Start the development server:
   ```bash
   pnpm dev
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
pnpm build
```

The built files will be in the `dist` directory.

## Code Quality

### Linting

```bash
# Run ESLint
pnpm lint

# Fix ESLint issues automatically
pnpm lint:fix
```

### Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) format enforced by [commitlint](https://commitlint.js.org/).

**Commit message format:**
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes (dependencies, etc.)

**Examples:**
```bash
feat: add token input component
fix(api): handle GitLab API errors
docs: update README with commit guidelines
refactor(services): improve GitLab service structure
```

**Husky Hooks:**
- `pre-commit`: Runs ESLint before committing
- `commit-msg`: Validates commit message format

## Project Structure

```
gitlab-time-report/
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   │   ├── ui/        # UI base components
│   │   └── ...        # Feature components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   ├── services/      # API services
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Constants and helpers
│   ├── App.tsx        # Main App component
│   └── main.tsx       # Entry point
├── .eslintrc.json     # ESLint configuration
├── .gitignore         # Git ignore file
├── Dockerfile         # Docker configuration
├── index.html         # HTML entry point
├── package.json       # Dependencies and scripts
├── postcss.config.js  # PostCSS configuration
├── tailwind.config.js # Tailwind configuration
├── tsconfig.json      # TypeScript configuration
├── commitlint.config.js # Commitlint configuration
└── vite.config.ts     # Vite configuration
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Attribution Required
When using or redistributing this software, you must give appropriate credit by including the names of the original authors:

- Paulo Amador Neto
- Matthews Soares Goncalves
