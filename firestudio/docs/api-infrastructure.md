# Market Prices API Infrastructure

This document describes the comprehensive market prices API system that transforms the AgriAssist platform from a 3-record mock system to a full-featured market intelligence platform.

## Overview

The system integrates with the OGD India AGMARKNET API to provide real-time agricultural market price data for districts across Indian states, with comprehensive filtering, caching, and export capabilities.

## Architecture

### Data Flow
```
OGD India API → agmarknetClient → pricesService → API Routes → Frontend
                      ↓
                File System (JSON) ← fsio ← normalize ← date utils
```

### Core Components

#### 1. Type System (`/src/types/marketPrices.ts`)
- **PriceRecord**: Core data structure for market prices
- **DailyStateFile**: Daily aggregated data per state 
- **MetaIndex**: System metadata and statistics
- **QueryParams/Response**: API communication interfaces
- **FiltersPayload**: Dynamic filter options
- **RefreshRequest/Response**: Data refresh operations

#### 2. Normalization Layer (`/src/lib/normalize.ts`)
- **STATE_ALIASES**: Handles state name variations and typos
- **COMMODITY_ALIASES**: Standardizes commodity naming
- **Price Validation**: Ensures data quality and consistency
- **Search/Sort/Pagination**: Utility functions for data manipulation

#### 3. Date Utilities (`/src/lib/date.ts`)
- **OGD Format Conversion**: ISO ↔ DD-MM-YYYY format conversion
- **Business Day Calculations**: Filters for market operating days
- **Relative Time**: Human-readable time formatting

#### 4. File System I/O (`/src/lib/fsio.ts`)
- **Atomic Operations**: Safe JSON file writes with temp+rename
- **Directory Management**: Automatic creation of data directories
- **Data Structure Helpers**: Read/write operations for all data types

#### 5. OGD API Client (`/src/services/agmarknetClient.ts`)
- **Rate Limiting**: 2 requests/second to respect API limits
- **Pagination**: Automatic handling of large datasets
- **Retry Logic**: Exponential backoff for network errors
- **Data Mapping**: OGD format → normalized PriceRecord conversion

#### 6. Business Logic (`/src/services/pricesService.ts`)
- **Caching Layer**: 5-minute TTL for frequent queries
- **Query Engine**: Advanced filtering, sorting, and pagination
- **Refresh Operations**: Automated data updates
- **Popular Commodities**: AI-driven commodity ranking
- **System Health**: Monitoring and diagnostics

## API Endpoints

### 1. Query Prices (`GET /api/prices`)

Retrieve market price data with comprehensive filtering options.

