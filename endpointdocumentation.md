# Debt Application - Endpoint Documentation

## Base URL
```
http://localhost:3000
```

---

## Authentication Endpoints

### 1. Register User
**Endpoint:** `POST /auth/register`

**Description:** Create a new user account.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "email": "string"
}
```

**Response (201):**
```json
{
  "id": "string",
  "username": "string",
  "name": "string",
  "email": "string",
  "password": "hashed_password"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123",
    "name": "Alice Smith",
    "email": "alice@example.com"
  }'
```

---

### 2. Login User
**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "string",
    "username": "string",
    "name": "string",
    "email": "string"
  }
}
```

**Error (401):**
```json
{
  "statusCode": 401,
  "message": "Username atau password salah"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123"
  }'
```

---

## User Endpoints

### 3. Get User Profile
**Endpoint:** `GET /users/profile`

**Description:** Get authenticated user's profile information. **Requires JWT token.**

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "id": "string",
  "username": "string",
  "name": "string",
  "email": "string"
}
```

**Error (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 4. Get All Users
**Endpoint:** `GET /users`

**Description:** Get all users in the system. **Requires JWT token.**

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
[
  {
    "id": "string",
    "username": "string",
    "name": "string",
    "email": "string"
  },
  ...
]
```

**Example cURL:**
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Debt Optimization Endpoints

### 5. Optimize Debts
**Endpoint:** `POST /debts/optimize`

**Description:** Calculate user balances and generate optimized debt settlement transactions using greedy algorithm. Minimizes number of transactions needed.

**Request Body:**
```json
{
  "allDebts": [
    {
      "id": "string",
      "userId": "string",
      "type": "hutang" | "piutang",
      "amount": number,
      "isPaid": boolean
    }
  ],
  "allUsers": [
    {
      "id": "string",
      "name": "string"
    }
  ]
}
```

**Response (200):**
```json
{
  "balances": [
    {
      "userId": "string",
      "userName": "string",
      "balance": number
    }
  ],
  "optimizedDebts": [
    {
      "from": "userId",
      "fromName": "string",
      "to": "userId",
      "toName": "string",
      "amount": number
    }
  ],
  "totalTransactions": number,
  "totalAmount": number
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/debts/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "allDebts": [
      {
        "id": "d1",
        "userId": "u1",
        "type": "hutang",
        "amount": 50000,
        "isPaid": false
      },
      {
        "id": "d2",
        "userId": "u2",
        "type": "piutang",
        "amount": 30000,
        "isPaid": false
      }
    ],
    "allUsers": [
      {"id": "u1", "name": "Alice"},
      {"id": "u2", "name": "Bob"}
    ]
  }'
```

**Explanation:**
- `balance > 0` = user has piutang (others owe them)
- `balance < 0` = user has hutang (they owe others)
- Optimized debts show minimum transactions needed to settle all debts

---

### 6. Simulate Payment
**Endpoint:** `POST /debts/simulate`

**Description:** Simulate a payment between two users and see how it affects the optimized debt graph.

**Request Body:**
```json
{
  "allDebts": [
    {
      "id": "string",
      "userId": "string",
      "type": "hutang" | "piutang",
      "amount": number,
      "isPaid": boolean
    }
  ],
  "allUsers": [
    {
      "id": "string",
      "name": "string"
    }
  ],
  "fromUserId": "string",
  "toUserId": "string",
  "amount": number
}
```

**Response (200):**
```json
{
  "before": [
    {
      "from": "userId",
      "fromName": "string",
      "to": "userId",
      "toName": "string",
      "amount": number
    }
  ],
  "after": [
    {
      "from": "userId",
      "fromName": "string",
      "to": "userId",
      "toName": "string",
      "amount": number
    }
  ],
  "impact": "Mengurangi 2 transaksi" | "Tidak ada perubahan" | "Menambah transaksi"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/debts/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "allDebts": [
      {"id": "d1", "userId": "u1", "type": "hutang", "amount": 50000, "isPaid": false},
      {"id": "d2", "userId": "u2", "type": "piutang", "amount": 30000, "isPaid": false}
    ],
    "allUsers": [
      {"id": "u1", "name": "Alice"},
      {"id": "u2", "name": "Bob"}
    ],
    "fromUserId": "u1",
    "toUserId": "u2",
    "amount": 20000
  }'
```

---

### 7. Find Direct Payment Path
**Endpoint:** `POST /debts/path`

**Description:** Find if there's a direct optimized payment from one user to another.

**Request Body:**
```json
{
  "fromUserId": "string",
  "toUserId": "string",
  "allDebts": [optional],
  "allUsers": [optional],
  "optimizedDebts": [optional]
}
```

**Note:** Either provide `optimizedDebts` directly, OR provide both `allDebts` and `allUsers` (service will calculate).

