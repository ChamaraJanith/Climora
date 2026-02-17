Climora - Shelter Management System
Overview
Climora is a disaster relief shelter management system designed to efficiently manage emergency shelters, track relief supplies, and monitor shelter capacity during crisis situations.

Table of Contents
Features

Project Structure

Data Models

API Endpoints

Installation & Setup

Running the Project

Testing

API Usage Examples

Technologies Used

License

Features
Shelter Management
Create, read, update, and delete shelter records

Track real-time shelter capacity (current vs total)

Monitor shelter risk levels (low, medium, high)

Support multiple shelter types (school, temple, community hall, other)

Store geographic coordinates (latitude/longitude) for mapping

Maintain facility information for each shelter

Track contact persons and phone numbers

Relief Items Management
Add and manage relief supplies inventory

Track supply categories: food, medicine, water, clothes, hygiene, battery, other

Monitor quantities and units (kg, liters, pieces, units)

Set and track expiry dates

Prioritize items (normal, urgent)

Increase/decrease stock levels

Remove expired or distributed items

Emergency Alerts
Create emergency alerts

Retrieve all active alerts

Retrieve alert by ID

Update alert details

Delete alerts

Filter alerts by district and severity

Manage active/inactive alerts

Alert Categories:

FLOOD

STORM

HEATWAVE

LANDSLIDE

Severity Levels:

LOW

MEDIUM

HIGH

CRITICAL

Weather API Integration
This system integrates the OpenWeather API to:

Fetch current weather data

Fetch weather forecast

Monitor rainfall, temperature, and wind speed

Calculate a custom climate risk level

Risk Calculation Logic
The backend processes weather data and calculates a dynamic risk level based on:

Temperature

Wind speed

Rain presence

Risk levels:

LOW

MEDIUM

HIGH

CRITICAL

This ensures the system does not only display third-party data but also applies backend business logic.

Project Structure
backend/
├── models/
│ ├── Shelter.js – Shelter and Relief Item schemas
│ ├── ShelterCounter.js – Auto-incrementing, formatted Shelter ID
│ ├── Alert.js – Emergency Alert schema
│ └── Article.js – Article model
├── controller/
│ ├── shelterController.js – Business logic for shelter operations
│ ├── alertController.js – Emergency Alert CRUD logic
│ └── weatherController.js – Weather API & risk logic
├── services/
│ └── weatherService.js – Third-party API integration
├── routes/
│ ├── shelterRoutes.js – Shelter API routes
│ ├── alertRoutes.js – Emergency Alert routes
│ ├── weatherRoutes.js – Weather API routes
│ └── testroutes.js
├── tests/
│ └── unit/
│ ├── shelterController.test.js
│ └── testUtils/
│ └── mockExpress.js
├── server.js
├── jest.config.js
└── package.json

Data Models
Shelter Schema
Note: Public identifier is shelterId (e.g. KALUTARA-KL0001), generated automatically per district.

Fields:

shelterId (String): Formatted shelter code (e.g. KALUTARA-KL0001), auto-generated, unique

name (String): Shelter name, required

description (String): Shelter details

address (String): Physical address, required

district (String): District location, required

lat (Number): Latitude coordinate, required

lng (Number): Longitude coordinate, required

capacityTotal (Number): Maximum capacity, required

capacityCurrent (Number): Current occupancy, default 0

isActive (Boolean): Active status, default true

type (String): Enum: school, temple, communityHall, other, default other

riskLevel (String): Enum: low, medium, high, default low

facilities ([String]): Available facilities

reliefItems ([ReliefItem]): Inventory of supplies

contactPerson (String): Primary contact name

contactPhone (String): Contact phone

contactEmail (String): Contact email

currentOccupantsCount (Number): Current number of occupants, default 0

lastUpdatedBy (String): Username / identifier of last editor

Relief Item Schema (Sub-Document)
Fields:

name (String): Item name, required

category (String): Enum: food, medicine, water, clothes, hygiene, battery, other, default other

quantity (Number): Current quantity, default 0

unit (String): Enum: kg, liters, pieces, units, default units

expiryDate (Date): Item expiry date

priorityLevel (String): Enum: normal, urgent, default normal

