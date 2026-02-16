# Climora - Shelter Management System

## Overview

Climora is a disaster relief shelter management system designed to efficiently manage emergency shelters, track relief supplies, and monitor shelter capacity during crisis situations.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Installation & Setup](#installation--setup)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [API Usage Examples](#api-usage-examples)

---

## Features

### Shelter Management
- Create, read, update, and delete shelter records
- Track real-time shelter capacity (current vs total)
- Monitor shelter risk levels (low, medium, high)
- Support multiple shelter types (school, temple, community hall, other)
- Store geographic coordinates (latitude/longitude) for mapping
- Maintain facility information for each shelter
- Track contact persons and phone numbers

### Relief Items Management
- Add and manage relief supplies inventory
- Track supply categories: food, medicine, water, clothes, hygiene, battery, other
- Monitor quantities and units (kg, liters, pieces, units)
- Set and track expiry dates
- Prioritize items (normal, urgent)
- Increase/decrease stock levels
- Remove expired or distributed items

---

## Project Structure

```
backend/
├── models/
│   ├── Shelter.js              # Shelter and Relief Item schemas
│   └── Article.js              # Article model
├── controller/
│   └── shelterController.js     # Business logic for shelter operations
├── routes/
│   ├── shelterRoutes.js         # Shelter API routes
│   └── testroutes.js            # Test routes
├── tests/
│   └── unit/
│       ├── shelterController.test.js
│       └── testUtils/
│           └── mockExpress.js   # Mock utilities for testing
├── server.js                    # Express server setup
├── jest.config.js               # Jest testing configuration
└── package.json                 # Project dependencies
```

---

## Data Models

### Shelter Schema

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| name | String | Shelter name | ✓ |
| description | String | Shelter details | |
| address | String | Physical address | ✓ |
| district | String | District location | ✓ |
| lat | Number | Latitude coordinate | ✓ |
| lng | Number | Longitude coordinate | ✓ |
| capacityTotal | Number | Maximum capacity | ✓ |
| capacityCurrent | Number | Current occupancy | Default: 0 |
| isActive | Boolean | Active status | Default: true |
| type | String | Enum: school, temple, communityHall, other | Default: other |
| riskLevel | String | Enum: low, medium, high | Default: low |
| facilities | [String] | Available facilities | |
| reliefItems | [ReliefItem] | Inventory of supplies | |
| contactPerson | String | Primary contact name | |
| phoneNumber | String | Contact phone | |

### Relief Item Schema (Sub-Document)

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| name | String | Item name | ✓ |
| category | String | Enum: food, medicine, water, clothes, hygiene, battery, other | Default: other |
| quantity | Number | Current quantity | Default: 0 |
| unit | String | Enum: kg, liters, pieces, units | Default: units |
| expiryDate | Date | Item expiry date | |
| priorityLevel | String | Enum: normal, urgent | Default: normal |
| lastUpdated | Date | Last update timestamp | Default: now |

---

## API Endpoints

### Shelter CRUD Operations

#### Get All Shelters
```
GET /api/shelters
```
**Response:** Array of all shelter objects

#### Get Shelter by ID
```
GET /api/shelters/:id
```
**Parameters:** 
- `id` (path): MongoDB shelter ID

**Response:** Single shelter object

#### Create New Shelter
```
POST /api/shelters
```
**Request Body:**
```json
{
  "name": "Central Relief Camp",
  "description": "Main evacuation center",
  "address": "123 Main Street",
  "district": "Colombo",
  "lat": 6.9271,
  "lng": 80.7789,
  "capacityTotal": 500,
  "type": "communityHall",
  "riskLevel": "low",
  "facilities": ["water", "medical", "food"],
  "contactPerson": "John Doe",
  "phoneNumber": "+94112345678"
}
```
**Response:** Created shelter object with ID

#### Update Shelter
```
PUT /api/shelters/:id
```
**Parameters:** 
- `id` (path): MongoDB shelter ID

**Request Body:** Partial or complete shelter data to update

**Response:** Updated shelter object

#### Delete Shelter
```
DELETE /api/shelters/:id
```
**Parameters:** 
- `id` (path): MongoDB shelter ID

**Response:** `{ "message": "Shelter deleted successfully" }`

---

### Relief Items Management

#### Update or Add Relief Item
```
PUT /api/shelters/:id/items/:itemName
```
**Parameters:** 
- `id` (path): Shelter ID
- `itemName` (path): Item name to update

**Request Body:**
```json
{
  "name": "Rice",
  "category": "food",
  "quantity": 100,
  "unit": "kg",
  "priorityLevel": "urgent"
}
```

#### Increase Item Quantity
```
PUT /api/shelters/:id/items/:itemName/increase
```
**Parameters:** 
- `id` (path): Shelter ID
- `itemName` (path): Item name

**Request Body:**
```json
{
  "quantity": 50
}
```

#### Decrease Item Quantity
```
PUT /api/shelters/:id/items/:itemName/decrease
```
**Parameters:** 
- `id` (path): Shelter ID
- `itemName` (path): Item name

**Request Body:**
```json
{
  "quantity": 20
}
```

#### Delete Relief Item
```
DELETE /api/shelters/:id/items/:itemName
```
**Parameters:** 
- `id` (path): Shelter ID
- `itemName` (path): Item name to delete

**Response:** Shelter object after item deletion

---

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB database

### Steps

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment variables:**
   ```bash
   # Create .env file in backend directory
   MONGO_URI=your_mongodb_connection_string
   PORT=5000
   ```

---

## Running the Project

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

---

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Test Files
- `tests/unit/shelterController.test.js` - Controller unit tests
- `tests/unit/testUtils/mockExpress.js` - Mock utilities for testing Express

---

## API Usage Examples

### Create a New Shelter
```bash
curl -X POST http://localhost:5000/api/shelters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emergency Shelter A",
    "address": "456 Relief Avenue",
    "district": "Galle",
    "lat": 6.0535,
    "lng": 80.2210,
    "capacityTotal": 300,
    "type": "school",
    "contactPerson": "Jane Smith",
    "phoneNumber": "+94112233445"
  }'
```

### Get All Shelters
```bash
curl http://localhost:5000/api/shelters
```

### Get Specific Shelter
```bash
curl http://localhost:5000/api/shelters/64a7f3b9d8c1e2f5g3h4i5j6
```

### Update Shelter Capacity
```bash
curl -X PUT http://localhost:5000/api/shelters/64a7f3b9d8c1e2f5g3h4i5j6 \
  -H "Content-Type: application/json" \
  -d '{
    "capacityCurrent": 150
  }'
```

### Add Relief Item to Shelter
```bash
curl -X PUT http://localhost:5000/api/shelters/64a7f3b9d8c1e2f5g3h4i5j6/items/Rice \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rice",
    "category": "food",
    "quantity": 200,
    "unit": "kg",
    "priorityLevel": "urgent"
  }'
```

### Increase Item Quantity
```bash
curl -X PUT http://localhost:5000/api/shelters/64a7f3b9d8c1e2f5g3h4i5j6/items/Rice/increase \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 50
  }'
```

### Delete Shelter
```bash
curl -X DELETE http://localhost:5000/api/shelters/64a7f3b9d8c1e2f5g3h4i5j6
```

---

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "error": "Error description",
  "details": "Additional error details (if applicable)"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error

---

## Technologies Used

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Testing:** Jest
- **Development:** Nodemon for auto-reload

---

## License

