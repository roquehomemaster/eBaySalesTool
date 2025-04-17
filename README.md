# eBay Sales Tool

## Overview
The eBay Sales Tool is a web-based application designed to assist businesses in selling and tracking items on eBay. This tool provides functionalities for managing sales, tracking profits, conducting product research, and integrating with QuickBooks for financial management.

## Features
- **Sales Management**: Create, edit, and track sales entries.
- **Profit Tracking**: Calculate profits based on sales data.
- **Product Research**: Monitor sold pricing on eBay for various products.
- **QuickBooks Integration**: Record sales and generate payout records.
- **User Authentication**: Manage user logins and permissions.

## Architecture
The application is structured into three main components:
1. **Backend**: Built with Node.js and Express, handling API requests and database interactions.
2. **Frontend**: Developed using React, providing a user-friendly interface for managing sales and product research.
3. **Database**: Utilizes a relational database to store sales data and user information.

## Development Setup
### Prerequisites
- Node.js
- Docker
- Docker Compose

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd ebay-sales-tool
   ```

2. Set up the backend:
   - Navigate to the `backend` directory.
   - Install dependencies:
     ```
     npm install
     ```

3. Set up the frontend:
   - Navigate to the `frontend` directory.
   - Install dependencies:
     ```
     npm install
     ```

4. Set up the database:
   - Navigate to the `database` directory.
   - Initialize the database schema and seed data:
     ```
     mysql -u <username> -p < database/migrations/init.sql
     mysql -u <username> -p < database/seeds/sampleData.sql
     ```

5. Run the application using Docker Compose:
   ```
   docker-compose up
   ```

## Usage
- Access the frontend application at `http://localhost:3000`.
- Use the provided forms to create and manage sales entries.
- Monitor product pricing and track sales data effectively.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.