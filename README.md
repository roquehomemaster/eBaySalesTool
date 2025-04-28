# eBay Sales Tool

## Project Overview
The eBay Sales Tool is a full-stack web application designed to assist users in managing eBay sales, tracking items, and conducting product research. It includes a backend API, a frontend user interface, and a database for storing sales and product data.

## Features
- **Backend**: Built with Node.js and Express, providing RESTful APIs for managing sales, items, and ownership.
- **Frontend**: Developed with React, offering a user-friendly interface for data entry, sales tracking, and product research.
- **Database**: Uses MongoDB for storing sales and item data.
- **Dockerized**: Fully containerized setup for easy deployment and development.
- **Swagger Documentation**: API documentation available at `/api-docs`.

## Project Structure
```
backend/
  Dockerfile
  package.json
  src/
    app.js
    controllers/
    models/
    routes/
    templates/
frontend/
  Dockerfile
  package.json
  src/
    App.js
    components/
    context/
    services/
database/
  migrations/
  seeds/
scripts/
  docker_build.bat
  npm_cleanup_and_install.bat
```

## Prerequisites
- **Node.js**: v16 or higher
- **Docker**: Installed and running
- **MongoDB**: Running instance or Dockerized

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd eBaySalesTool
   ```

2. Install dependencies:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. Start the application using Docker:
   ```bash
   .\scripts\docker_build.bat
   ```

4. Access the application:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## Contributing
1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Description of changes"
   ```
4. Push to your branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

## License
This project is licensed under the MIT License.