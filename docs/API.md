# API Documentation

## Base URL
```
http://localhost:8000
```

## Endpoints

### Health Check
- **GET** `/health`
- Returns the health status of the API
- Response:
  ```json
  {
    "status": "healthy"
  }
  ```

### Root
- **GET** `/`
- Returns a welcome message
- Response:
  ```json
  {
    "message": "Welcome to Perplexity Hack API"
  }
  ```

## Authentication
Authentication details will be added as the API evolves.

## Error Handling
The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting
Rate limiting details will be added as the API evolves. 