lastUpdated (Date): Last update timestamp, default now

ShelterCounter Schema
Used internally to generate per-district incremental IDs like KALUTARA-KL0001, BADULLA-BD0001, etc.

Fields:

key (String): District-based key (e.g. KALUTARA-KL), unique, required

seq (Number): Incrementing sequence for that key, default 0

Emergency Alert Schema
Fields:

title (String): Alert title

description (String): Alert description

category (String): FLOOD, STORM, HEATWAVE, LANDSLIDE

severity (String): LOW, MEDIUM, HIGH, CRITICAL

area.district (String): District location

area.city (String): City location

startAt (Date): Start time

endAt (Date): End time

isActive (Boolean): Active status

createdAt (Date): Timestamp

updatedAt (Date): Timestamp

API Endpoints
Shelter CRUD Operations
Get All Shelters
Method: GET
URL: /api/shelters
Response: Array of all shelter objects

Get Shelter by ID
Method: GET
URL: /api/shelters/:id
Path parameter:

id: Shelter ID (formatted shelterId, e.g. KALUTARA-KL0001)
Response: Single shelter object

Create New Shelter
Method: POST
URL: /api/shelters
Request body (JSON):

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

Response: Created shelter object with auto-generated shelterId (e.g. COLOMBO-CB0001)

Update Shelter
Method: PUT
URL: /api/shelters/:id
Path parameter:

id: Shelter ID (e.g. KALUTARA-KL0001)
Request body: Partial or complete shelter data
Response: Updated shelter object

Delete Shelter
Method: DELETE
URL: /api/shelters/:id
Path parameter:

id: Shelter ID (e.g. KALUTARA-KL0001)
Response (JSON):

{ "message": "Shelter deleted successfully" }

Relief Items Management
Update or Add Relief Item
Method: PUT
URL: /api/shelters/:id/items/:itemName
Path parameters:

id: Shelter ID

itemName: Item name to update or create
Request body (JSON):

{
"name": "Rice",
"category": "food",
"quantity": 100,
"unit": "kg",
"priorityLevel": "urgent",
"expiryDate": "2026-12-31"
}

Response: Shelter object with updated reliefItems

Increase Item Quantity
Method: PUT
URL: /api/shelters/:id/items/:itemName/increase
Path parameters:

id: Shelter ID

itemName: Item name
Request body (JSON):

{
"amount": 50
}

If amount is omitted, default is 1.
Response: Updated item object

Decrease Item Quantity
Method: PUT
URL: /api/shelters/:id/items/:itemName/decrease
Path parameters:

id: Shelter ID

itemName: Item name
Request body (JSON):

{
"amount": 20
}

If amount is omitted, default is 1. Quantity will not go below 0.
Response: Updated item object

Delete Relief Item
Method: DELETE
URL: /api/shelters/:id/items/:itemName
Path parameters:

id: Shelter ID

itemName: Item name to delete
Response (JSON):

{ "message": "Item removed from shelter" }

Emergency Alerts CRUD Operations
Get All Alerts
Method: GET
URL: /api/alerts
Response: Array of all alert objects

Optional query parameters:

district: Filter by district

severity: Filter by severity

Example:
GET /api/alerts?district=Colombo&severity=HIGH

Get Alert by ID
Method: GET
URL: /api/alerts/:id
Path parameter:

id: MongoDB alert ID
Response: Single alert object

Create New Alert
Method: POST
URL: /api/alerts
Request body (JSON):

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

Response: Created alert object with ID

Update Alert
Method: PUT
URL: /api/alerts/:id
Path parameter:

id: MongoDB alert ID
Request body: Partial or complete alert data
Response: Updated alert object

Delete Alert
Method: DELETE
URL: /api/alerts/:id
Path parameter:

id: MongoDB alert ID
Response (JSON):

{ "message": "Alert deleted successfully" }

Weather API Integration
Get Current Weather
Method: GET
URL: /api/weather/current?lat=6.9271&lon=79.8612
Query parameters:

lat: Latitude

lon: Longitude
Response: Current weather details including temperature, humidity, wind speed, and condition

