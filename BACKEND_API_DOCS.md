# Backend API Documentation - Complete Reference

## Base URL
```
http://localhost:3000
```

---

## Authentication

### 1. Register User
**Endpoint:** `POST /auth/register`

**Headers:**
```
Content-Type: application/json
```

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
  "id": "uuid",
  "username": "string",
  "name": "string",
  "email": "string",
  "createdAt": "2025-12-24T10:00:00.000Z",
  "updatedAt": "2025-12-24T10:00:00.000Z"
}
```

---

### 2. Login User
**Endpoint:** `POST /auth/login`

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
  "access_token": "jwt_token_here",
  "user": {
    "userId": "uuid",
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

---

## Users

All endpoints require JWT token in headers:
```
Authorization: Bearer {access_token}
```

### 3. Get Current User Profile
**Endpoint:** `GET /users/profile`

**Response (200):**
```json
{
  "id": "uuid",
  "username": "string",
  "name": "string",
  "email": "string",
  "profileImage": "string | null",
  "createdAt": "2025-12-24T10:00:00.000Z",
  "updatedAt": "2025-12-24T10:00:00.000Z"
}
```

---

### 4. Get All Users
**Endpoint:** `GET /users`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "username": "string",
    "name": "string",
    "email": "string"
  }
]
```

---

## Debts (CRUD)

All endpoints require JWT token.

### 5. Create Debt
**Endpoint:** `POST /debts/crud`

**Request Body:**
```json
{
  "type": "hutang" | "piutang",
  "name": "string",
  "otherUserId": "uuid (optional)",
  "amount": 100000,
  "description": "string",
  "date": "2025-12-24",
  "groupId": "uuid (optional)",
  "status": "pending | confirmed | rejected | settlement_requested (optional, default: confirmed)"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "hutang",
  "name": "John Doe",
  "otherUserId": "uuid | null",
  "amount": "100000.00",
  "description": "Dinner payment",
  "date": "2025-12-24T00:00:00.000Z",
  "isPaid": false,
  "groupId": "uuid | null",
  "status": "confirmed",
  "initiatedBy": "uuid",
  "approvedBy": null,
  "approvedAt": null,
  "rejectionReason": null,
  "createdAt": "2025-12-24T10:00:00.000Z",
  "updatedAt": "2025-12-24T10:00:00.000Z",
  "user": {
    "id": "uuid",
    "name": "string",
    "username": "string"
  },
  "otherUser": {
    "id": "uuid",
    "name": "string",
    "username": "string"
  }
}
```

---

### 6. Get All Debts
**Endpoint:** `GET /debts/crud`

**Query Parameters (all optional):**
- `type`: `hutang` | `piutang`
- `isPaid`: `true` | `false`
- `status`: `pending` | `confirmed` | `rejected` | `settlement_requested`

**Example:** `GET /debts/crud?type=hutang&isPaid=false`

**Response (200):** Array of debt objects

---

### 7. Get Debt Summary
**Endpoint:** `GET /debts/crud/summary`

**Response (200):**
```json
{
  "totalHutang": 500000,
  "totalPiutang": 300000,
  "totalPaidHutang": 100000,
  "totalPaidPiutang": 50000,
  "netBalance": -200000,
  "totalDebts": 10,
  "unpaidDebts": 6,
  "paidDebts": 4
}
```

---

### 8. Get Debt by ID
**Endpoint:** `GET /debts/crud/:id`

**Response (200):** Single debt object

**Error (404):**
```json
{
  "statusCode": 404,
  "message": "Debt not found"
}
```

---

### 9. Update Debt
**Endpoint:** `PUT /debts/crud/:id`

**Request Body (all fields optional):**
```json
{
  "type": "hutang | piutang",
  "name": "string",
  "otherUserId": "uuid",
  "amount": 100000,
  "description": "string",
  "date": "2025-12-24",
  "isPaid": true,
  "status": "confirmed",
  "rejectionReason": "string"
}
```

