# AI Testing Portal - Frontend

React-based frontend for the AI Testing Portal application.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api
   REACT_APP_APP_NAME=AI Testing Portal
   REACT_APP_VERSION=1.0.0
   ```

3. **Start development server:**
   ```bash
   npm start
   ```
   
   The app will open at http://localhost:3000

## 📁 Project Structure

```
client/
├── public/                 # Static assets
│   ├── index.html         # HTML template
│   └── favicon.ico        # App icon
├── src/                   # Source code
│   ├── components/        # Reusable components
│   │   ├── common/        # Shared components
│   │   └── forms/         # Form components
│   ├── pages/            # Page components
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── interviews/   # Interview management
│   │   ├── candidates/   # Candidate management
│   │   └── test/         # Test-related pages
│   ├── redux/            # State management
│   │   ├── slices/       # Redux slices
│   │   └── store.js      # Redux store
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Main app component
│   └── index.js          # Entry point
├── .env.example          # Environment template
├── package.json          # Dependencies
└── tailwind.config.js    # Tailwind CSS config
```

## 🛠️ Available Scripts

- **`npm start`** - Start development server (http://localhost:3000)
- **`npm run build`** - Build for production
- **`npm test`** - Run tests
- **`npm run eject`** - Eject from Create React App (⚠️ irreversible)

## 🎨 Tech Stack

- **React 18** - UI library
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Axios** - HTTP client

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:8000/api` |
| `REACT_APP_APP_NAME` | Application name | `AI Testing Portal` |
| `REACT_APP_VERSION` | App version | `1.0.0` |

### API Configuration

The app is configured to communicate with the backend API. Make sure:
1. Backend server is running on the configured URL
2. CORS is properly configured on the backend
3. API endpoints match the expected format

## 🏗️ Building for Production

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Serve static files:**
   ```bash
   # Using serve (install globally: npm install -g serve)
   serve -s build -l 3000
   
   # Or using any static file server
   ```

## 🐳 Docker Support

Build and run with Docker:

```bash
# Build image
docker build -t ai-portal-client .

# Run container
docker run -p 3000:3000 ai-portal-client
```

## 🔍 Key Features

### Authentication
- Login/logout functionality
- JWT token management
- Protected routes
- Role-based access control

### Dashboard
- KPI cards with real-time data
- Upcoming interviews widget
- Quick action buttons
- Recent activity feed

### Interview Management
- Schedule interviews
- View upcoming interviews
- Manage attendees
- Reschedule/cancel interviews
- Complete interviews with feedback

### Test Management
- Create and edit tests
- AI-powered question generation
- Test library management
- Results and analytics

### Candidate Management
- Add/edit candidates
- Resume upload and parsing
- Candidate profiles
- Test assignments

## 🎯 Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use TypeScript-style prop validation
- Keep components small and focused

### State Management
- Use Redux Toolkit for global state
- Local state for component-specific data
- Async operations with createAsyncThunk

### Styling
- Use Tailwind CSS utility classes
- Custom components in `components/common/`
- Responsive design principles

## 🚨 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend server is running
   - Verify `REACT_APP_API_URL` in `.env`
   - Check browser console for CORS errors

2. **Build Fails**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check for TypeScript errors
   - Verify all imports are correct

3. **Styling Issues**
   - Restart development server after Tailwind config changes
   - Check for conflicting CSS classes
   - Verify Tailwind is properly configured

### Debug Mode

Enable debug logging by setting:
```env
REACT_APP_DEBUG=true
```

## 📝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
