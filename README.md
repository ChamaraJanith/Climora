# 🏢 Climora - Shelter Management System

![Node.js](https://img.shields.io/badge/Node.js-v14+-green?style=flat-square)
![Express](https://img.shields.io/badge/Express.js-4.0+-blue?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=flat-square)
![Jest](https://img.shields.io/badge/Jest-Testing-red?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)

## 📋 Overview

Climora is a disaster relief shelter management system designed to efficiently manage emergency shelters, track relief supplies, and monitor shelter capacity during crisis situations. It provides real-time weather integration, emergency alerts, and comprehensive inventory management.

---

## 📑 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Data Models](#-data-models)
- [API Endpoints](#-api-endpoints)
- [Installation & Setup](#-installation--setup)
- [Running the Project](#-running-the-project)
- [Testing](#-testing)
- [API Usage Examples](#-api-usage-examples)
- [Error Handling](#-error-handling)
- [Technologies Used](#-technologies-used)

---

## ⭐ Features

### 🏠 Shelter Management
- ✅ Create, read, update, and delete shelter records
- ✅ Track real-time shelter capacity (current vs total)
- ✅ Monitor shelter risk levels (low, medium, high)
- ✅ Support multiple shelter types (school, temple, community hall, other)
- ✅ Store geographic coordinates (latitude/longitude) for mapping
- ✅ Maintain facility information for each shelter
- ✅ Track contact persons and phone numbers

### 📦 Relief Items Management
- ✅ Add and manage relief supplies inventory
- ✅ Track supply categories: food, medicine, water, clothes, hygiene, battery, other
- ✅ Monitor quantities and units (kg, liters, pieces, units)
- ✅ Set and track expiry dates
- ✅ Prioritize items (normal, urgent)
- ✅ Increase/decrease stock levels
- ✅ Remove expired or distributed items

### 🚨 Emergency Alerts
- ✅ Create emergency alerts
- ✅ Retrieve all active alerts
- ✅ Retrieve alert by ID
- ✅ Update alert details
- ✅ Delete alerts
- ✅ Filter alerts by district and severity
- ✅ Manage active/inactive alerts

**Alert Categories:**
- `FLOOD` • `STORM` • `HEATWAVE` • `LANDSLIDE`

**Severity Levels:**
- `LOW` • `MEDIUM` • `HIGH` • `CRITICAL`

### 🌤️ Weather API Integration
- ✅ Fetch current weather data
- ✅ Fetch weather forecast
- ✅ Monitor rainfall, temperature, and wind speed
- ✅ Calculate a custom climate risk level

#### Risk Calculation Logic
The backend processes weather data and calculates a dynamic risk level based on:
- Temperature
- Wind speed
- Rain presence

**Risk Levels:** `LOW` • `MEDIUM` • `HIGH` • `CRITICAL`

> This ensures the system does not only display third-party data but also applies backend business logic.

---

## 🚀 Quick Start

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (see Installation & Setup)
# Then start the server
npm run dev
```

The server will start on `http://localhost:5000`

---

## 📁 Project Structure

```
backend/
├── models/
│   ├── Shelter.js                    # Shelter and Relief Item schemas
│   ├── ShelterCounter.js             # Auto-incrementing, formatted Shelter ID
│   ├── Alert.js                      # Emergency Alert schema
│   ├── Article.js                    # Article model
│   └── User.js                       # User authentication model
├── controller/
│   ├── shelterController.js          # Business logic for shelter operations
│   ├── alertController.js            # Emergency Alert CRUD logic
│   ├── weatherController.js          # Weather API & risk logic
│   ├── authController.js             # Authentication logic
│   ├── articleController.js          # Article management
│   ├── checklistController.js        # Checklist management
│   └── quizController.js             # Quiz management
├── services/
│   └── weatherService.js             # Third-party API integration
├── routes/
│   ├── shelterRoutes.js              # Shelter API routes
│   ├── alertRoutes.js                # Emergency Alert routes
│   ├── weatherRoutes.js              # Weather API routes
│   ├── authRoutes.js                 # Authentication routes
│   ├── articleRoutes.js              # Article routes
│   ├── checklistRoutes.js            # Checklist routes
│   ├── quizRoutes.js                 # Quiz routes
│   └── testroutes.js                 # Test routes
├── middleware/
│   └── authMiddleware.js             # JWT authentication middleware
├── tests/
│   └── unit/
│       ├── shelterController.test.js # Controller unit tests
│       └── testUtils/
│           └── mockExpress.js        # Mock utilities for testing Express
├── server.js                         # Main server file
├── jest.config.js                    # Jest configuration
└── package.json                      # Dependencies and scripts
```


---

## 📊 Data Models

### 🏠 Shelter Schema

> **Note:** Public identifier is `shelterId` (e.g., `KALUTARA-KL0001`), generated automatically per district.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `shelterId` | String | ✅ | Auto-generated | Formatted shelter code (e.g., KALUTARA-KL0001), unique |
| `name` | String | ✅ | - | Shelter name |
| `description` | String | ❌ | - | Shelter details |
| `address` | String | ✅ | - | Physical address |
| `district` | String | ✅ | - | District location |
| `lat` | Number | ✅ | - | Latitude coordinate |
| `lng` | Number | ✅ | - | Longitude coordinate |
| `capacityTotal` | Number | ✅ | - | Maximum capacity |
| `capacityCurrent` | Number | ❌ | 0 | Current occupancy |
| `isActive` | Boolean | ❌ | true | Active status |
| `type` | String | ❌ | "other" | Enum: school, temple, communityHall, other |
| `riskLevel` | String | ❌ | "low" | Enum: low, medium, high |
| `facilities` | [String] | ❌ | [] | Available facilities |
| `reliefItems` | [ReliefItem] | ❌ | [] | Inventory of supplies |
| `contactPerson` | String | ❌ | - | Primary contact name |
| `contactPhone` | String | ❌ | - | Contact phone |
| `contactEmail` | String | ❌ | - | Contact email |
| `currentOccupantsCount` | Number | ❌ | 0 | Current number of occupants |
| `lastUpdatedBy` | String | ❌ | - | Username of last editor |

### 📦 Relief Item Schema (Sub-Document)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | String | ✅ | - | Item name |
| `category` | String | ❌ | "other" | Enum: food, medicine, water, clothes, hygiene, battery, other |
| `quantity` | Number | ❌ | 0 | Current quantity |
| `unit` | String | ❌ | "units" | Enum: kg, liters, pieces, units |
| `expiryDate` | Date | ❌ | - | Item expiry date |
| `priorityLevel` | String | ❌ | "normal" | Enum: normal, urgent |
| `lastUpdated` | Date | ❌ | now | Last update timestamp |

### 🔢 ShelterCounter Schema

Used internally to generate per-district incremental IDs like `KALUTARA-KL0001`, `BADULLA-BD0001`, etc.

| Field | Type | Description |
|-------|------|-------------|
| `key` | String | District-based key (e.g., KALUTARA-KL), unique |
| `seq` | Number | Incrementing sequence for that key |

### 🚨 Emergency Alert Schema

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Alert title |
| `description` | String | Alert description |
| `category` | String | FLOOD, STORM, HEATWAVE, LANDSLIDE |
| `severity` | String | LOW, MEDIUM, HIGH, CRITICAL |
| `area.district` | String | District location |
| `area.city` | String | City location |
| `startAt` | Date | Start time |
| `endAt` | Date | End time |
| `isActive` | Boolean | Active status |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

---

## 🔌 API Endpoints

### 🏠 Shelter CRUD Operations

#### Get All Shelters
```http
GET /api/shelters
```
**Response:** Array of all shelter objects

#### Get Shelter by ID
```http
GET /api/shelters/:id
```
**Path Parameter:**
- `:id` - Shelter ID (formatted shelterId, e.g., `KALUTARA-KL0001`)

**Response:** Single shelter object

#### Create New Shelter
```http
POST /api/shelters
Content-Type: application/json
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
  "contactPhone": "+94112345678",
  "contactEmail": "john@example.com"
}
```
**Response:** Created shelter object with auto-generated `shelterId` (e.g., `COLOMBO-CB0001`)

#### Update Shelter
```http
PUT /api/shelters/:id
Content-Type: application/json
```
**Path Parameter:**
- `:id` - Shelter ID (e.g., `KALUTARA-KL0001`)

**Request Body:** Partial or complete shelter data

**Response:** Updated shelter object

#### Delete Shelter
```http
DELETE /api/shelters/:id
```
**Path Parameter:**
- `:id` - Shelter ID (e.g., `KALUTARA-KL0001`)

**Response:** 
```json
{ "message": "Shelter deleted successfully" }
```

---

### 📦 Relief Items Management

#### Update or Add Relief Item
```http
PUT /api/shelters/:id/items/:itemName
Content-Type: application/json
```
**Path Parameters:**
- `:id` - Shelter ID
- `:itemName` - Item name to update or create

**Request Body:**
```json
{
  "name": "Rice",
  "category": "food",
  "quantity": 100,
  "unit": "kg",
  "priorityLevel": "urgent",
  "expiryDate": "2026-12-31"
}
```
**Response:** Shelter object with updated reliefItems

#### Increase Item Quantity
```http
PUT /api/shelters/:id/items/:itemName/increase
Content-Type: application/json
```
**Path Parameters:**
- `:id` - Shelter ID
- `:itemName` - Item name

**Request Body:**
```json
{
  "amount": 50
}
```
> If `amount` is omitted, default is `1`

**Response:** Updated item object

#### Decrease Item Quantity
```http
PUT /api/shelters/:id/items/:itemName/decrease
Content-Type: application/json
```
**Path Parameters:**
- `:id` - Shelter ID
- `:itemName` - Item name

**Request Body:**
```json
{
  "amount": 20
}
```
> If `amount` is omitted, default is `1`. Quantity will not go below 0.

**Response:** Updated item object

#### Delete Relief Item
```http
DELETE /api/shelters/:id/items/:itemName
```
**Path Parameters:**
- `:id` - Shelter ID
- `:itemName` - Item name to delete

**Response:**
```json
{ "message": "Item removed from shelter" }
```

---

### 🚨 Emergency Alerts CRUD Operations

#### Get All Alerts
```http
GET /api/alerts
```
**Query Parameters (optional):**
- `district` - Filter by district
- `severity` - Filter by severity

**Example:**
```
GET /api/alerts?district=Colombo&severity=HIGH
```

**Response:** Array of all alert objects

#### Get Alert by ID
```http
GET /api/alerts/:id
```
**Path Parameter:**
- `:id` - MongoDB alert ID

**Response:** Single alert object

#### Create New Alert
```http
POST /api/alerts
Content-Type: application/json
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

#### Update Alert
```http
PUT /api/alerts/:id
Content-Type: application/json
```
**Path Parameter:**
- `:id` - MongoDB alert ID

**Request Body:** Partial or complete alert data

**Response:** Updated alert object

#### Delete Alert
```http
DELETE /api/alerts/:id
```
**Path Parameter:**
- `:id` - MongoDB alert ID

**Response:**
```json
{ "message": "Alert deleted successfully" }
```

---

### 🌤️ Weather API Integration

#### Get Current Weather
```http
GET /api/weather/current?lat=6.9271&lon=79.8612
```
**Query Parameters:**
- `lat` - Latitude
- `lon` - Longitude

**Response:** Current weather details including temperature, humidity, wind speed, and condition

#### Get Weather Forecast
```http
GET /api/weather/forecast?lat=6.9271&lon=79.8612
```
**Query Parameters:**
- `lat` - Latitude
- `lon` - Longitude

**Response:** Forecast weather data

#### Get Calculated Risk Level
```http
GET /api/weather/risk?lat=6.9271&lon=79.8612
```
**Query Parameters:**
- `lat` - Latitude
- `lon` - Longitude

**Response:**
```json
{
  "riskLevel": "HIGH",
  "score": 2
}
```


---

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB database
- OpenWeather API key (for weather features)

### Setup Steps

#### 1. Navigate to backend folder
```bash
cd backend
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Create environment variables
Create a `.env` file in the backend directory:

```env
# Database
MONGO_URI=your_mongodb_connection_string
PORT=5000

# Weather API
WEATHER_API_KEY=your_weather_api_key
WEATHER_BASE_URL=http://api.openweathermap.org/data/2.5

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# External APIs (Optional)
YOUTUBE_API_KEY=your_youtube_api_key
```

---

## 🚀 Running the Project

### Development mode (with auto-reload)
```bash
npm run dev
```

### Production mode
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

---

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Test Files

- **Controller Tests:** `tests/unit/shelterController.test.js` – Controller unit tests
- **Mock Utilities:** `tests/unit/testUtils/mockExpress.js` – Mock utilities for testing Express

---

## 📝 API Usage Examples

### Shelter Management Examples

#### Create a New Shelter
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
    "contactPhone": "+94112233445"
  }'
```

#### Get All Shelters
```bash
curl http://localhost:5000/api/shelters
```

#### Get Specific Shelter (by shelterId)
```bash
curl http://localhost:5000/api/shelters/KALUTARA-KL0001
```

#### Update Shelter Capacity
```bash
curl -X PUT http://localhost:5000/api/shelters/KALUTARA-KL0001 \
  -H "Content-Type: application/json" \
  -d '{
    "capacityCurrent": 150
  }'
```

#### Add Relief Item to Shelter
```bash
curl -X PUT http://localhost:5000/api/shelters/KALUTARA-KL0001/items/Rice \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rice",
    "category": "food",
    "quantity": 200,
    "unit": "kg",
    "priorityLevel": "urgent"
  }'
```

#### Increase Item Quantity
```bash
curl -X PUT http://localhost:5000/api/shelters/KALUTARA-KL0001/items/Rice/increase \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50
  }'
```

#### Delete Shelter
```bash
curl -X DELETE http://localhost:5000/api/shelters/KALUTARA-KL0001
```

---

### Emergency Alerts & Weather Integration Examples

#### Create a New Alert
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

#### Get All Alerts
```bash
curl http://localhost:5000/api/alerts
```

#### Get Specific Alert
```bash
curl http://localhost:5000/api/alerts/64a7f3b9d8c1e2f5g3h4i5j6
```

#### Update Alert Severity
```bash
curl -X PUT http://localhost:5000/api/alerts/64a7f3b9d8c1e2f5g3h4i5j6 \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "CRITICAL"
  }'
```

#### Delete Alert
```bash
curl -X DELETE http://localhost:5000/api/alerts/64a7f3b9d8c1e2f5g3h4i5j6
```

#### Get Current Weather
```bash
curl "http://localhost:5000/api/weather/current?lat=6.9271&lon=79.8612"
```

#### Get Weather Forecast
```bash
curl "http://localhost:5000/api/weather/forecast?lat=6.9271&lon=79.8612"
```

#### Get Calculated Risk Level
```bash
curl "http://localhost:5000/api/weather/risk?lat=6.9271&lon=79.8612"
```


---

## ⚠️ Error Handling

All API endpoints return standardized error responses:

```json
{
  "error": "Error description",
  "details": "Additional error details (if applicable)"
}
```

### Common HTTP Status Codes

| Status Code | Meaning |
|-------------|---------|
| `200` | ✅ Success |
| `201` | ✅ Created |
| `400` | ❌ Bad Request |
| `404` | ❌ Not Found |
| `500` | ❌ Server Error |

---

## 🛠️ Technologies Used

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB with Mongoose |
| **Testing** | Jest |
| **Auto-reload** | Nodemon |
| **HTTP Client** | Axios |
| **Environment** | dotenv |
| **Middleware** | CORS |
| **Password Security** | bcryptjs |
| **Authentication** | JSON Web Token (JWT) |

---