**Response (200):** Updated debt object

---

### 10. Delete Debt
**Endpoint:** `DELETE /debts/crud/:id`

**Response (200):**
```json
{
  "ok": true
}
```

---

### 11. Mark Debt as Paid
**Endpoint:** `POST /debts/crud/:id/mark-paid`

**Response (200):** Updated debt object with `isPaid: true`

---

### 12. Mark Debt as Unpaid
**Endpoint:** `POST /debts/crud/:id/mark-unpaid`

**Response (200):** Updated debt object with `isPaid: false`

---

## Debt Optimization (Algorithms)

### 13. Optimize Debts
**Endpoint:** `POST /debts/optimize`

**Request Body:**
```json
{
  "allDebts": [
    {
      "id": "string",
      "userId": "string",
      "type": "hutang | piutang",
      "amount": 100000,
      "isPaid": false
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
      "userId": "uuid",
      "userName": "John",
      "balance": 50000
    }
  ],
  "optimizedDebts": [
    {
      "from": "uuid",
      "fromName": "Alice",
      "to": "uuid",
      "toName": "Bob",
      "amount": 30000
    }
  ],
  "totalTransactions": 3,
  "totalAmount": 100000
}
```

---

### 14. Simulate Payment
**Endpoint:** `POST /debts/simulate`

**Request Body:**
```json
{
  "allDebts": [...],
  "allUsers": [...],
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "amount": 50000
}
```

**Response (200):**
```json
{
  "before": [...optimizedDebts],
  "after": [...optimizedDebts],
  "impact": "Mengurangi 2 transaksi"
}
```

---

### 15. Find Payment Path
**Endpoint:** `POST /debts/path`

**Request Body:**
```json
{
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "optimizedDebts": [...] // or provide allDebts + allUsers
}
```

**Response (200):**
```json
{
  "path": {
    "from": "uuid",
    "fromName": "Alice",
    "to": "uuid",
    "toName": "Bob",
    "amount": 50000
  }
}
```

---

### 16. Get User Suggestions
**Endpoint:** `POST /debts/suggestions`

**Request Body:**
```json
{
  "userId": "uuid",
  "optimizedDebts": [...] // or provide allDebts + allUsers
}
```

**Response (200):**
```json
{
  "shouldPay": [
    {
      "from": "uuid",
      "fromName": "Alice",
      "to": "uuid",
      "toName": "Bob",
      "amount": 50000
    }
  ],
  "willReceive": [...]
}
```

---

## Groups

All endpoints require JWT token.

### 17. Create Group
**Endpoint:** `POST /groups`

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "groupImage": "string (optional)"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Weekend Trip",
  "description": "Trip expenses",
  "creatorId": "uuid",
  "isActive": true,
  "groupImage": "url | null",
  "createdAt": "2025-12-24T10:00:00.000Z",
  "updatedAt": "2025-12-24T10:00:00.000Z",
  "creator": {
    "id": "uuid",
    "name": "John",
    "username": "john123"
  },
  "members": [
    {
      "id": "uuid",
      "userId": "uuid",
      "groupId": "uuid",
      "joinedAt": "2025-12-24T10:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "John",
        "username": "john123"
      }
    }
  ],
  "_count": {
    "members": 1,
    "transactions": 0
  }
}
```

---

### 18. Get All Groups
**Endpoint:** `GET /groups`

**Response (200):** Array of group objects (only groups where user is a member)

---

### 19. Get Group by ID
**Endpoint:** `GET /groups/:id`

**Response (200):**
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "creatorId": "uuid",
  "isActive": true,
  "groupImage": "url | null",
  "createdAt": "2025-12-24T10:00:00.000Z",
  "updatedAt": "2025-12-24T10:00:00.000Z",
  "creator": {...},
  "members": [...],
  "transactions": [...],
  "settlements": [...],
  "_count": {
    "members": 5,
    "transactions": 10,
    "settlements": 2
  }
}
```

