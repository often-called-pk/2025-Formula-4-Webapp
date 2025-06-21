# Formula 4 Race Analytics Platform

<div align="center">

![Formula 4 Race Analytics](https://img.shields.io/badge/Formula%204-Race%20Analytics-red.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build Status](https://img.shields.io/github/workflow/status/often-called-pk/2025-Formula-4-Webapp/CI%20Pipeline)

**Advanced telemetry data analysis platform for Formula 4 racing teams**

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

## 🏁 Overview

Formula 4 Race Analytics is a comprehensive web-based platform designed for Formula 4 racing teams to efficiently analyze telemetry data, enhance driver performance, and optimize race strategies. The platform provides advanced analytics and visualization tools that support improved decision-making processes and competitive performance for teams of all sizes.

### 🎯 Key Benefits

- **Performance Enhancement**: Detailed driver performance analysis and improvement recommendations
- **Strategic Insights**: Advanced race strategy optimization through data-driven insights
- **Real-time Analytics**: Live telemetry processing and analysis capabilities
- **Team Collaboration**: Multi-user platform with role-based access control
- **Cost-Effective**: Accessible solution for teams with varying budgets

## 🚀 Features

### 📊 Telemetry Analysis
- **Advanced Data Processing**: Support for AiM RaceStudio CSV files with 39+ telemetry parameters
- **Lap-by-Lap Analysis**: Detailed performance breakdown for each lap
- **Sector Analysis**: Comprehensive sector time analysis and optimization
- **G-Force Analysis**: Advanced cornering and braking analysis
- **Speed Profiling**: Detailed speed analysis through track sections

### 📈 Visualization & Reporting
- **Interactive Charts**: Real-time telemetry data visualization using Plotly.js
- **3D Track Views**: Three-dimensional track representation with telemetry overlay
- **Performance Dashboards**: Customizable dashboards for team analysis
- **Comparative Analysis**: Side-by-side session and driver comparisons
- **Export Capabilities**: PDF and Excel report generation

### 🔧 Data Management
- **File Upload**: Drag-and-drop CSV file upload with validation
- **Data Validation**: Automatic data quality checks and error reporting
- **Storage Management**: Efficient data storage with PostgreSQL and TimescaleDB
- **Backup & Recovery**: Automated backup system for data protection

### 👥 Team Features
- **Multi-User Support**: Role-based access control for team members
- **Driver Profiles**: Individual driver performance tracking
- **Session Management**: Organized session and race weekend management
- **Collaboration Tools**: Team insights sharing and communication

## 🏗️ Architecture

### System Overview

The Formula 4 Race Analytics platform follows a modern microservices architecture designed for scalability, maintainability, and performance.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │ Data Processing │
│   Dashboard     │◄──►│   Service        │◄──►│    Service      │
│   (React/Vite)  │    │   (Node.js)      │    │   (FastAPI)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         └────────────────────────┼───────────────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
              ┌──────────┐                ┌────────────┐
              │PostgreSQL│                │   Redis    │
              │ Database │                │   Cache    │
              └──────────┘                └────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Components**: Shadcn/ui with Tailwind CSS
- **Charts**: Recharts and Plotly.js for data visualization
- **State Management**: React Query for server state management
- **Routing**: React Router for navigation

#### Backend API
- **Runtime**: Node.js 20+ with Express.js
- **Database**: PostgreSQL 15 with TimescaleDB extension
- **Cache**: Redis for session management and caching
- **Authentication**: JWT-based authentication
- **File Upload**: Multer for CSV file handling
- **Validation**: Joi for request validation

#### Data Processing Service
- **Framework**: FastAPI with Python 3.11+
- **Data Processing**: Pandas and NumPy for telemetry analysis
- **Machine Learning**: Scikit-learn for advanced analytics
- **Visualization**: Matplotlib and Plotly for chart generation
- **Async Processing**: AsyncIO for concurrent operations

#### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Reverse Proxy**: Nginx for production deployment
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Monitoring**: Prometheus and Grafana (optional)

## 📋 Prerequisites

Before setting up the Formula 4 Race Analytics platform, ensure you have the following installed:

### Required Software
- **Node.js**: Version 20.0.0 or higher
- **npm**: Version 10.0.0 or higher
- **Python**: Version 3.11 or higher
- **Docker**: Version 24.0 or higher
- **Docker Compose**: Version 2.0 or higher
- **Git**: Latest version

### System Requirements
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: Minimum 10GB free space
- **OS**: Linux, macOS, or Windows with WSL2

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/often-called-pk/2025-Formula-4-Webapp.git
cd 2025-Formula-4-Webapp
```

### 2. Environment Setup

```bash
# Copy environment variables
cp .env.example .env

# Edit the .env file with your configuration
# Update database passwords, JWT secrets, etc.
```

### 3. Docker Deployment (Recommended)

```bash
# Start all services with Docker Compose
docker-compose up -d

# Wait for services to be ready (about 2-3 minutes)
docker-compose logs -f

# Verify all services are running
docker-compose ps
```

### 4. Manual Development Setup

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install Python dependencies
cd data-service && pip install -r requirements.txt && cd ..

# Install frontend dependencies
cd dashboard && npm install && cd ..

# Start PostgreSQL and Redis (using Docker)
docker-compose up -d postgres redis

# Start all services in development mode
npm run dev
```

### 5. Access the Platform

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Data Service**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

## 🔧 Development

### Project Structure

```
formula4-race-analytics/
├── 📁 .github/              # GitHub Actions workflows
│   └── workflows/
│       ├── ci.yml           # Continuous Integration
│       └── deploy.yml       # Deployment pipeline
├── 📁 backend/              # Node.js API service
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Custom middleware
│   │   ├── routes/         # API routes
│   │   ├── config/         # Configuration files
│   │   └── server.js       # Main server file
│   ├── Dockerfile          # Backend container config
│   └── package.json        # Backend dependencies
├── 📁 dashboard/            # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service functions
│   │   └── utils/         # Utility functions
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
├── 📁 data-service/        # Python data processing service
│   ├── routers/          # FastAPI route handlers
│   ├── models/           # Pydantic data models
│   ├── services/         # Data processing logic
│   ├── main.py           # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # Data service container
├── 📄 docker-compose.yml   # Development environment
├── 📄 docker-compose.prod.yml # Production environment
├── 📄 package.json         # Root package.json (monorepo)
├── 📄 .env.example         # Environment variables template
└── 📄 README.md            # This file
```

### Available Scripts

#### Root Level Commands
```bash
# Development
npm run dev              # Start all services in development mode
npm run build            # Build all services for production
npm run test             # Run all tests
npm run lint             # Lint all services

# Docker Commands
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:build     # Build Docker images
npm run docker:logs      # View service logs
```

#### Frontend Commands
```bash
cd dashboard
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run tests
npm run lint             # Lint code
npm run type-check       # TypeScript type checking
```

#### Backend Commands
```bash
cd backend
npm run start            # Start production server
npm run dev              # Start development server
npm run test             # Run tests
npm run lint             # Lint code
```

#### Data Service Commands
```bash
cd data-service
python main.py           # Start development server
uvicorn main:app --reload # Start with auto-reload
pytest                   # Run tests
flake8 .                 # Lint code
```

### Database Setup

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d formula4_analytics

# Create tables (automatically done on first run)
# See backend/src/config/database.js for schema

# Backup database
docker-compose exec postgres pg_dump -U postgres formula4_analytics > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres formula4_analytics < backup.sql
```

## 📊 Usage Guide

### Uploading Telemetry Data

1. **Prepare CSV Files**: Export telemetry data from AiM RaceStudio in CSV format
2. **Upload Files**: Use the dashboard upload interface or API endpoint
3. **Data Validation**: The system automatically validates file structure
4. **Processing**: Data is processed and stored for analysis

### Analyzing Performance

1. **Session Selection**: Choose the session you want to analyze
2. **Parameter Selection**: Select specific telemetry parameters
3. **Visualization**: View interactive charts and graphs
4. **Insights**: Review AI-generated performance insights
5. **Export**: Download reports in PDF or Excel format

### Comparing Sessions

1. **Multi-Selection**: Select multiple sessions for comparison
2. **Parameter Alignment**: Choose common parameters to compare
3. **Visual Comparison**: View side-by-side performance charts
4. **Recommendations**: Get suggestions for performance improvement

### API Usage

```bash
# Health check
curl http://localhost:3001/health

# Upload telemetry file
curl -X POST -F "file=@telemetry.csv" http://localhost:3001/api/upload/telemetry

# Get session data
curl http://localhost:3001/api/telemetry/sessions

# Validate CSV file
curl -X POST -F "file=@telemetry.csv" http://localhost:8001/telemetry/validate
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run frontend tests
cd dashboard && npm test

# Run backend tests
cd backend && npm test

# Run Python tests
cd data-service && python -m pytest

# Run with coverage
cd data-service && python -m pytest --cov=. --cov-report=html
```

### Test Data

Sample telemetry CSV files are available in the `test-data/` directory for testing purposes.

## 🚀 Deployment

### Production Deployment

1. **Server Setup**: Configure production server with Docker
2. **Environment Variables**: Set production environment variables
3. **SSL Configuration**: Configure SSL certificates for HTTPS
4. **Database Setup**: Set up production PostgreSQL instance
5. **Monitoring**: Configure monitoring and logging

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Monitor services
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

### CI/CD Pipeline

The project includes automated CI/CD pipelines:

- **Continuous Integration**: Automated testing on pull requests
- **Automated Deployment**: Deploy to staging and production
- **Security Scanning**: Vulnerability scanning with Trivy
- **Code Quality**: SonarCloud integration

### Environment Configuration

```bash
# Staging environment
echo "NODE_ENV=staging" > .env.staging

# Production environment
echo "NODE_ENV=production" > .env.production

# Update secrets in GitHub repository settings
```

## 📚 API Documentation

### REST API Endpoints

#### Backend API (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/telemetry/sessions` | Get all sessions |
| GET | `/api/telemetry/sessions/:id` | Get session data |
| POST | `/api/upload/telemetry` | Upload telemetry file |
| POST | `/api/telemetry/compare` | Compare sessions |

#### Data Processing API (Port 8001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/telemetry/process` | Process telemetry file |
| POST | `/telemetry/analyze` | Analyze telemetry data |
| POST | `/telemetry/compare` | Compare multiple sessions |
| POST | `/telemetry/validate` | Validate CSV file |
| GET | `/telemetry/capabilities` | Get service capabilities |

### Interactive API Documentation

- **FastAPI Docs**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## 🔧 Configuration

### Environment Variables

See `.env.example` for a complete list of configuration options.

### Key Configuration Areas

- **Database Configuration**: PostgreSQL connection settings
- **Redis Configuration**: Cache and session store settings
- **Security Settings**: JWT secrets and CORS configuration
- **File Upload Settings**: File size limits and allowed types
- **Feature Flags**: Enable/disable specific features

## 🔍 Monitoring & Logging

### Health Checks

```bash
# Check service health
curl http://localhost:3001/health
curl http://localhost:8001/health

# Docker health status
docker-compose ps
```

### Logs

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f data-service
docker-compose logs -f dashboard

# Application logs
tail -f logs/app.log
```

### Performance Monitoring

- **Application Metrics**: Built-in performance monitoring
- **Database Monitoring**: PostgreSQL performance metrics
- **Cache Monitoring**: Redis performance tracking

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- **Frontend**: ESLint + Prettier for TypeScript/React
- **Backend**: ESLint + Standard for Node.js
- **Python**: Flake8 + Black for Python code

### Commit Convention

```
feat: add new feature
fix: bug fix
docs: documentation update
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## 📈 Roadmap

### Version 1.1 (Q2 2025)
- [ ] Real-time telemetry streaming
- [ ] Advanced AI-powered insights
- [ ] Mobile app companion
- [ ] Weather data integration

### Version 1.2 (Q3 2025)
- [ ] Predictive analytics
- [ ] 3D track visualization
- [ ] Advanced team collaboration tools
- [ ] Integration with popular telemetry systems

### Version 2.0 (Q4 2025)
- [ ] Machine learning driver coaching
- [ ] Cloud-based deployment options
- [ ] Multi-series support (F3, F2, etc.)
- [ ] Advanced race strategy optimization

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### File Upload Issues
- Check file size limits in `.env`
- Verify file format (CSV only)
- Ensure upload directory permissions

#### Performance Issues
- Monitor memory usage with `docker stats`
- Check database query performance
- Review log files for errors

### Getting Help

- **Documentation**: Check this README and API docs
- **Issues**: Create a GitHub issue for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Wiki**: Check the project wiki for detailed guides

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- Formula 4 racing community for requirements and feedback
- Open source contributors and maintainers
- AiM Sports for telemetry data format standards
- Racing teams who provided testing and validation

## 📞 Support

For support and questions:

- **Email**: support@formula4analytics.com
- **GitHub Issues**: [Create an issue](https://github.com/often-called-pk/2025-Formula-4-Webapp/issues)
- **Documentation**: [Wiki](https://github.com/often-called-pk/2025-Formula-4-Webapp/wiki)

---

<div align="center">

**Built with ❤️ for the Formula 4 racing community**

[⬆ Back to Top](#formula-4-race-analytics-platform)

</div>