**Response (200) - If path exists:**
```json
{
  "path": {
    "from": "userId",
    "fromName": "string",
    "to": "userId",
    "toName": "string",
    "amount": number
  }
}
```

**Response (200) - If no path exists:**
```json
{
  "path": null
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/debts/path \
  -H "Content-Type: application/json" \
  -d '{
    "fromUserId": "u1",
    "toUserId": "u2",
    "optimizedDebts": [
      {"from": "u1", "fromName": "Alice", "to": "u2", "toName": "Bob", "amount": 20000}
    ]
  }'
```

---

### 8. Get User Suggestions
**Endpoint:** `POST /debts/suggestions`

**Description:** Get payment suggestions for a specific user (who they should pay and who owes them).

**Request Body:**
```json
{
  "userId": "string",
  "allDebts": [optional],
  "allUsers": [optional],
  "optimizedDebts": [optional]
}
```

**Response (200):**
```json
{
  "shouldPay": [
    {
      "from": "string",
      "fromName": "string",
      "to": "string",
      "toName": "string",
      "amount": number
    }
  ],
  "willReceive": [
    {
      "from": "string",
      "fromName": "string",
      "to": "string",
      "toName": "string",
      "amount": number
    }
  ]
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/debts/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "u1",
    "optimizedDebts": [
      {"from": "u1", "fromName": "Alice", "to": "u2", "toName": "Bob", "amount": 20000}
    ]
  }'
```

---

## Activity Tracking Endpoints

### 9. Get Recent Activities
**Endpoint:** `GET /debts/activities?limit=10`

**Description:** Get recent debt-related activities (payments, new debts, settlements).

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 10, max tracked: 50)

**Response (200):**
```json
[
  {
    "id": "string",
    "timestamp": "ISO8601 datetime",
    "type": "payment" | "new_debt" | "settled",
    "from": "string",
    "fromName": "string",
    "to": "string",
    "toName": "string",
    "amount": number,
    "description": "string"
  }
]
```

**Example cURL:**
```bash
curl -X GET "http://localhost:3000/debts/activities?limit=5"
```

---

### 10. Get Activities for Specific User
**Endpoint:** `GET /debts/activities/:userId?limit=10`

**Description:** Get debt activities involving a specific user.

**Path Parameters:**
- `userId`: User ID to filter by

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 10)

**Response (200):**
```json
[
  {
    "id": "string",
    "timestamp": "ISO8601 datetime",
    "type": "payment" | "new_debt" | "settled",
    "from": "string",
    "fromName": "string",
    "to": "string",
    "toName": "string",
    "amount": number,
    "description": "string"
  }
]
```

**Example cURL:**
```bash
curl -X GET "http://localhost:3000/debts/activities/u1?limit=5"
```

---

### 11. Add Activity
**Endpoint:** `POST /debts/activity`

**Description:** Manually log a debt activity.

**Request Body:**
```json
{
  "type": "payment" | "new_debt" | "settled",
  "from": "string",
  "fromName": "string",
  "to": "string",
  "toName": "string",
  "amount": number,
  "description": "string"
}
```

**Response (201):**
```json
{
  "id": "string",
  "timestamp": "ISO8601 datetime",
  "type": "string",
  "from": "string",
  "fromName": "string",
  "to": "string",
  "toName": "string",
  "amount": number,
  "description": "string"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/debts/activity \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "from": "u1",
    "fromName": "Alice",
    "to": "u2",
    "toName": "Bob",
    "amount": 20000,
    "description": "Bayar makan bersama"
  }'
```

---

### 12. Clear All Activities
**Endpoint:** `DELETE /debts/activities`

**Description:** Delete all tracked activities (in-memory storage).

**Response (200):**
```json
{
  "ok": true
}
```

**Example cURL:**
```bash
curl -X DELETE http://localhost:3000/debts/activities
```

---

## Payment Method Endpoints

### 13. Create Payment Method
**Endpoint:** `POST /payment-methods`

**Description:** Add a new payment method for the authenticated user. **Requires JWT token.**

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "type": "bank_transfer" | "credit_card" | "e_wallet" | "cash",
  "provider": "BCA" | "Mandiri" | "OVO" | "DANA" | "Visa" | "Mastercard",
  "accountNumber": "string",
  "accountHolder": "string",
  "isPrimary": boolean (optional, default: false)
}
```

**Response (201):**
```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "provider": "string",
  "accountNumber": "string",
  "accountHolder": "string",
  "isPrimary": boolean,
  "isActive": true,
  "createdAt": "2025-12-24T10:30:00Z",
  "updatedAt": "2025-12-24T10:30:00Z"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/payment-methods \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bank_transfer",
    "provider": "BCA",
    "accountNumber": "123456789",
    "accountHolder": "Alice Smith",
    "isPrimary": true
  }'