---

### 20. Update Group
**Endpoint:** `PUT /groups/:id`

**Note:** Only group creator can update

**Request Body (all fields optional):**
```json
{
  "name": "string",
  "description": "string",
  "groupImage": "string",
  "isActive": false
}
```

**Response (200):** Updated group object

---

### 21. Delete Group
**Endpoint:** `DELETE /groups/:id`

**Note:** Only group creator can delete

**Response (200):**
```json
{
  "ok": true
}
```

---

### 22. Get Group Members
**Endpoint:** `GET /groups/:id/members`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "groupId": "uuid",
    "joinedAt": "2025-12-24T10:00:00.000Z",
    "user": {
      "id": "uuid",
      "name": "John",
      "username": "john123",
      "email": "john@example.com"
    }
  }
]
```

---

### 23. Add Group Member
**Endpoint:** `POST /groups/:id/members`

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "groupId": "uuid",
  "joinedAt": "2025-12-24T10:00:00.000Z",
  "user": {
    "id": "uuid",
    "name": "Alice",
    "username": "alice123"
  }
}
```

**Error (403):**
```json
{
  "statusCode": 403,
  "message": "User is already a member"
}
```

---

### 24. Remove Group Member
**Endpoint:** `DELETE /groups/:id/members/:userId`

**Note:** Only creator can remove members, or user can remove themselves. Cannot remove creator.

**Response (200):**
```json
{
  "ok": true
}
```

---

## Group Transactions

All endpoints require JWT token.

### 25. Create Group Transaction
**Endpoint:** `POST /group-transactions`

**Request Body:**
```json
{
  "groupId": "uuid",
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "amount": 100000,
  "description": "string",
  "date": "2025-12-24"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "groupId": "uuid",
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "amount": "100000.00",
  "description": "Dinner split",
  "date": "2025-12-24T00:00:00.000Z",
  "isPaid": false,
  "createdBy": "uuid",
  "createdAt": "2025-12-24T10:00:00.000Z",
  "updatedAt": "2025-12-24T10:00:00.000Z",
  "fromUser": {
    "id": "uuid",
    "name": "Alice",
    "username": "alice123"
  },
  "toUser": {
    "id": "uuid",
    "name": "Bob",
    "username": "bob456"
  },
  "creator": {
    "id": "uuid",
    "name": "John",
    "username": "john123"
  }
}
```

---

### 26. Get Group Transactions
**Endpoint:** `GET /group-transactions`

**Query Parameters (optional):**
- `groupId`: Filter by specific group

**Example:** `GET /group-transactions?groupId=uuid`

**Response (200):** Array of transaction objects

---

### 27. Get Group Transaction by ID
**Endpoint:** `GET /group-transactions/:id`

**Response (200):** Single transaction object

---

### 28. Update Group Transaction
**Endpoint:** `PUT /group-transactions/:id`

**Note:** Only transaction creator can update

**Request Body (all fields optional):**
```json
{
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "amount": 150000,
  "description": "string",
  "date": "2025-12-25",
  "isPaid": true
}
```

**Response (200):** Updated transaction object

---

### 29. Delete Group Transaction
**Endpoint:** `DELETE /group-transactions/:id`

**Note:** Only transaction creator can delete

**Response (200):**
```json
{
  "ok": true
}
```

---

### 30. Mark Transaction as Paid
**Endpoint:** `POST /group-transactions/:id/mark-paid`

**Response (200):** Updated transaction with `isPaid: true`

---

### 31. Mark Transaction as Unpaid
**Endpoint:** `POST /group-transactions/:id/mark-unpaid`

**Response (200):** Updated transaction with `isPaid: false`

---

## Settlement Requests

All endpoints require JWT token.

### 32. Create Settlement Request
**Endpoint:** `POST /settlement-requests`

**Note:** Only the payer (fromUserId) can create. Automatically sets status to "pending".