Get Weather Forecast
Method: GET
URL: /api/weather/forecast?lat=6.9271&lon=79.8612
Query parameters:

lat: Latitude

lon: Longitude
Response: Forecast weather data

Get Calculated Risk Level
Method: GET
URL: /api/weather/risk?lat=6.9271&lon=79.8612
Query parameters:

lat: Latitude

lon: Longitude
Response (JSON):

{
"riskLevel": "HIGH",
"score": 2
}

Installation & Setup
Prerequisites:

Node.js (v14 or higher)

npm or yarn

MongoDB database

OpenWeather API key (for weather features)

Steps:

Navigate to backend folder:

cd backend

Install dependencies:

npm install

Create environment variables: create a .env file in the backend directory:

MONGO_URI=your_mongodb_connection_string
PORT=5000

WEATHER_API_KEY=your_weather_api_key
WEATHER_BASE_URL=http://api.openweathermap.org/data/2.5

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

YOUTUBE_API_KEY=your_youtube_api_key

Running the Project
Development mode (with auto-reload):

npm run dev

Production mode:

npm start

The server will start on http://localhost:5000 by default.

Testing
Run all tests:

npm test

Run tests with coverage:

npm test -- --coverage

Test files:

tests/unit/shelterController.test.js – Controller unit tests

tests/unit/testUtils/mockExpress.js – Mock utilities for testing Express

API Usage Examples
Create a New Shelter:

curl -X POST http://localhost:5000/api/shelters
-H "Content-Type: application/json"
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

Get All Shelters:

curl http://localhost:5000/api/shelters

Get Specific Shelter (by shelterId):

curl http://localhost:5000/api/shelters/KALUTARA-KL0001

Update Shelter Capacity:

curl -X PUT http://localhost:5000/api/shelters/KALUTARA-KL0001
-H "Content-Type: application/json"
-d '{
"capacityCurrent": 150
}'

Add Relief Item to Shelter:

curl -X PUT http://localhost:5000/api/shelters/KALUTARA-KL0001/items/Rice
-H "Content-Type: application/json"
-d '{
"name": "Rice",
"category": "food",
"quantity": 200,
"unit": "kg",
"priorityLevel": "urgent"
}'

Increase Item Quantity:

curl -X PUT http://localhost:5000/api/shelters/KALUTARA-KL0001/items/Rice/increase
-H "Content-Type: application/json"
-d '{
"amount": 50
}'

Delete Shelter:

curl -X DELETE http://localhost:5000/api/shelters/KALUTARA-KL0001

API Usage Examples (Emergency Alerts & Weather Integration)
Create a New Alert:

curl -X POST http://localhost:5000/api/alerts
-H "Content-Type: application/json"
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

Get All Alerts:

curl http://localhost:5000/api/alerts

Get Specific Alert:

curl http://localhost:5000/api/alerts/64a7f3b9d8c1e2f5g3h4i5j6

Update Alert Severity:

curl -X PUT http://localhost:5000/api/alerts/64a7f3b9d8c1e2f5g3h4i5j6
-H "Content-Type: application/json"
-d '{
"severity": "CRITICAL"
}'

Delete Alert:

curl -X DELETE http://localhost:5000/api/alerts/64a7f3b9d8c1e2f5g3h4i5j6

Get Current Weather:

curl "http://localhost:5000/api/weather/current?lat=6.9271&lon=79.8612"

Get Weather Forecast:

curl "http://localhost:5000/api/weather/forecast?lat=6.9271&lon=79.8612"

Get Calculated Risk Level:

curl "http://localhost:5000/api/weather/risk?lat=6.9271&lon=79.8612"

Error Handling
All API endpoints return standardized error responses:

{
"error": "Error description",
"details": "Additional error details (if applicable)"
}

Common HTTP Status Codes:

200 – Success

201 – Created

400 – Bad Request

404 – Not Found

500 – Server Error

Technologies Used
Runtime: Node.js

Framework: Express.js

Database: MongoDB with Mongoose

Testing: Jest

Development: Nodemon for auto-reload

HTTP Client: Axios (for third-party API integration)

Environment Management: dotenv

Middleware: CORS

Authentication Security: bcryptjs

Authentication: JSON Web Token (JWT)