**Query Parameters:**
- `date` (string): ISO date (YYYY-MM-DD), defaults to today
- `state` (string): State name filter
- `district` (string): District name filter  
- `market` (string): Market name filter
- `commodity` (string): Commodity name filter
- `variety` (string): Variety name filter
- `q` (string): Free-text search across all fields
- `sortBy` (string): Sort field (date|state|district|market|commodity|variety|modal_price)
- `sortDir` (string): Sort direction (asc|desc), defaults to desc
- `limit` (number): Results per page (1-1000), defaults to 100
- `offset` (number): Results offset for pagination, defaults to 0

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "state": "Gujarat",
      "district": "Ahmedabad", 
      "market": "Ahmedabad",
      "commodity": "Wheat",
      "variety": "HD-2967",
      "arrival_date": "2024-01-15",
      "min_price": 2100,
      "max_price": 2250,
      "modal_price": 2180
    }
  ],
  "pagination": {
    "total": 1500,
    "limit": 100,
    "offset": 0,
    "has_more": true
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Export Data (`POST /api/prices`)

Export filtered data as CSV or JSON files.

**Request Body:**
```json
{
  "format": "csv",
  "filters": {
    "state": "Gujarat",
    "commodity": "Wheat"
  },
  "filename": "gujarat_wheat_prices"
}
```

**Response:**
- CSV: `text/csv` with `Content-Disposition: attachment`
- JSON: `application/json` with `Content-Disposition: attachment`

### 3. Refresh Data (`POST /api/prices/refresh`)

Trigger data refresh for specified dates and states.

**Headers:**
- `X-ADMIN-KEY`: Admin authentication key (from environment)

**Request Body:**
```json
{
  "date": "2024-01-15",
  "states": ["Gujarat", "Tamil Nadu"],
  "force": false
}
```

**Response:**
```json
{
  "refresh_status": "completed",
  "message": "Refresh completed successfully",
  "date": "2024-01-15",
  "states": ["Gujarat", "Tamil Nadu"],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "result": {
    "success_count": 2,
    "error_count": 0,
    "errors": []
  }
}
```

### 4. Get Filter Options (`GET/POST /api/filters`)

Retrieve available filter options with context awareness.

**POST Request Body (optional):**
```json
{
  "states": ["Gujarat"],
  "districts": ["Ahmedabad"]
}
```

**Response:**
```json
{
  "success": true,
  "filters": {
    "states": ["Gujarat", "Tamil Nadu", "Karnataka"],
    "districts": ["Ahmedabad", "Surat", "Vadodara"],
    "markets": ["Ahmedabad", "APMC Surat"],
    "commodities": ["Wheat", "Rice", "Cotton"],
    "varieties": ["HD-2967", "PB-1121", "Shankar-6"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 5. System Metadata (`GET /api/meta`)

Get system health and statistics.

**Response:**
```json
{
  "success": true,
  "meta": {
    "status": "healthy",
    "last_updated": "2024-01-15T09:00:00.000Z",
    "total_records": 125000,
    "states_count": 15,
    "commodities_count": 150,
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-01-15"
    },
    "cache_stats": {
      "size": 25,
      "hit_rate": 0.85
    },
    "ogd_connectivity": true,
    "disk_usage_mb": 45.2,
    "message": "All systems operational"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Data Storage Structure

```
/data/prices/
├── meta.json                 # System metadata and index
├── popular/
│   ├── assam.json           # Popular commodities per state
│   ├── delhi.json
│   └── ...
└── 2024-01-15/              # Daily data folders
    ├── assam.json           # State data files
    ├── delhi.json
    └── ...
```

### File Formats

**DailyStateFile (`{date}/{state}.json`):**
```json
{
  "state": "Gujarat",
  "date": "2024-01-15",
  "records": [/* PriceRecord[] */],
  "status": "success",
  "record_count": 1500,
  "last_updated": "2024-01-15T09:00:00.000Z"
}
```

**MetaIndex (`meta.json`):**
```json
{
  "last_updated": "2024-01-15T09:00:00.000Z",
  "total_records": 125000,
  "states_count": 15,
  "commodities_count": 150,
  "varieties_count": 450,
  "date_range": {
    "from": "2024-01-01", 
    "to": "2024-01-15"
  },
  "refresh_status": "idle"
}
```

## Environment Configuration

```env
# Required for refresh operations
ADMIN_KEY=your-secure-admin-key

# Optional: Customize data directory
DATA_ROOT=/path/to/data  # defaults to ./data
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing/invalid admin key)
- `500`: Internal Server Error

## Performance Features

### Caching Strategy
- **Query Cache**: 5-minute TTL for repeated queries
- **Filter Cache**: 10-minute TTL for filter options
- **Popular Commodities**: Daily computation with file cache

### Rate Limiting
- **OGD API**: 2 requests/second with exponential backoff
- **File Operations**: Atomic writes prevent corruption
- **Memory Management**: Streaming for large datasets

### Scalability
- **Pagination**: Configurable limits (1-1000 records)
- **Virtualization Ready**: Response format supports virtual scrolling
- **Export Streaming**: Large exports don't block memory

## Next Steps

1. **Frontend Integration**: Connect React components to API endpoints
2. **Testing**: Unit tests for all services and API routes  
3. **Monitoring**: Enhanced logging and metrics collection
4. **Documentation**: API reference and integration guides
5. **Performance**: Query optimization and response caching

## Data Coverage

**Target States:**
- Assam, Delhi, Tamil Nadu, Telangana, Gujarat, Karnataka
- Additional states returned by OGD API

**Popular Commodities:**
- Wheat, Rice, Cotton, Sugarcane, Onion, Potato, Tomato
- State-specific trending commodities based on market activity

**Update Frequency:**
- Daily automated refresh
- Manual refresh via API
- Real-time filter updates

This infrastructure provides a robust foundation for the comprehensive market intelligence platform requested by the user.