**Request Body:**
```json
{
  "groupId": "uuid",
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "amount": 100000,
  "description": "string"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "groupId": "uuid",
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "amount": "100000.00",
  "description": "Settlement for group expenses",
  "status": "pending",
  "rejectionReason": null,
  "reviewedBy": null,
  "reviewedAt": null,
  "createdAt": "2025-12-24T10:00:00.000Z",
  "updatedAt": "2025-12-24T10:00:00.000Z",
  "fromUser": {
    "id": "uuid",
    "name": "Alice",
    "username": "alice123"
  },
  "toUser": {
    "id": "uuid",
    "name": "Bob",
    "username": "bob456"
  },
  "group": {
    "id": "uuid",
    "name": "Weekend Trip"
  }
}
```

---

### 33. Get Settlement Requests
**Endpoint:** `GET /settlement-requests`

**Query Parameters (all optional):**
- `groupId`: Filter by group
- `status`: `pending` | `approved` | `rejected`

**Example:** `GET /settlement-requests?groupId=uuid&status=pending`

**Response (200):** Array of settlement request objects

---

### 34. Get Pending Settlements for User
**Endpoint:** `GET /settlement-requests/pending`

**Query Parameters (optional):**
- `groupId`: Filter by group

**Response (200):** Array of pending settlements where user is either payer or receiver

---

### 35. Get Settlement Request by ID
**Endpoint:** `GET /settlement-requests/:id`

**Response (200):** Single settlement request object

---

### 36. Review Settlement Request
**Endpoint:** `POST /settlement-requests/:id/review`

**Note:** Only the recipient (toUserId) can review

**Request Body:**
```json
{
  "status": "approved" | "rejected",
  "rejectionReason": "string (optional, required if rejected)"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "approved",
  "rejectionReason": null,
  "reviewedBy": "uuid",
  "reviewedAt": "2025-12-24T10:30:00.000Z",
  ...rest of settlement object
}
```

---

### 37. Delete Settlement Request
**Endpoint:** `DELETE /settlement-requests/:id`

**Note:** Only creator can delete, and only if status is "pending"

**Response (200):**
```json
{
  "ok": true
}
```

---

## Payment Methods

All endpoints require JWT token.

### 38. Create Payment Method
**Endpoint:** `POST /payment-methods`

**Request Body:**
```json
{
  "type": "bank_transfer | credit_card | e_wallet | cash",
  "provider": "string (BCA, Mandiri, OVO, DANA, etc.)",
  "accountNumber": "string",
  "accountHolder": "string",
  "isPrimary": false
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "bank_transfer",
  "provider": "BCA",
  "accountNumber": "1234567890",
  "accountHolder": "John Doe",
  "isPrimary": false,
  "isActive": true,
  "createdAt": "2025-12-24T10:00:00.000Z",
  "updatedAt": "2025-12-24T10:00:00.000Z"
}
```

---

### 39. Get All Payment Methods
**Endpoint:** `GET /payment-methods`

**Response (200):** Array of payment method objects (ordered by isPrimary desc, then createdAt desc)

---

### 40. Get Primary Payment Method
**Endpoint:** `GET /payment-methods/primary`

**Response (200):** Single payment method object or `null`

---

### 41. Get Payment Method by ID
**Endpoint:** `GET /payment-methods/:id`

**Response (200):** Single payment method object

---

### 42. Update Payment Method
**Endpoint:** `PUT /payment-methods/:id`

**Request Body (all fields optional):**
```json
{
  "type": "string",
  "provider": "string",
  "accountNumber": "string",
  "accountHolder": "string",
  "isPrimary": true,
  "isActive": true
}
```

**Response (200):** Updated payment method object

---

### 43. Delete Payment Method
**Endpoint:** `DELETE /payment-methods/:id`

**Response (200):**
```json
{
  "ok": true
}
```

---

### 44. Set as Primary Payment Method
**Endpoint:** `POST /payment-methods/:id/set-primary`

**Note:** Automatically unsets other payment methods as primary

