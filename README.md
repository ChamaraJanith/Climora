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

### 🔔 Emergency Alerts
- Create emergency alerts
- Retrieve all active alerts
- Retrieve alert by ID
- Update alert details
- Delete alerts
- Filter alerts by district and severity
- Manage active/inactive alerts

#### Alert Categories:
- FLOOD
- STORM
- HEATWAVE
- LANDSLIDE

#### Severity Levels:
- LOW
- MEDIUM
- HIGH
- CRITICAL

### 🌦 Weather API Integration

This system integrates the **OpenWeather API** to:

- Fetch current weather data
- Fetch weather forecast
- Monitor rainfall, temperature, and wind speed
- Calculate a custom climate risk level

### ⚠ Risk Calculation Logic

The backend processes weather data and calculates a dynamic risk level based on:

- Temperature
- Wind speed
- Rain presence

Risk levels:
- LOW
- MEDIUM
- HIGH
- CRITICAL

This ensures the system does not only display third-party data but also applies backend business logic.

---

## Project Structure

```
backend/
├── models/
│   ├── Shelter.js              # Shelter and Relief Item schemas
│   ├── Alert.js                # Emergency Alert schema
│   └── Article.js              # Article model
├── controller/
│   ├── shelterController.js    # Business logic for shelter operations
│   ├── alertController.js      # Emergency Alert CRUD logic
│   └── weatherController.js    # Weather API & risk logic
├── services/
│   └── weatherService.js       # Third-party API integration
├── routes/
│   ├── shelterRoutes.js        # Shelter API routes
│   ├── alertRoutes.js          # Emergency Alert routes
│   ├── weatherRoutes.js        # Weather API routes
│   └── testroutes.js
├── tests/
│   └── unit/
│       ├── shelterController.test.js
│       └── testUtils/
│           └── mockExpress.js
├── server.js
├── jest.config.js
└── package.json
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


### Emergency Alert Schema

| Field | Type | Description |
|-------|------|-------------|
| title | String | Alert title |
| description | String | Alert description |
| category | String | FLOOD, STORM, HEATWAVE, LANDSLIDE |
| severity | String | LOW, MEDIUM, HIGH, CRITICAL |
| area.district | String | District location |
| area.city | String | City location |
| startAt | Date | Start time |
| endAt | Date | End time |
| isActive | Boolean | Active status |
| createdAt | Date | Timestamp |
| updatedAt | Date | Timestamp |

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

### Emergency Alerts CRUD Operations

#### Get All Alerts
```
GET /api/alerts
```
**Response:** Array of all alert objects

Optional Query Parameters:
- `district` (query): Filter by district  
- `severity` (query): Filter by severity  

Example:
```
GET /api/alerts?district=Colombo&severity=HIGH
```

---

#### Get Alert by ID
```
GET /api/alerts/:id
```
**Parameters:**  
- `id` (path): MongoDB alert ID  

**Response:** Single alert object

---

#### Create New Alert
```
POST /api/alerts
```

**Request Body:**
```json
{
  "title": "Flood Warning",
  "description": "Heavy rainfall expected in low-lying areas.",
  "category": "FLOOD",
  "severity": "HIGH",
  "area": {
    "district": "Colombo",
    "city": "Kaduwela"
  },
  "startAt": "2026-02-13T04:00:00Z",
  "endAt": "2026-02-14T04:00:00Z",
  "isActive": true
}
```

**Response:** Created alert object with ID

---

#### Update Alert
```
PUT /api/alerts/:id
```
**Parameters:**  
- `id` (path): MongoDB alert ID  

**Request Body:** Partial or complete alert data to update  

**Response:** Updated alert object

---

#### Delete Alert
```
DELETE /api/alerts/:id
```
**Parameters:**  
- `id` (path): MongoDB alert ID  

**Response:** `{ "message": "Alert deleted successfully" }`

---

### Weather API Integration

#### Get Current Weather
```
GET /api/weather/current?lat=6.9271&lon=79.8612
```

**Parameters:**
- `lat` (query): Latitude
- `lon` (query): Longitude

**Response:** Current weather details including temperature, humidity, wind speed, and condition.

---

#### Get Weather Forecast
```
GET /api/weather/forecast?lat=6.9271&lon=79.8612
```

**Parameters:**
- `lat` (query): Latitude
- `lon` (query): Longitude

**Response:** Forecast weather data.

---

#### Get Calculated Risk Level
```
GET /api/weather/risk?lat=6.9271&lon=79.8612
```

**Parameters:**
- `lat` (query): Latitude
- `lon` (query): Longitude

**Response:**
```json
{
  "riskLevel": "HIGH",
  "score": 2
}
```

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

   WEATHER_API_KEY=your_weather_api_key
   WEATHER_BASE_URL=http://api.openweathermap.org/data/2.5

   JWT_SECRET=your_jwt_secret    
   JWT_EXPIRES_IN=days

   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   YOUTUBE_API_KEY=your_youtube_api_key

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

---

## API Usage Examples (Emergency Alerts & Weather Integration)

### Create a New Alert
```bash
curl -X POST http://localhost:5000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Flood Warning",
    "description": "Heavy rainfall expected in low-lying areas.",
    "category": "FLOOD",
    "severity": "HIGH",
    "area": {
      "district": "Colombo",
      "city": "Kaduwela"
    },
    "startAt": "2026-02-13T04:00:00Z",
    "endAt": "2026-02-14T04:00:00Z",
    "isActive": true
  }'
```

---

### Get All Alerts
```bash
curl http://localhost:5000/api/alerts
```

---

### Get Specific Alert
```bash
curl http://localhost:5000/api/alerts/64a7f3b9d8c1e2f5g3h4i5j6
```

---

### Update Alert Severity
```bash
curl -X PUT http://localhost:5000/api/alerts/64a7f3b9d8c1e2f5g3h4i5j6 \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "CRITICAL"
  }'
```

---

### Delete Alert
```bash
curl -X DELETE http://localhost:5000/api/alerts/64a7f3b9d8c1e2f5g3h4i5j6
```

---

### Get Current Weather
```bash
curl "http://localhost:5000/api/weather/current?lat=6.9271&lon=79.8612"
```

---

### Get Weather Forecast
```bash
curl "http://localhost:5000/api/weather/forecast?lat=6.9271&lon=79.8612"
```

---

### Get Calculated Risk Level
```bash
curl "http://localhost:5000/api/weather/risk?lat=6.9271&lon=79.8612"
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
- **HTTP Client:** Axios (for Third-Party API integration)
- **Environment Management:** dotenv
- **Middleware:** CORS
- **Authentication Security:** bcryptjs
- **Authentication:** JSON Web Token (JWT)


---

## License