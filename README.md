# Perplexity Hack Project

This project consists of a FastAPI backend and React frontend application.

## Project Structure
```
├── frontend/          # React frontend application
├── backend/          # FastAPI backend application
├── docs/            # Project documentation
└── docker-compose.yml # Docker configuration
```

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn api.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

### Docker Setup
To run the entire application using Docker:
```bash
docker-compose up --build
```

## Documentation
- API documentation is available at `/docs/API.md`
- Architecture documentation is available at `/docs/ARCHITECTURE.md`
