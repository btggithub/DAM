# Domain and Account Management (DAM) System

A web application for tracking hosting providers, domains, and websites. This system helps you manage all your web hosting accounts, domain registrations, and website details in one place.

## Features

- **Provider Management**: Track both hosting and domain providers
  - Store provider name, account credentials, and expiry dates
  - View domains registered and websites hosted with each provider

- **Domain Management**: Track all your domain names
  - Store domain registration, expiry dates, and auto-renewal status
  - Up to 4 nameservers per domain
  - Expiry date notifications
  - Link domains to their registrar

- **Website Management**: Track all your websites
  - Associate websites with domains and hosting providers
  - Store hosting package details and IP addresses

- **Dashboard**: View important information at a glance
  - See domains expiring soon
  - Overview of providers, domains, and websites

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: MySQL
- **Frontend**: React
- **API**: RESTful API

## Installation and Setup

### Prerequisites

- Node.js (v14 or later)
- MySQL (v5.7 or later)
- npm or yarn

### Database Setup

1. Create a MySQL database:

```sql
CREATE DATABASE u265890320_dam_db;
```

2. Import the schema from `database-schema.sql` file:

```bash
mysql -u your_username -p u265890320_dam_db < database-schema.sql
```

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your database configuration:

```
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=u265890320_dam_db
PORT=3000
CORS_ORIGIN=http://localhost:3001
```

4. Start the backend server:

```bash
npm start
```

The API will be available at `http://localhost:3000/api`.

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with the API URL:

```
REACT_APP_API_URL=http://localhost:3000/api
PORT=3001
```

4. Start the frontend development server:

```bash
npm start
```

The application will be available at `http://localhost:3001`.

## API Endpoints

### Providers

- `GET /api/providers` - Get all providers
- `GET /api/providers/:id` - Get provider by ID
- `POST /api/providers` - Add new provider
- `PUT /api/providers/:id` - Update provider
- `DELETE /api/providers/:id` - Delete provider
- `GET /api/providers/:id/domains` - Get domains by provider
- `GET /api/providers/:id/websites` - Get websites by provider

### Domains

- `GET /api/domains` - Get all domains
- `GET /api/domains/:id` - Get domain by ID
- `POST /api/domains` - Add new domain
- `PUT /api/domains/:id` - Update domain
- `DELETE /api/domains/:id` - Delete domain

### Websites

- `GET /api/websites` - Get all websites
- `GET /api/websites/:id` - Get website by ID
- `POST /api/websites` - Add new website
- `PUT /api/websites/:id` - Update website
- `DELETE /api/websites/:id` - Delete website

### Statistics

- `GET /api/stats` - Get system statistics

## Project Structure

```
project-root/
├── backend/
│   ├── server.js          # Main server file
│   ├── package.json       # Backend dependencies
│   └── .env               # Environment variables
│
├── frontend/
│   ├── public/            # Static files
│   │   ├── index.html     # HTML template
│   │   └── manifest.json  # Web app manifest
│   │
│   ├── src/               # React source code
│   │   ├── components/    # React components
│   │   │   ├── Dashboard.js
│   │   │   ├── domains/   # Domain-related components
│   │   │   │   ├── DomainList.js
│   │   │   │   ├── DomainForm.js
│   │   │   │   └── DomainDetail.js
│   │   │   │
│   │   │   ├── providers/ # Provider-related components
│   │   │   │   ├── ProviderList.js
│   │   │   │   ├── ProviderForm.js
│   │   │   │   └── ProviderDetail.js
│   │   │   │
│   │   │   └── websites/  # Website-related components
│   │   │       ├── WebsiteList.js
│   │   │       ├── WebsiteForm.js
│   │   │       └── WebsiteDetail.js
│   │   │
│   │   ├── App.js         # Main application component
│   │   ├── App.css        # Main stylesheet
│   │   ├── index.js       # Application entry point
│   │   └── reportWebVitals.js
│   │
│   ├── package.json       # Frontend dependencies
│   └── .env               # Environment variables
│
├── database-schema.sql    # Database schema
└── README.md              # Project documentation
```

## Security Considerations

- In a production environment, ensure you:
  - Use HTTPS for all connections
  - Implement proper authentication and authorization
  - Securely store passwords using bcrypt or similar
  - Set up a proper CORS policy
  - Use environment variables for sensitive data

## License

This project is licensed under the MIT License.