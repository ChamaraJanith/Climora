# 🏢 Climora - Disaster Relief & Education Platform

![Node.js](https://img.shields.io/badge/Node.js-v14+-green?style=flat-square)
![Express](https://img.shields.io/badge/Express.js-4.0+-blue?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=flat-square)
![Jest](https://img.shields.io/badge/Jest-Testing-red?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)

## 📋 Overview

Climora is a comprehensive disaster relief and climate education platform designed to efficiently manage emergency shelters, educate communities, and provide real-time climate information. The system combines shelter management, relief supply tracking, educational articles with quizzes, emergency checklists, and climate news integration.

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
- [Performance Testing](#-performance--load-testing)
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

### 📍 Location-Based Services

- ✅ Find nearby shelters based on GPS coordinates
- ✅ Calculate distance between user location and shelters
- ✅ Calculate travel time using routing matrix service
- ✅ Sort shelters by proximity and accessibility
- ✅ Support location-based emergency response
- ✅ View shelter distribution across districts

### 📚 Educational Articles & Content

- ✅ Create and manage climate-related articles
- ✅ Support multiple disaster categories (flood, drought, cyclone, landslide, wildfire, tsunami, earthquake)
- ✅ Search articles by title and content
- ✅ Filter articles by category
- ✅ Associate articles with quizzes (one-to-one relationship)
- ✅ Fetch related YouTube videos based on article topic
- ✅ Track article statistics and engagement

**Article Categories:**

- `flood` • `drought` • `cyclone` • `landslide` • `wildfire` • `tsunami` • `earthquake` • `photochemical smog` • `general`

### 🎯 Interactive Quizzes

- ✅ Create quizzes linked to articles
- ✅ Support multiple-choice questions (4 options per question)
- ✅ Track quiz attempts and user scores
- ✅ Define passing score percentage
- ✅ Detailed result analysis with question-by-question feedback
- ✅ One quiz per article enforced
- ✅ Quiz statistics and performance tracking
- ✅ Support 1-20 questions per quiz

### ✅ Emergency Preparedness Checklists

- ✅ Admin creates disaster-specific checklists
- ✅ Define checklist items with categories and quantities
- ✅ Users mark items as completed
- ✅ Track individual progress per user per checklist
- ✅ Progress percentage calculations
- ✅ Support multiple disaster types
- ✅ Reset progress functionality

**Checklist Categories:**

- `food` • `water` • `medicine` • `clothing` • `tools` • `documents` • `other`

**Disaster Types:**

- `flood` • `drought` • `cyclone` • `landslide` • `wildfire` • `tsunami` • `earthquake` • `general`

### 🌍 Climate News Integration

- ✅ Fetch real-time climate and disaster news from NewsData.io API
- ✅ Strict content filtering (removes sports, politics, lifestyle noise)
- ✅ Automatic climate category detection with AI-like pattern matching
- ✅ Sri Lanka-specific news filtering
- ✅ Comprehensive blacklist against false positives
- ✅ 30-minute cache to avoid API rate limits
- ✅ Filter by category and region (Sri Lanka / World)
- ✅ Manual refresh and cleanup operations for admins
- ✅ Never displays sports team names, financial news, or metaphorical usage

**Climate News Categories:**

- `flood` • `drought` • `cyclone` • `earthquake` • `tsunami` • `wildfire` • `storm` • `landslide` • `general`

### 📊 User Engagement Analytics

- ✅ Track quiz attempt history per user
- ✅ Calculate quiz performance metrics
- ✅ Measure checklist completion progress
- ✅ Generate content engagement statistics
- ✅ Article view and category analytics

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
│   ├── ShelterOccupancy.js           # Shelter Occupancy snapshot schema
│   ├── ReliefItems.js                # Standalone Relief Items model
│   ├── Alert.js                      # Emergency Alert schema
│   ├── Article.js                    # Article model with quiz linking
│   ├── Quiz.js                       # Quiz model with article reference
│   ├── QuizAttempt.js                # User quiz attempt tracking
│   ├── Checklist.js                  # Admin-created checklist template
│   ├── UserChecklistProgress.js      # User's checklist progress tracking
│   ├── ClimateNews.js                # Climate news cache from API
│   ├── Report.js                     # Incident Report model
│   └── User.js                       # User authentication model
├── controller/
│   ├── shelterController.js          # Business logic for shelter operations
│   ├── reliefItemController.js       # Relief item CRUD & stock logic
│   ├── shelterOccupancyController.js # Occupancy snapshots & safety flags
│   ├── alertController.js            # Emergency Alert CRUD logic
│   ├── weatherController.js          # Weather API & risk logic
│   ├── authController.js             # Authentication logic
│   ├── articleController.js          # Article CRUD + YouTube integration
│   ├── quizController.js             # Quiz CRUD + submission & scoring
│   ├── checklistController.js        # Admin checklist management
│   ├── userChecklistController.js    # User checklist progress tracking
│   ├── climateNewsController.js      # Climate news fetch & filtering
│   └── reportController.js           # Incident report management
├── services/
│   ├── weatherService.js             # Third-party Weather API integration
│   ├── routingService.js             # Travel matrix / distance routing service
│   └── climateNewsAPI.js             # NewsData.io API integration
├── routes/
│   ├── shelterRoutes.js              # Shelter, Relief Items & Occupancy routes
│   ├── alertRoutes.js                # Emergency Alert routes
│   ├── weatherRoutes.js              # Weather API routes
│   ├── authRoutes.js                 # Authentication routes
│   ├── articleRoutes.js              # Article + quiz submission routes
│   ├── quizRoutes.js                 # Quiz CRUD routes (admin)
│   ├── checklistRoutes.js            # Checklist admin routes
│   ├── userChecklistRoutes.js        # User checklist progress routes
│   ├── climateNewsRoutes.js          # Climate news routes
│   └── reportRoutes.js               # Incident report routes
├── middleware/
│   ├── authMiddleware.js             # JWT authentication middleware
│   └── roleMiddleware.js             # Role-based access control middleware
├── tests/
│   ├── unit/
│   │   ├── shelterController.test.js         # Shelter controller unit tests
│   │   ├── reliefItemController.test.js      # Relief item controller unit tests
│   │   ├── shelterOccupancyController.test.js# Occupancy controller unit tests
│   │   └── testUtils/
│   │       └── mockExpress.js                # Mock utilities for testing Express
│   ├── integration/
│   │   ├── shelters.int.test.js              # Shelter route integration tests
│   │   ├── reliefItems.int.test.js           # Relief item route integration tests
│   │   └── shelterOccupancy.int.test.js      # Occupancy route integration tests
│   └── utils/
│       └── testApp.js                        # Express test app factory
├── performance/                      # Performance test results directory
├── artillery-shelters-full.yml       # Artillery load test configuration
├── server.js                         # Main server file
├── jest.config.js                    # Jest configuration
└── package.json                      # Dependencies and scripts
```

---

## 📊 Data Models

### 🏠 Shelter Schema

> **Note:** Public identifier is `shelterId` (e.g., `KALUTARA-KL0001`), generated automatically per district.

| Field                   | Type         | Required | Default        | Description                                            |
| ----------------------- | ------------ | -------- | -------------- | ------------------------------------------------------ |
| `shelterId`             | String       | ✅       | Auto-generated | Formatted shelter code (e.g., KALUTARA-KL0001), unique |
| `name`                  | String       | ✅       | -              | Shelter name                                           |
| `description`           | String       | ❌       | -              | Shelter details                                        |
| `address`               | String       | ✅       | -              | Physical address                                       |
| `district`              | String       | ✅       | -              | District location                                      |
| `lat`                   | Number       | ✅       | -              | Latitude coordinate                                    |
| `lng`                   | Number       | ✅       | -              | Longitude coordinate                                   |
| `capacityTotal`         | Number       | ✅       | -              | Maximum capacity                                       |
| `capacityCurrent`       | Number       | ❌       | 0              | Current occupancy                                      |
| `isActive`              | Boolean      | ❌       | true           | Active status                                          |
| `type`                  | String       | ❌       | "other"        | Enum: school, temple, communityHall, other             |
| `riskLevel`             | String       | ❌       | "low"          | Enum: low, medium, high                                |
| `facilities`            | [String]     | ❌       | []             | Available facilities                                   |
| `reliefItems`           | [ReliefItem] | ❌       | []             | Inventory of supplies                                  |
| `contactPerson`         | String       | ❌       | -              | Primary contact name                                   |
| `contactPhone`          | String       | ❌       | -              | Contact phone                                          |
| `contactEmail`          | String       | ❌       | -              | Contact email                                          |
| `currentOccupantsCount` | Number       | ❌       | 0              | Current number of occupants                            |
| `lastUpdatedBy`         | String       | ❌       | -              | Username of last editor                                |
| `status`                | String       | ❌       | "planned"      | Enum: planned, standby, open, closed                   |
| `openSince`             | Date         | ❌       | -              | Date/time when shelter was opened                      |
| `closedAt`              | Date         | ❌       | -              | Date/time when shelter was closed                      |

### 📦 Relief Item Schema (Sub-Document)

| Field           | Type   | Required | Default  | Description                                                   |
| --------------- | ------ | -------- | -------- | ------------------------------------------------------------- |
| `name`          | String | ✅       | -        | Item name                                                     |
| `category`      | String | ❌       | "other"  | Enum: food, medicine, water, clothes, hygiene, battery, other |
| `quantity`      | Number | ❌       | 0        | Current quantity                                              |
| `unit`          | String | ❌       | "units"  | Enum: kg, liters, pieces, units                               |
| `expiryDate`    | Date   | ❌       | -        | Item expiry date                                              |
| `priorityLevel` | String | ❌       | "normal" | Enum: normal, urgent                                          |
| `lastUpdated`   | Date   | ❌       | now      | Last update timestamp                                         |

### 📈 Shelter Occupancy Schema

Tracks occupancy snapshots and over-capacity alerts.

| Field                  | Type    | Required | Default | Description                            |
| ---------------------- | ------- | -------- | ------- | -------------------------------------- |
| `shelterId`            | String  | ✅       | -       | Formatted shelter ID                   |
| `capacityTotal`        | Number  | ✅       | -       | Total capacity at time of record       |
| `currentOccupancy`     | Number  | ✅       | 0       | Number of occupants                    |
| `safeThresholdPercent` | Number  | ❌       | 90      | Percentage threshold for safety alerts |
| `isOverCapacity`       | Boolean | ❌       | false   | Calculated flag based on threshold     |
| `childrenCount`        | Number  | ❌       | 0       | Number of children                     |
| `elderlyCount`         | Number  | ❌       | 0       | Number of elderly persons              |
| `specialNeedsCount`    | Number  | ❌       | 0       | Number of persons with special needs   |
| `recordedAt`           | Date    | ❌       | now     | Timestamp of snapshot                  |
| `recordedBy`           | String  | ❌       | -       | User who recorded the data             |

### �🔢 ShelterCounter Schema

Used internally to generate per-district incremental IDs like `KALUTARA-KL0001`, `BADULLA-BD0001`, etc.

| Field | Type   | Description                                    |
| ----- | ------ | ---------------------------------------------- |
| `key` | String | District-based key (e.g., KALUTARA-KL), unique |
| `seq` | Number | Incrementing sequence for that key             |

### 🚨 Emergency Alert Schema

| Field           | Type    | Description                       |
| --------------- | ------- | --------------------------------- |
| `title`         | String  | Alert title                       |
| `description`   | String  | Alert description                 |
| `category`      | String  | FLOOD, STORM, HEATWAVE, LANDSLIDE |
| `severity`      | String  | LOW, MEDIUM, HIGH, CRITICAL       |
| `area.district` | String  | District location                 |
| `area.city`     | String  | City location                     |
| `startAt`       | Date    | Start time                        |
| `endAt`         | Date    | End time                          |
| `isActive`      | Boolean | Active status                     |
| `createdAt`     | Date    | Timestamp                         |
| `updatedAt`     | Date    | Timestamp                         |

### 📚 Article Schema

| Field                   | Type    | Required | Default        | Description                                         |
| ----------------------- | ------- | -------- | -------------- | --------------------------------------------------- |
| `_id`                   | String  | ✅       | Auto-generated | Custom ID format: ART-YYMMDD-4digitNumber          |
| `title`                 | String  | ✅       | -              | Article title (5-200 characters)                    |
| `content`               | String  | ✅       | -              | Article content (min 50 characters)                 |
| `category`              | String  | ❌       | "general"      | Disaster type category (see categories below)       |
| `author`                | String  | ✅       | -              | Author name                                         |
| `publishedDate`         | Date    | ❌       | Date.now       | Publication date                                    |
| `imageUrl`              | String  | ❌       | -              | Featured image URL                                  |
| `isPublished`           | Boolean | ❌       | true           | Published status                                    |
| `quizId`                | String  | ❌       | null           | Reference to linked quiz (one-to-one)              |
| `createdAt`             | Date    | ❌       | Auto           | Creation timestamp                                  |
| `updatedAt`             | Date    | ❌       | Auto           | Last update timestamp                               |

**Article Categories:**

- `flood` • `drought` • `cyclone` • `landslide` • `wildfire` • `tsunami` • `earthquake` • `photochemical smog` • `general`

### 🎯 Quiz Schema

| Field           | Type        | Required | Default | Description                                    |
| --------------- | ----------- | -------- | ------- | ---------------------------------------------- |
| `_id`           | String      | ✅       | Auto    | Custom ID format: QUZ-YYMMDD-randomNumber      |
| `title`         | String      | ✅       | -       | Quiz title (min 5 characters)                  |
| `articleId`     | String (FK) | ✅       | -       | Reference to parent article (one-to-one)       |
| `questions`     | [Question]  | ✅       | -       | Array of questions (1-20 questions required)   |
| `passingScore`  | Number      | ❌       | 60      | Passing percentage (0-100)                     |
| `createdAt`     | Date        | ❌       | Auto    | Creation timestamp                             |
| `updatedAt`     | Date        | ❌       | Auto    | Last update timestamp                          |

**Question Sub-Schema:**

| Field          | Type     | Required | Description                                |
| -------------- | -------- | -------- | ------------------------------------------ |
| `question`     | String   | ✅       | Question text (min 10 characters)          |
| `options`      | [String] | ✅       | Array of 4 answer options                  |
| `correctAnswer`| Number   | ✅       | Index of correct answer (0-3)              |

### 🧪 Quiz Attempt Schema

Tracks user quiz submissions and scores.

| Field           | Type    | Description                                    |
| --------------- | ------- | ---------------------------------------------- |
| `_id`           | String  | Custom ID format: ATT-YYMMDD-randomNumber      |
| `userId`        | String  | Reference to user who took the quiz            |
| `quizId`        | String  | Reference to the quiz attempted                |
| `articleId`     | String  | Reference to the article                       |
| `answers`       | [Number]| Array of answer indices provided by user       |
| `score`         | Number  | Number of correct answers                      |
| `percentage`    | Number  | Score as percentage (0-100)                    |
| `passed`        | Boolean | Whether user passed (score >= passingScore)    |
| `results`       | [Result]| Detailed question-by-question breakdown        |
| `createdAt`     | Date    | Timestamp of attempt                           |
| `updatedAt`     | Date    | Last update timestamp                          |

### ✅ Checklist Schema

Admin-defined checklists for disaster preparedness.

| Field          | Type   | Required | Default | Description                              |
| -------------- | ------ | -------- | ------- | ---------------------------------------- |
| `_id`          | String | ✅       | Auto    | Custom ID format: CHL-YYMMDD-randomNum   |
| `title`        | String | ✅       | -       | Checklist title                          |
| `disasterType` | String | ❌       | "gen"   | Disaster category for this checklist     |
| `items`        | [Item] | ❌       | []      | Array of checklist items defined by admin|
| `createdBy`    | String | ✅       | -       | Admin user ID who created checklist      |
| `isActive`     | Boolean| ❌       | true    | Active status                            |
| `createdAt`    | Date   | ❌       | Auto    | Creation timestamp                       |
| `updatedAt`    | Date   | ❌       | Auto    | Last update timestamp                    |

**Checklist Item Sub-Schema:**

| Field       | Type   | Required | Default | Description                           |
| ----------- | ------ | -------- | ------- | ------------------------------------- |
| `_id`       | String | ✅       | Auto    | Custom item ID format: ITM-YYMMDD-num |
| `itemName`  | String | ✅       | -       | Name of item to prepare               |
| `category`  | String | ❌       | "other" | Category (food, water, medicine, etc) |
| `quantity`  | Number | ❌       | 1       | Recommended quantity                  |
| `note`      | String | ❌       | ""      | Additional notes/instructions         |

### 👤 User Checklist Progress Schema

Tracks which items users have marked as prepared.

| Field        | Type       | Required | Description                                   |
| ------------ | ---------- | -------- | --------------------------------------------- |
| `_id`        | String     | ✅       | Custom ID: UCP-YYMMDD-randomNumber            |
| `userId`     | String     | ✅       | Reference to user                             |
| `checklistId`| String (FK)| ✅       | Reference to checklist template               |
| `markedItems`| [Marked]   | ❌       | Array of items user has checked               |
| `createdAt`  | Date       | ❌       | Creation timestamp                            |
| `updatedAt`  | Date       | ❌       | Last update timestamp                         |

**MarkedItem Sub-Schema:**

| Field     | Type    | Description                 |
| --------- | ------- | --------------------------- |
| `itemId`  | String  | Reference to checklist item |
| `isChecked`| Boolean | Whether user marked as done |

### 🌍 Climate News Schema

Cache of climate and disaster news from NewsData.io API.

| Field             | Type    | Required | Description                                |
| ----------------- | ------- | -------- | ------------------------------------------ |
| `_id`             | String  | ✅       | Custom ID: NEWS-YYMMDD-randomNumber        |
| `articleId`       | String  | ✅       | Unique API article ID (for deduplication)  |
| `title`           | String  | ✅       | Article title                              |
| `description`     | String  | ❌       | Article description                        |
| `content`         | String  | ❌       | Full article content                       |
| `sourceName`      | String  | ❌       | News source/publication name               |
| `sourceUrl`       | String  | ❌       | Source website URL                         |
| `link`            | String  | ✅       | Direct link to original article            |
| `imageUrl`        | String  | ❌       | Featured image URL                         |
| `publishedAt`     | Date    | ✅       | Article publication date                   |
| `country`         | String  | ❌       | Country code or country list                |
| `climateCategory` | String  | ✅       | Categorized disaster type                  |
| `isSriLanka`      | Boolean | ✅       | Is this Sri Lanka-specific news?           |
| `createdAt`       | Date    | ❌       | Cache entry creation time                  |
| `updatedAt`       | Date    | ❌       | Cache update timestamp                     |

**Climate Categories:**

- `flood` • `drought` • `cyclone` • `earthquake` • `tsunami` • `wildfire` • `storm` • `landslide` • `general`

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

#### Update Shelter Status

```http
PATCH /api/shelters/:id/status
Content-Type: application/json
```

**Path Parameter:**

- `:id` - Shelter ID

**Request Body:**

```json
{
  "status": "open"
}
```

**Allowed Statuses:** `planned` • `standby` • `open` • `closed`

**Response:**

```json
{
  "shelterId": "KALUTARA-KL0001",
  "status": "open",
  "openSince": "2026-02-15T10:30:00Z",
  "closedAt": null
}
```

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

### � Shelter Statistics & Location-Based Services

#### Get Shelter Counts by District

```http
GET /api/shelters/counts/by-district
```

**Response:** Statistics showing the number of shelters and their distribution across districts

```json
{
  "KALUTARA": 5,
  "COLOMBO": 12,
  "GALLE": 3,
  "BADULLA": 8
}
```

#### Get Nearby Shelters

```http
GET /api/shelters/nearby?lat=6.9271&lng=79.8612&limit=5
```

**Query Parameters:**

- `lat` - Current latitude (required)
- `lng` - Current longitude (required)
- `limit` - Maximum number of nearby shelters to return (optional, default: 10)

**Response:** Array of nearby shelters sorted by travel time, including distance and duration

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "shelterId": "COLOMBO-CB0001",
    "name": "Central Relief Camp",
    "district": "Colombo",
    "lat": 6.9271,
    "lng": 80.7789,
    "capacityTotal": 500,
    "capacityCurrent": 150,
    "distanceKm": 2500,
    "travelTimeMin": 15.5
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "shelterId": "COLOMBO-CB0002",
    "name": "Secondary Shelter",
    "district": "Colombo",
    "lat": 6.95,
    "lng": 80.75,
    "capacityTotal": 300,
    "capacityCurrent": 80,
    "distanceKm": 5000,
    "travelTimeMin": 35.0
  }
]
```

> **Note:** Distance is in meters and travel time is calculated using routing service

---

### 📦 Relief Items Management

#### Get All Relief Items

```http
GET /api/shelters/:id/items
```

**Path Parameter:**

- `:id` - Shelter ID

**Response:** Array of all relief items in the shelter

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

### 📈 Shelter Occupancy Tracking

#### Create Occupancy Snapshot

```http
POST /api/shelters/:id/occupancy
Content-Type: application/json
```

**Request Body:**

```json
{
  "currentOccupancy": 120,
  "childrenCount": 30,
  "elderlyCount": 15,
  "specialNeedsCount": 5,
  "recordedBy": "admin_user"
}
```

#### Get Latest Occupancy

```http
GET /api/shelters/:id/occupancy
```

#### Get Occupancy History

```http
GET /api/shelters/:id/occupancy/history?from=ISO_DATE&to=ISO_DATE
```

#### Quick Update Current Occupancy

```http
PUT /api/shelters/:id/occupancy/current
Content-Type: application/json
```

**Request Body:**

```json
{
  "currentOccupancy": 125
}
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

### 📚 Article Management

#### Get All Articles

```http
GET /api/articles
```

**Query Parameters:**

- `category` - Filter by category (optional)
- `search` - Search in title and content (optional)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

**Response:**

```json
{
  "articles": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Get Article by ID

```http
GET /api/articles/:id
```

**Response:** Single article with linked quiz and related YouTube videos

#### Create Article (Admin/Content Manager)

```http
POST /api/articles
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "How to Prepare for Floods",
  "content": "Comprehensive guide on flood preparedness...",
  "category": "flood",
  "author": "Dr. Smith",
  "imageUrl": "https://example.com/image.jpg"
}
```

#### Update Article (Admin/Content Manager)

```http
PUT /api/articles/:id
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:** Partial or complete article data

#### Delete Article (Admin/Content Manager)

```http
DELETE /api/articles/:id
Authorization: Bearer <token>
```

#### Get Article Statistics

```http
GET /api/articles/stats
```

**Response:**

```json
{
  "total": 25,
  "withQuiz": 18,
  "withoutQuiz": 7,
  "byCategory": [
    { "category": "flood", "count": 8 },
    { "category": "cyclone", "count": 5 }
  ]
}
```

#### Search YouTube Videos

```http
GET /api/articles/youtube/videos?query=flood+preparedness&maxResults=10
```

**Query Parameters:**

- `query` - Search keyword
- `maxResults` - Number of results (1-50, default: 10)
- `order` - Sort order (relevance, date, viewCount, rating)

---

### 🎯 Quiz Management

#### Get All Quizzes (Admin/Content Manager)

```http
GET /api/quizzes
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

#### Get Quiz by Article ID

```http
GET /api/quizzes/article/:articleId
```

#### Get Quiz by Quiz ID

```http
GET /api/quizzes/:id
```

#### Create Quiz (Admin/Content Manager)

```http
POST /api/quizzes
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Flood Preparedness Quiz",
  "articleId": "ART-260224-1234",
  "passingScore": 70,
  "questions": [
    {
      "question": "What is the first step in flood preparedness?",
      "options": [
        "Move to high ground",
        "Create an emergency plan",
        "Pack belongings",
        "Stay calm"
      ],
      "correctAnswer": 1
    }
  ]
}
```

#### Update Quiz (Admin/Content Manager)

```http
PUT /api/quizzes/:id
Content-Type: application/json
Authorization: Bearer <token>
```

#### Delete Quiz (Admin/Content Manager)

```http
DELETE /api/quizzes/:id
Authorization: Bearer <token>
```

#### Get Quiz for User (with attempt history)

```http
GET /api/articles/:articleId/:userId/quiz
Authorization: Bearer <token>
```

**Response:** Quiz details + user's previous attempts

#### Submit Quiz

```http
POST /api/articles/:articleId/:userId/quiz/submit
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "answers": [1, 2, 0, 3, 2]
}
```

**Response:**

```json
{
  "userId": "user123",
  "attemptId": "ATT-260224-5678",
  "quizTitle": "Flood Preparedness Quiz",
  "score": 4,
  "total": 5,
  "percentage": 80,
  "passingScore": 70,
  "passed": true,
  "results": [
    {
      "questionNumber": 1,
      "question": "...",
      "options": [...],
      "userAnswer": 1,
      "correctAnswer": 1,
      "isCorrect": true,
      "explanation": "✅ Correct!"
    }
  ],
  "message": "🎉 Congratulations! You passed with 80%"
}
```

---

### ✅ Emergency Preparedness Checklists

#### Get All Checklists

```http
GET /api/checklists
```

**Response:** Array of available checklists

#### Get Single Checklist

```http
GET /api/checklists/:checklistId
```

#### Create Checklist (Admin/Content Manager)

```http
POST /api/checklists
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Flood Preparedness Checklist",
  "disasterType": "flood",
  "items": [
    {
      "itemName": "Emergency contact list",
      "category": "documents",
      "quantity": 1
    },
    {
      "itemName": "Drinking water",
      "category": "water",
      "quantity": 3
    }
  ]
}
```

#### Add Item to Checklist (Admin/Content Manager)

```http
POST /api/checklists/:checklistId/items
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "itemName": "First aid kit",
  "category": "medicine",
  "quantity": 1,
  "note": "Basic first aid supplies"
}
```

#### Update Checklist Item (Admin/Content Manager)

```http
PUT /api/checklists/:checklistId/items/:itemId
Content-Type: application/json
Authorization: Bearer <token>
```

#### Delete Item from Checklist (Admin/Content Manager)

```http
DELETE /api/checklists/:checklistId/items/:itemId
Authorization: Bearer <token>
```

#### Delete Checklist (Admin/Content Manager)

```http
DELETE /api/checklists/:checklistId
Authorization: Bearer <token>
```

---

### 👤 User Checklist Progress

#### Get My Checklist with Progress

```http
GET /api/user-checklists/:checklistId
Authorization: Bearer <token>
```

**Response:**

```json
{
  "checklistId": "CHL-260224-1234",
  "title": "Flood Preparedness Checklist",
  "disasterType": "flood",
  "items": [
    {
      "_id": "ITM-260224-5678",
      "itemName": "Emergency contact list",
      "category": "documents",
      "quantity": 1,
      "note": "",
      "isChecked": true
    }
  ],
  "progress": {
    "total": 10,
    "checked": 7,
    "unchecked": 3,
    "percentage": 70,
    "isComplete": false
  }
}
```

#### Get My Progress Percentage

```http
GET /api/user-checklists/:checklistId/progress
Authorization: Bearer <token>
```

**Response:**

```json
{
  "userId": "user123",
  "checklistId": "CHL-260224-1234",
  "total": 10,
  "checked": 7,
  "unchecked": 3,
  "percentage": 70,
  "isComplete": false
}
```

#### Toggle Checklist Item

```http
PATCH /api/user-checklists/:checklistId/items/:itemId/toggle
Authorization: Bearer <token>
```

**Response:**

```json
{
  "itemId": "ITM-260224-5678",
  "isChecked": true,
  "message": "Item marked as done"
}
```

#### Reset All Checklist Progress

```http
PATCH /api/user-checklists/:checklistId/reset
Authorization: Bearer <token>
```

---

### 🌍 Climate News

#### Get Climate News

```http
GET /api/climate-news?category=flood&type=sri-lanka&page=1&limit=12
```

**Query Parameters:**

- `category` - Filter by climate category (all, flood, cyclone, etc.)
- `type` - News type (all, sri-lanka, world)
- `page` - Page number
- `limit` - Results per page (default: 12)
- `refresh` - Force API refresh (true/false)

**Response:**

```json
{
  "news": [...],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 156,
    "pages": 13
  },
  "meta": {
    "type": "sri-lanka",
    "category": "flood",
    "lastUpdated": "2026-02-23T10:30:00Z"
  }
}
```

#### Get Latest Climate News

```http
GET /api/climate-news/latest
```

**Response:** Latest 6 climate news articles

#### Get Climate News Statistics

```http
GET /api/climate-news/stats
```

**Response:**

```json
{
  "total": 256,
  "sriLanka": 145,
  "world": 111,
  "byCategory": [
    { "category": "flood", "count": 67 },
    { "category": "cyclone", "count": 45 }
  ]
}
```

#### Manually Refresh News (Admin)

```http
POST /api/climate-news/refresh
Authorization: Bearer <token>
```

#### Clean Up Irrelevant News (Admin)

```http
DELETE /api/climate-news/cleanup
Authorization: Bearer <token>
```

---

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB database
- OpenWeather API key (for weather features)
- YouTube Data API key (for related videos feature)
- NewsData.io API key (for climate news feature)

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
NEWSDATA_API_KEY=your_newsdata_api_key
```

**API Key Instructions:**

- **OpenWeather API:** Get free key from [https://openweathermap.org/api](https://openweathermap.org/api)
- **YouTube API:** Enable YouTube Data API v3 in [Google Cloud Console](https://console.cloud.google.com/)
- **NewsData.io API:** Sign up at [https://newsdata.io/](https://newsdata.io/) for free API key

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

### Test Framework & Setup

The project uses **Jest** for unit testing with mock fixtures for database and service layers. All database calls and external API services are mocked to ensure tests are isolated and fast.

### Running Tests

#### Run all tests

```bash
npm test
```

#### Run tests with coverage report

```bash
npm test -- --coverage
```

#### Run specific test file

```bash
npm test -- shelterController.test.js
```

#### Run tests in watch mode (auto-rerun on file change)

```bash
npm test -- --watch
```

---

### Unit Tests: Shelter Controller (`shelterController.test.js`)

The shelter controller test suite provides comprehensive coverage for all shelter operations including CRUD operations, relief item management, and location-based services.

#### Test Setup & Mocking

```javascript
// Mocked dependencies
jest.mock("../../models/Shelter"); // Shelter model
jest.mock("../../models/ShelterCounter"); // Counter model
jest.mock("../../services/routingService"); // Routing service
```

**Key Utilities:**

- **Mock Express:** `mockRequest()` and `mockResponse()` from `testUtils/mockExpress.js` provide mock HTTP request/response objects
- **Counter Helper:** `makeCounterLean()` simulates ShelterCounter database increments
- **Isolation:** Jest clears all mocks before each test (`beforeEach`)

---

#### Test Suites

##### 1️⃣ **getAllShelters Tests**

| Test Case                       | Description                        | Expected Result                               |
| ------------------------------- | ---------------------------------- | --------------------------------------------- |
| ✅ Return all shelters with 200 | Fetches all shelters from DB       | Returns array of shelters without status code |
| ❌ Return 500 if error          | Database error occurs during fetch | Returns HTTP 500 with error message           |

**Key Assertions:**

- `Shelter.find()` is called
- Response body contains array of shelter objects
- Error responses include error message

---

##### 2️⃣ **getShelterById Tests**

| Test Case                    | Description                    | Expected Result                                |
| ---------------------------- | ------------------------------ | ---------------------------------------------- |
| ✅ Return shelter when found | Valid shelter ID provided      | Returns shelter object with matching shelterId |
| ❌ Return 404 when not found | Shelter doesn't exist in DB    | HTTP 404 with "Shelter not found" message      |
| ❌ Return 400 on error       | Invalid ID format causes error | HTTP 400 with "Invalid shelter ID" message     |

**Key Assertions:**

- `Shelter.findOne({ shelterId })` is called with correct ID
- Proper HTTP status codes returned (200, 404, 400)
- Error messages are descriptive

---

##### 3️⃣ **createShelter Tests**

| Test Case                         | Description                       | Expected Result                                                |
| --------------------------------- | --------------------------------- | -------------------------------------------------------------- |
| ❌ Return 400 if district missing | Request body lacks district field | HTTP 400 with validation error                                 |
| ✅ Create shelter and return 201  | Valid shelter data provided       | HTTP 201 with auto-generated shelterId (e.g., KALUTARA-KL0001) |
| ❌ Handle create error with 400   | Validation/DB error on create     | HTTP 400 with error message                                    |

**Key Features Tested:**

- Automatic shelter ID generation using district-based counter
- Validation of required fields (district, name, address, etc.)
- Counter increment for unique sequential IDs per district
- Proper error handling for DB failures

**Example Validation:**

```javascript
// Counter is incremented correctly
expect(ShelterCounter.findOneAndUpdate).toHaveBeenCalledWith(
  { key: "KALUTARA-KL" },
  { $inc: { seq: 1 } },
  { new: true, upsert: true },
);

// Generated ID follows format: DISTRICT-CODE0001
expect(Shelter.create).toHaveBeenCalledWith(
  expect.objectContaining({
    shelterId: "KALUTARA-KL0001",
  }),
);
```

---

##### 4️⃣ **updateShelterItem Tests**

| Test Case                          | Description                   | Expected Result                           |
| ---------------------------------- | ----------------------------- | ----------------------------------------- |
| ❌ Return 400 if name missing      | Relief item name not provided | HTTP 400 with validation error            |
| ❌ Return 404 if shelter not found | Shelter doesn't exist         | HTTP 404 with "Shelter not found" message |
| ✅ Update existing item            | Item exists, update quantity  | Item quantity updated and saved           |
| ✅ Add new item when not exists    | Relief item doesn't exist     | New item added to reliefItems array       |
| ❌ Handle error with 400           | Database error occurs         | HTTP 400 with error message               |

**Key Features Tested:**

- Item upsert logic (update or insert)
- Validation of item properties (quantity, unit, category, etc.)
- Proper error handling for missing shelters or validation failures

---

##### 5️⃣ **getNearbyShelters Tests** (Location-Based Service)

| Test Case                                | Description              | Expected Result                                                                  |
| ---------------------------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| ✅ Return shelters sorted by travel time | Valid lat/lng provided   | Array of nearby active shelters with distance & travel time, sorted by proximity |
| ❌ Return 400 if lat/lng missing         | Query params incomplete  | HTTP 400 with parameter requirement error                                        |
| ✅ Return [] when no active shelters     | No active shelters in DB | Empty array response                                                             |

**Key Features Tested:**

- Geographic coordinate validation
- Distance calculation using routing matrix service
- Travel time computation
- Sorting by travel time (nearest first)
- Limit parameter support (default: 10)
- Only active shelters returned

**Example Response:**

```json
[
  {
    "shelterId": "KALUTARA-KL0002",
    "distanceKm": 40000,
    "travelTimeMin": 60.0
  }
]
```

---

### Unit Tests: Relief Item Controller (`reliefItemController.test.js`)

The relief item controller test suite provides comprehensive coverage for all relief supply inventory operations.

#### Test Setup & Mocking

```javascript
// Mocked dependencies
jest.mock("../../models/Shelter"); // Shelter model
```

---

##### 6️⃣ **getShelterItems Tests**

| Test Case                     | Description               | Expected Result                           |
| ----------------------------- | ------------------------- | ----------------------------------------- |
| ✅ Return items for a shelter | Valid shelter ID provided | Returns shelterId, name, district, items  |
| ❌ Return 404 if not found    | Shelter doesn't exist     | HTTP 404 with "Shelter not found" message |
| ❌ Return 500 on error        | Database error occurs     | HTTP 500 with error message               |

**Key Assertions:**

- `Shelter.findOne({ shelterId }).lean()` is called with correct ID
- Response includes `shelterId`, `shelterName`, `district`, and `reliefItems`

---

##### 7️⃣ **updateShelterItem Tests**

| Test Case                          | Description                   | Expected Result                           |
| ---------------------------------- | ----------------------------- | ----------------------------------------- |
| ❌ Return 400 if name missing      | Relief item name not provided | HTTP 400 with "Item name is required"     |
| ❌ Return 404 if shelter not found | Shelter doesn't exist         | HTTP 404 with "Shelter not found" message |
| ✅ Update existing item            | Item exists, update quantity  | Item quantity updated and saved           |
| ✅ Add new item when not exists    | Relief item doesn't exist     | New item added to reliefItems array       |
| ❌ Handle error with 400           | Database error occurs         | HTTP 400 with error message               |

**Key Features Tested:**

- Item upsert logic (update or insert)
- Case-insensitive item name matching
- Validation of item properties (quantity, unit, category)

---

##### 8️⃣ **increaseShelterItem Tests**

| Test Case                            | Description              | Expected Result                           |
| ------------------------------------ | ------------------------ | ----------------------------------------- |
| ❌ Return 400 for invalid amount     | Negative amount provided | HTTP 400 with "amount must be positive"   |
| ❌ Return 404 if shelter not found   | Shelter doesn't exist    | HTTP 404 with "Shelter not found"         |
| ❌ Return 404 if item not found      | Item not in shelter      | HTTP 404 with "Item not found in shelter" |
| ✅ Increase quantity and return item | Valid increase request   | Quantity increased, item returned         |
| ❌ Handle error with 400             | Database error occurs    | HTTP 400 with error message               |

---

##### 9️⃣ **decreaseShelterItem Tests**

| Test Case                            | Description           | Expected Result                           |
| ------------------------------------ | --------------------- | ----------------------------------------- |
| ❌ Return 400 for invalid amount     | Zero/negative amount  | HTTP 400 with "amount must be positive"   |
| ❌ Return 404 if shelter not found   | Shelter doesn't exist | HTTP 404 with "Shelter not found"         |
| ❌ Return 404 if item not found      | Item not in shelter   | HTTP 404 with "Item not found in shelter" |
| ✅ Decrease quantity but not below 0 | Amount exceeds stock  | Quantity floors at 0, never goes negative |
| ❌ Handle error with 400             | Database error occurs | HTTP 400 with error message               |

---

##### 🔟 **deleteShelterItem Tests**

| Test Case                          | Description           | Expected Result                           |
| ---------------------------------- | --------------------- | ----------------------------------------- |
| ❌ Return 404 if shelter not found | Shelter doesn't exist | HTTP 404 with "Shelter not found"         |
| ❌ Return 404 if item not found    | Item not in shelter   | HTTP 404 with "Item not found in shelter" |
| ✅ Delete item and return success  | Valid delete request  | Item removed, success message returned    |
| ❌ Handle error with 400           | Database error occurs | HTTP 400 with error message               |

---

### Unit Tests: Shelter Occupancy Controller (`shelterOccupancyController.test.js`)

The shelter occupancy controller test suite covers occupancy snapshot creation, retrieval, history filtering, and safety flag calculations.

#### Test Setup & Mocking

```javascript
// Mocked dependencies
jest.mock("../../models/Shelter"); // Shelter model
jest.mock("../../models/ShelterOccupancy"); // Occupancy model
```

---

##### 1️⃣1️⃣ **createShelterOccupancy Tests**

| Test Case                          | Description                   | Expected Result                           |
| ---------------------------------- | ----------------------------- | ----------------------------------------- |
| ❌ Return 404 if shelter not found | Shelter doesn't exist         | HTTP 404 with "Shelter not found" message |
| ✅ Create snapshot and return 201  | Valid occupancy data provided | HTTP 201 with snapshot created message    |
| ❌ Handle error with 400           | Database error on creation    | HTTP 400 with error message               |

**Key Features Tested:**

- Safety flag calculation (`isOverCapacity`) via `applyOccupancySafetyFlags()`
- Validation that shelter exists before creating occupancy
- Proper persistence of demographic breakdowns (children, elderly, special needs)

---

##### 1️⃣2️⃣ **getLatestShelterOccupancy Tests**

| Test Case                     | Description                 | Expected Result                       |
| ----------------------------- | --------------------------- | ------------------------------------- |
| ❌ Return 404 if no occupancy | No snapshots exist          | HTTP 404 with "No occupancy data"     |
| ✅ Return latest occupancy    | Snapshots exist for shelter | Returns most recent snapshot (sorted) |
| ❌ Handle error with 400      | Database error occurs       | HTTP 400 with error message           |

---

##### 1️⃣3️⃣ **getShelterOccupancyHistory Tests**

| Test Case                         | Description              | Expected Result                              |
| --------------------------------- | ------------------------ | -------------------------------------------- |
| ✅ Return history without filters | No date filters provided | Returns all history for shelter              |
| ✅ Apply from/to filters          | Date range query params  | Filters history within `from` and `to` dates |
| ❌ Handle error with 400          | Database error occurs    | HTTP 400 with error message                  |

---

##### 1️⃣4️⃣ **updateCurrentOccupancy Tests**

| Test Case                                 | Description                 | Expected Result                               |
| ----------------------------------------- | --------------------------- | --------------------------------------------- |
| ❌ Return 400 if currentOccupancy missing | Required field missing      | HTTP 400 with "currentOccupancy is required"  |
| ❌ Return 404 if shelter not found        | Shelter doesn't exist       | HTTP 404 with "Shelter not found"             |
| ✅ Create new snapshot when none exists   | First occupancy for shelter | New snapshot created with safety flags        |
| ✅ Update existing snapshot               | Previous snapshot exists    | Existing snapshot updated, flags recalculated |
| ❌ Handle error with 400                  | Database error occurs       | HTTP 400 with error message                   |

**Key Features Tested:**

- Automatic `isOverCapacity` flag calculation
- Warning logs at 80%+ capacity, critical logs at 100%+
- Occupancy percentage calculation in response
- Fallback creation when no previous snapshot exists

---

### Integration Tests

Integration tests verify full HTTP request-response flows through Express routes using **Supertest**. Auth and role middleware are mocked to focus on controller + route integration.

#### Test App Factory (`tests/utils/testApp.js`)

```javascript
// Creates a lightweight Express app mounting shelterRoutes
const { createTestApp } = require("../utils/testApp");
let app;
beforeAll(() => {
  app = createTestApp();
});
```

---

#### Integration: Shelter Routes (`shelters.int.test.js`)

| Test Suite                            | Test Case                                   | Expected Result                                     |
| ------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| `GET /api/shelters/countsby-district` | ✅ Returns 200 and an array when successful | Aggregated district counts returned                 |
| `GET /api/shelters/countsby-district` | ❌ Returns error on DB failure              | HTTP 400/500 with error object                      |
| `GET /api/shelters/nearby`            | ✅ Returns nearby shelters sorted by time   | Array sorted by `travelTimeMin` with distance data  |
| `GET /api/shelters/nearby`            | ❌ Returns 400 if lat/lng missing           | HTTP 400 with parameter requirement error           |
| `PUT /api/shelters/:id/status`        | ✅ Updates status and returns data          | Status changed, timestamps set (openSince/closedAt) |
| `PUT /api/shelters/:id/status`        | ❌ Returns 400 for invalid status           | HTTP 400 with "Invalid status value"                |

---

#### Integration: Relief Item Routes (`reliefItems.int.test.js`)

| Test Suite                                       | Test Case                              | Expected Result                        |
| ------------------------------------------------ | -------------------------------------- | -------------------------------------- |
| `GET /api/shelters/:id/items`                    | ✅ Returns items for a shelter         | Items array with shelter metadata      |
| `GET /api/shelters/:id/items`                    | ❌ Returns 404 if shelter not found    | HTTP 404 with "Shelter not found"      |
| `PUT /api/shelters/:id/items/:itemName`          | ✅ Adds new item when not exists       | Item added to reliefItems, saved       |
| `PUT /api/shelters/:id/items/:itemName`          | ✅ Updates existing item               | Quantity updated in-place              |
| `PUT /api/shelters/:id/items/:itemName/increase` | ✅ Increases quantity and returns item | Quantity incremented correctly         |
| `PUT /api/shelters/:id/items/:itemName/decrease` | ✅ Decreases quantity but not below 0  | Quantity floors at 0                   |
| `DELETE /api/shelters/:id/items/:itemName`       | ✅ Removes item from shelter           | Item deleted, success message returned |

---

#### Integration: Shelter Occupancy Routes (`shelterOccupancy.int.test.js`)

| Test Suite                                | Test Case                                     | Expected Result                                |
| ----------------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| `POST /api/shelters/:id/occupancy`        | ✅ Creates snapshot via route and returns 201 | Snapshot persisted with safety flags           |
| `GET /api/shelters/:id/occupancy`         | ✅ Returns latest occupancy via route         | Most recent snapshot returned                  |
| `PUT /api/shelters/:id/occupancy/current` | ✅ Updates current occupancy via route        | Occupancy updated, `isOverCapacity` calculated |

---

### Test Utilities

#### Mock Express Module (`testUtils/mockExpress.js`)

Provides helper functions to create mock Express request/response objects for testing:

```javascript
// Example usage
const mockReq = mockRequest(body, params, query);
const mockRes = mockResponse();

// Mock functions track calls
mockRes.status(400).json({ error: "message" });
expect(mockRes.status).toHaveBeenCalledWith(400);
expect(mockRes.json).toHaveBeenCalledWith({ error: "message" });
```

---

### Test Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: "node",
  testMatch: [
    "**/tests/unit/**/*.test.js",
    "**/tests/integration/**/*.int.test.js",
  ],
};
```

> Tests are configured to match both `*.test.js` files in `tests/unit/` and `*.int.test.js` files in `tests/integration/`.

---

### Coverage Goals

| Category   | Target |
| ---------- | ------ |
| Statements | > 80%  |
| Branches   | > 75%  |
| Functions  | > 80%  |
| Lines      | > 80%  |

---

## 🚀 Performance / Load Testing

The project includes **Artillery** load testing configuration to validate shelter-related API performance under stress.

### Tool: Artillery

[Artillery](https://www.artillery.io/) is a modern, powerful load testing toolkit. It is used here to simulate concurrent users hitting all shelter-related endpoints.

### Configuration File: `artillery-shelters-full.yml`

```yaml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 15
      name: "Peak load"
```

### Load Phases

| Phase       | Duration | Arrival Rate | Description                                |
| ----------- | -------- | ------------ | ------------------------------------------ |
| **Warm up** | 60s      | 5 users/sec  | Gradual ramp-up to warm caches/connections |
| **Peak**    | 120s     | 15 users/sec | Sustained high-traffic simulation          |

### Scenarios Covered

| Category                   | Scenario                 | Method   | Endpoint                                            |
| -------------------------- | ------------------------ | -------- | --------------------------------------------------- |
| **Shelter Controller**     | Browse all shelters      | `GET`    | `/api/shelters`                                     |
| **Shelter Controller**     | Get one shelter          | `GET`    | `/api/shelters/ANURADHAPURA-AP0001`                 |
| **Shelter Controller**     | Create shelter           | `POST`   | `/api/shelters`                                     |
| **Shelter Controller**     | Update shelter status    | `PUT`    | `/api/shelters/ANURADHAPURA-AP0001/status`          |
| **Relief Item Controller** | Add relief item          | `POST`   | `/api/shelters/ANURADHAPURA-AP0001/items`           |
| **Relief Item Controller** | Update relief item       | `PUT`    | `/api/shelters/ANURADHAPURA-AP0001/items`           |
| **Relief Item Controller** | Delete relief item       | `DELETE` | `/api/shelters/ANURADHAPURA-AP0001/items/Rice`      |
| **Occupancy Controller**   | Get current occupancy    | `GET`    | `/api/shelter-occupancy/ANURADHAPURA-AP0001`        |
| **Occupancy Controller**   | Update current occupancy | `PUT`    | `/api/shelter-occupancy/ANURADHAPURA-AP0001`        |
| **Occupancy Controller**   | Check safety flags       | `GET`    | `/api/shelter-occupancy/ANURADHAPURA-AP0001/safety` |

### Running Performance Tests

#### Install Artillery (if not already installed)

```bash
npm install -g artillery
```

#### Run the full shelter load test

```bash
artillery run artillery-shelters-full.yml
```

#### Run with a JSON report output

```bash
artillery run --output performance/report.json artillery-shelters-full.yml
```

#### Generate an HTML report from JSON

```bash
artillery report performance/report.json --output performance/report.html
```

### Key Metrics Monitored

| Metric                     | Description                                  |
| -------------------------- | -------------------------------------------- |
| **http.request_rate**      | Requests per second sent during the test     |
| **http.response_time.p95** | 95th percentile response time (ms)           |
| **http.response_time.p99** | 99th percentile response time (ms)           |
| **http.codes.200**         | Count of successful responses                |
| **http.codes.4xx/5xx**     | Count of client/server error responses       |
| **vusers.completed**       | Total virtual users that completed scenarios |
| **vusers.failed**          | Total virtual users that failed              |

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

#### Update Shelter Status

```bash
curl -X PATCH http://localhost:5000/api/shelters/KALUTARA-KL0001/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "open"
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

#### Add Occupancy Snapshot

```bash
curl -X POST http://localhost:5000/api/shelters/KALUTARA-KL0001/occupancy \
  -H "Content-Type: application/json" \
  -d '{
    "currentOccupancy": 85,
    "childrenCount": 20,
    "recordedBy": "Officer1"
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

### Article Management Examples

#### Create an Article

```bash
curl -X POST http://localhost:5000/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Complete Guide to Flood Preparedness",
    "content": "Comprehensive guide covering flood risks, safety measures, and emergency planning...",
    "category": "flood",
    "author": "Dr. Jayasinghe",
    "imageUrl": "https://example.com/flood-guide.jpg"
  }'
```

#### Get All Articles

```bash
curl "http://localhost:5000/api/articles?category=flood&search=preparedness&page=1&limit=10"
```

#### Get Article with Quiz and YouTube Videos

```bash
curl http://localhost:5000/api/articles/ART-260224-1234
```

#### Search YouTube Videos

```bash
curl "http://localhost:5000/api/articles/youtube/videos?query=flood+safety&maxResults=5"
```

#### Get Article Statistics

```bash
curl http://localhost:5000/api/articles/stats
```

#### Update Article

```bash
curl -X PUT http://localhost:5000/api/articles/ART-260224-1234 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Updated: Complete Flood Preparedness Guide",
    "content": "Updated content..."
  }'
```

#### Delete Article

```bash
curl -X DELETE http://localhost:5000/api/articles/ART-260224-1234 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Quiz Management Examples

#### Create a Quiz for an Article

```bash
curl -X POST http://localhost:5000/api/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Flood Preparedness Quiz",
    "articleId": "ART-260224-1234",
    "passingScore": 70,
    "questions": [
      {
        "question": "What is the first step in flood preparedness?",
        "options": [
          "Move to high ground immediately",
          "Create an emergency plan",
          "Pack your belongings",
          "Contact neighbors"
        ],
        "correctAnswer": 1
      },
      {
        "question": "How long should emergency water supply be enough for?",
        "options": [
          "1 day",
          "3-5 days",
          "1 week",
          "2 weeks"
        ],
        "correctAnswer": 1
      }
    ]
  }'
```

#### Get Quiz by Article ID

```bash
curl http://localhost:5000/api/quizzes/article/ART-260224-1234
```

#### Submit Quiz Answers

```bash
curl -X POST http://localhost:5000/api/articles/ART-260224-1234/user123/quiz/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "answers": [1, 1]
  }'
```

#### Get All Quizzes (Admin)

```bash
curl http://localhost:5000/api/quizzes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Quiz

```bash
curl -X PUT http://localhost:5000/api/quizzes/QUZ-260224-5678 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "passingScore": 75,
    "questions": [...]
  }'
```

#### Delete Quiz

```bash
curl -X DELETE http://localhost:5000/api/quizzes/QUZ-260224-5678 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Emergency Preparedness Checklist Examples

#### Create a Checklist

```bash
curl -X POST http://localhost:5000/api/checklists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Flood Emergency Kit Checklist",
    "disasterType": "flood",
    "items": [
      {
        "itemName": "Emergency contact list",
        "category": "documents",
        "quantity": 1,
        "note": "Written copy of important phone numbers"
      },
      {
        "itemName": "Drinking water",
        "category": "water",
        "quantity": 3,
        "note": "1 gallon per person per day, minimum 3 days"
      },
      {
        "itemName": "First aid kit",
        "category": "medicine",
        "quantity": 1
      }
    ]
  }'
```

#### Get All Available Checklists

```bash
curl http://localhost:5000/api/checklists
```

#### Add Item to Checklist

```bash
curl -X POST http://localhost:5000/api/checklists/CHL-260224-1234/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "itemName": "Flashlight with batteries",
    "category": "tools",
    "quantity": 2,
    "note": "One for each family member"
  }'
```

#### Update Checklist Item

```bash
curl -X PUT http://localhost:5000/api/checklists/CHL-260224-1234/items/ITM-260224-5678 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "quantity": 4,
    "note": "Updated quantity for larger family"
  }'
```

#### Delete Item from Checklist

```bash
curl -X DELETE http://localhost:5000/api/checklists/CHL-260224-1234/items/ITM-260224-5678 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### User Checklist Progress Examples

#### Get My Checklist with Progress

```bash
curl http://localhost:5000/api/user-checklists/CHL-260224-1234 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get My Progress Percentage

```bash
curl http://localhost:5000/api/user-checklists/CHL-260224-1234/progress \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Mark Item as Done

```bash
curl -X PATCH http://localhost:5000/api/user-checklists/CHL-260224-1234/items/ITM-260224-5678/toggle \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Reset Checklist Progress

```bash
curl -X PATCH http://localhost:5000/api/user-checklists/CHL-260224-1234/reset \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Climate News Examples

#### Get Climate News

```bash
curl "http://localhost:5000/api/climate-news?category=flood&type=sri-lanka&page=1&limit=10"
```

#### Get Latest Climate News

```bash
curl http://localhost:5000/api/climate-news/latest
```

#### Get Climate News Statistics

```bash
curl http://localhost:5000/api/climate-news/stats
```

#### Manually Refresh News (Admin)

```bash
curl -X POST http://localhost:5000/api/climate-news/refresh \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Clean Up Database (Admin)

```bash
curl -X DELETE http://localhost:5000/api/climate-news/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Production Dependencies

| Package                     | Version   | Purpose                                   |
| --------------------------- | --------- | ----------------------------------------- |
| **express**                 | ^5.2.1    | Web framework for building REST APIs      |
| **mongoose**                | ^9.1.6    | MongoDB object modeling and validation    |
| **cors**                    | ^2.8.6    | Cross-Origin Resource Sharing middleware  |
| **dotenv**                  | ^17.2.4   | Environment variable management           |
| **axios**                   | ^1.13.5   | HTTP client for API requests              |
| **jsonwebtoken**            | ^9.0.3    | JWT authentication and token verification |
| **bcryptjs**                | ^3.0.3    | Password hashing and encryption           |
| **bcrypt**                  | ^6.0.0    | Additional bcrypt functionality           |
| **express-validator**       | ^7.3.1    | Request validation and sanitization       |
| **validator**               | ^13.15.26 | String validation utilities               |
| **passport**                | ^0.7.0    | Authentication middleware framework       |
| **passport-google-oauth20** | ^2.0.0    | Google OAuth 2.0 authentication strategy  |
| **google-auth-library**     | ^10.5.0   | Google authentication library             |
| **cookie-session**          | ^2.1.1    | Session management using signed cookies   |
| **uuid**                    | ^8.3.2    | UUID generation for unique identifiers    |

### Development Dependencies

| Package       | Version | Purpose                                         |
| ------------- | ------- | ----------------------------------------------- |
| **jest**      | ^30.2.0 | Testing framework and test runner               |
| **supertest** | ^7.2.2  | HTTP assertions for integration testing         |
| **nodemon**   | ^3.1.11 | Auto-restart development server on file changes |

### Installation

All dependencies are automatically installed when running:

```bash
npm install
```

### Versioning Strategy

- **Caret (^)**: Uses compatible versions to the right. For example, `^5.2.1` allows changes that do not modify the left-most non-zero digit (i.e., `5.x.x` but not `6.x.x`)
- This ensures you get non-breaking updates while maintaining stability

---

All API endpoints return standardized error responses:

```json
{
  "error": "Error description",
  "details": "Additional error details (if applicable)"
}
```

### Common HTTP Status Codes

| Status Code | Meaning         |
| ----------- | --------------- |
| `200`       | ✅ Success      |
| `201`       | ✅ Created      |
| `400`       | ❌ Bad Request  |
| `404`       | ❌ Not Found    |
| `500`       | ❌ Server Error |

---

## 🛠️ Technologies Used

| Category              | Technology            |
| --------------------- | --------------------- |
| **Runtime**           | Node.js               |
| **Framework**         | Express.js            |
| **Database**          | MongoDB with Mongoose |
| **Testing**           | Jest                  |
| **Auto-reload**       | Nodemon               |
| **HTTP Client**       | Axios                 |
| **Environment**       | dotenv                |
| **Middleware**        | CORS                  |
| **Password Security** | bcryptjs              |
| **Authentication**    | JSON Web Token (JWT)  |

---