```

---

### 14. Get All Payment Methods
**Endpoint:** `GET /payment-methods`

**Description:** Get all payment methods for the authenticated user. **Requires JWT token.**

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
[
  {
    "id": "string",
    "userId": "string",
    "type": "string",
    "provider": "string",
    "accountNumber": "string",
    "accountHolder": "string",
    "isPrimary": boolean,
    "isActive": boolean,
    "createdAt": "ISO8601 datetime",
    "updatedAt": "ISO8601 datetime"
  }
]
```

**Example cURL:**
```bash
curl -X GET http://localhost:3000/payment-methods \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 15. Get Primary Payment Method
**Endpoint:** `GET /payment-methods/primary`

**Description:** Get the primary payment method for the authenticated user. **Requires JWT token.**

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "provider": "string",
  "accountNumber": "string",
  "accountHolder": "string",
  "isPrimary": true,
  "isActive": true,
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime"
}
```

**Response (204) - No primary set:**
```
null
```

**Example cURL:**
```bash
curl -X GET http://localhost:3000/payment-methods/primary \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 16. Get Payment Method by ID
**Endpoint:** `GET /payment-methods/:id`

**Description:** Get a specific payment method by ID. **Requires JWT token. Only owner can access.**

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `id`: Payment method ID

**Response (200):**
```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "provider": "string",
  "accountNumber": "string",
  "accountHolder": "string",
  "isPrimary": boolean,
  "isActive": boolean,
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime"
}
```

**Error (404):**
```json
{
  "statusCode": 404,
  "message": "Payment method not found"
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:3000/payment-methods/pm-uuid-here \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 17. Update Payment Method
**Endpoint:** `PUT /payment-methods/:id`

**Description:** Update a payment method. **Requires JWT token. Only owner can update.**

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `id`: Payment method ID

**Request Body:** (all fields optional)
```json
{
  "type": "string",
  "provider": "string",
  "accountNumber": "string",
  "accountHolder": "string",
  "isPrimary": boolean,
  "isActive": boolean
}
```

**Response (200):**
```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "provider": "string",
  "accountNumber": "string",
  "accountHolder": "string",
  "isPrimary": boolean,
  "isActive": boolean,
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime"
}
```

**Example cURL:**
```bash
curl -X PUT http://localhost:3000/payment-methods/pm-uuid-here \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountHolder": "Alice Johnson",
    "isPrimary": false
  }'
```

---

### 18. Delete Payment Method
**Endpoint:** `DELETE /payment-methods/:id`

**Description:** Delete a payment method. **Requires JWT token. Only owner can delete.**

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `id`: Payment method ID

**Response (200):**
```json
{
  "ok": true
}
```

**Error (404):**
```json
{
  "statusCode": 404,
  "message": "Payment method not found"
}
```

**Example cURL:**
```bash
curl -X DELETE http://localhost:3000/payment-methods/pm-uuid-here \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 19. Set as Primary Payment Method
**Endpoint:** `POST /payment-methods/:id/set-primary`

**Description:** Set a payment method as primary (automatically unsets other primary). **Requires JWT token. Only owner can set.**

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `id`: Payment method ID

**Response (200):**
```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "provider": "string",
  "accountNumber": "string",
  "accountHolder": "string",
  "isPrimary": true,
  "isActive": boolean,
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/payment-methods/pm-uuid-here/set-primary \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Summary Table

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login and get JWT | No |
| GET | `/users/profile` | Get user profile | Yes |
| GET | `/users` | Get all users | Yes |
| POST | `/debts/optimize` | Calculate optimized debts | No |
| POST | `/debts/simulate` | Simulate payment impact | No |
| POST | `/debts/path` | Find payment path | No |
| POST | `/debts/suggestions` | Get user suggestions | No |
| GET | `/debts/activities` | Get recent activities | No |
| GET | `/debts/activities/:userId` | Get user activities | No |
| POST | `/debts/activity` | Log activity | No |
| DELETE | `/debts/activities` | Clear activities | No |
| POST | `/payment-methods` | Create payment method | Yes |
| GET | `/payment-methods` | Get all payment methods | Yes |
| GET | `/payment-methods/primary` | Get primary payment method | Yes |
| GET | `/payment-methods/:id` | Get payment method by ID | Yes |
| PUT | `/payment-methods/:id` | Update payment method | Yes |
| DELETE | `/payment-methods/:id` | Delete payment method | Yes |
| POST | `/payment-methods/:id/set-primary` | Set as primary | Yes |

---

## Authentication

Protected endpoints (marked with "Yes" in Auth Required) need:

```
Authorization: Bearer {access_token}
```

Get `access_token` from `/auth/login` response.

---

## Error Handling

All endpoints may return errors:

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid request"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Notes

- Debt optimizer uses **greedy algorithm** to minimize transactions
- Activities are stored **in-memory** (resets on server restart); can be persisted to DB if needed
- JWT tokens should be stored securely (httpOnly cookies recommended for frontend)
- All timestamps are in **ISO 8601 format** (UTC)