**Response (200):** Updated payment method with `isPrimary: true`

---

## Activity Tracking

### 45. Get Recent Activities
**Endpoint:** `GET /debts/activities`

**Query Parameters (optional):**
- `limit`: number (default: 10, max stored: 50)

**Example:** `GET /debts/activities?limit=20`

**Response (200):**
```json
[
  {
    "id": "string",
    "timestamp": "2025-12-24T10:00:00.000Z",
    "type": "payment | new_debt | settled",
    "from": "uuid",
    "fromName": "Alice",
    "to": "uuid",
    "toName": "Bob",
    "amount": 50000,
    "description": "Dinner payment"
  }
]
```

---

### 46. Get Activities for User
**Endpoint:** `GET /debts/activities/:userId`

**Query Parameters (optional):**
- `limit`: number (default: 10)

**Response (200):** Array of activity objects involving the user

---

### 47. Add Activity
**Endpoint:** `POST /debts/activity`

**Request Body:**
```json
{
  "type": "payment | new_debt | settled",
  "from": "uuid",
  "fromName": "string",
  "to": "uuid",
  "toName": "string",
  "amount": 50000,
  "description": "string"
}
```

**Response (201):**
```json
{
  "id": "actXXXXXXXXXX",
  "timestamp": "2025-12-24T10:00:00.000Z",
  ...rest of activity data
}
```

---

### 48. Clear All Activities
**Endpoint:** `DELETE /debts/activities`

**Response (200):**
```json
{
  "ok": true
}
```

---

## Error Responses

All endpoints may return these common errors:

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Only group creator can update the group"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Resource not found"
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

## Authorization Rules

### Debts (CRUD)
- User can only create/read/update/delete their own debts
- `userId` is automatically set from JWT token

### Groups
- Any member can view group details
- Only creator can update/delete group
- Any member can add new members
- Only creator can remove members (or user can remove themselves)
- Cannot remove group creator

### Group Transactions
- Must be a group member to create transactions
- Only transaction creator can update/delete
- Any group member can view group transactions

### Settlement Requests
- Only payer (fromUser) can create settlement request
- Only recipient (toUser) can approve/reject
- Only creator can delete (and only if pending)
- Any group member can view settlements

### Payment Methods
- User can only manage their own payment methods
- Setting a method as primary automatically unsets others

---

## Notes

1. **JWT Token Management:**
   - Token is returned in `/auth/login` response
   - Include in `Authorization: Bearer {token}` header for protected endpoints
   - Token should be stored securely (AsyncStorage/SecureStore)

2. **Date Format:**
   - All dates are in ISO 8601 format (UTC)
   - When sending dates, use: `YYYY-MM-DD` or full ISO string

3. **Decimal Amounts:**
   - Amounts are returned as strings (e.g., `"100000.00"`)
   - Send as numbers in requests

4. **Activity Tracking:**
   - Activities are stored in-memory (resets on server restart)
   - Max 50 activities are kept

5. **Pagination:**
   - Not implemented yet for large datasets
   - Consider adding pagination if lists grow large

6. **File Uploads:**
   - `profileImage` and `groupImage` currently accept URLs
   - File upload endpoints not implemented yet

---

## Quick Start Testing

1. **Start Backend:**
   ```bash
   npm run start:dev
   ```

2. **Register a User:**
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test123","name":"Test User","email":"test@example.com"}'
   ```

3. **Login:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test123"}'
   ```

4. **Use Token:**
   ```bash
   curl -X GET http://localhost:3000/users/profile \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

---

## Frontend Integration Checklist

- [ ] Create API client with axios
- [ ] Implement token storage (AsyncStorage/SecureStore)
- [ ] Create auth context with login/register/logout
- [ ] Implement token refresh logic
- [ ] Create API service files for each resource
- [ ] Add error handling and user feedback
- [ ] Implement loading states
- [ ] Add offline support (optional)
- [ ] Test all critical flows
