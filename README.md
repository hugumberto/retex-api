# Retex API

Retex API is a scaffolding for creating a new edge application using [NestJS](https://nestjs.com/).

## Libraries

In this project, we use the following libraries:

- [NestJS](https://nestjs.com/)
- [Typescript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)
- [Prettier](https://prettier.io/)
- [Eslint](https://eslint.org/)
- [Husky](https://typicode.github.io/husky/#/)
- [CommitLint](https://commitlint.js.org/#/)
- [Docker](https://www.docker.com/)
- [TypeOrm](https://typeorm.io/)
- [Pino](https://getpino.io/#/)
- [JWT](https://jwt.io/) - Para autenticação
- [Bcrypt](https://www.npmjs.com/package/bcryptjs) - Para hash de senhas

## Configuration

The project requires a configuration file called `.env` to be present in the root of the project. This file contains the variables used in the project.

### Environment Variables

Create a `.env` file in the root of the project with the following variables:

```env
# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/retex

# JWT Configuration
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=1d

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Important:** Change the `JWT_SECRET` to a strong secret key in production!

### Migrations

To create new migrations for the application, run the following command:

```bash
yarn typeorm:migrate <NAME_OF_MIGRATION>
```

and to run them all, run the following command:

```bash
yarn typeorm:run
```

## Authentication System

The API includes a complete authentication system with the following features:

### User Roles

- `USER` - Regular user
- `DRIVER` - Driver role
- `OPS` - Operations team
- `ADMIN` - Administrator

### Security Features

- **Password Hashing**: Passwords are hashed using bcrypt with salt (12 rounds)
- **JWT Tokens**: Authentication using JSON Web Tokens (1 day expiration)
- **Refresh Tokens**: Secure refresh tokens for token renewal (7 days expiration)
- **Role-based Access Control**: Guards to control access based on user roles
- **Token Validation**: JWT verification for protected routes
- **Automatic Logout**: Token revocation system

### Authentication Endpoints

- `POST /auth/login` - User login (returns access_token and refresh_token)
- `POST /auth/refresh` - Renew tokens using refresh token
- `POST /auth/logout` - Logout user (revokes refresh token)
- `GET /auth/profile` - Get user profile (protected)

### User Management Endpoints

- `POST /user` - Create new user (public)
- `GET /user` - List all users (requires ADMIN or OPS role)
- `GET /user/:id` - Get user by ID (requires ADMIN or OPS role)
- `PUT /user/:id` - Update user (requires ADMIN or OPS role)
- `POST /user/:id/roles` - Add role to user (requires ADMIN role only)

### Token Management

The API implements a secure token management system:

#### Access Tokens (JWT)
- **Duration**: 1 day (configurable via JWT_EXPIRES_IN)
- **Usage**: Authorization for API requests
- **Storage**: Client-side (memory/secure storage recommended)

#### Refresh Tokens
- **Duration**: 7 days (hardcoded for security)
- **Usage**: Renew expired access tokens
- **Storage**: Database with revocation support
- **Security**: One-time use (revoked after refresh)

### Using Authentication

1. **Create a user** using `POST /user`:
```json
{
  "firstName": "João",
  "lastName": "Silva",
  "email": "joao@example.com",
  "contactPhone": "11999999999",
  "documentNumber": "12345678901",
  "password": "mypassword123"
}
```

2. **Login** using `POST /auth/login`:
```json
{
  "email": "joao@example.com",
  "password": "mypassword123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4e5f6...",
  "user": {
    "id": "uuid",
    "firstName": "João",
    "lastName": "Silva",
    "email": "joao@example.com",
    "roles": [{"role": "USER"}]
  }
}
```

3. **Use the access token** in subsequent requests:
```
Authorization: Bearer <your-access-token>
```

4. **Refresh tokens** when access token expires using `POST /auth/refresh`:
```json
{
  "refresh_token": "a1b2c3d4e5f6..."
}
```

5. **Logout** using `POST /auth/logout`:
```json
{
  "refresh_token": "a1b2c3d4e5f6..."
}
```

### User Management Operations

#### List All Users (ADMIN/OPS only)
```bash
GET /user
Authorization: Bearer <your-access-token>
```

#### Update User (ADMIN/OPS only)
```bash
PUT /user/:id
Authorization: Bearer <your-access-token>
Content-Type: application/json

{
  "firstName": "João Updated",
  "email": "newemail@example.com",
  "status": "INACTIVE"
}
```

#### Add Role to User (ADMIN only)
```bash
POST /user/:id/roles
Authorization: Bearer <your-access-token>
Content-Type: application/json

{
  "role": "DRIVER"
}
```

**Available roles**: `USER`, `DRIVER`, `OPS`, `ADMIN`

### Permission Matrix

| Endpoint | Public | USER | DRIVER | OPS | ADMIN |
|----------|--------|------|--------|-----|-------|
| `POST /user` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/refresh` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/logout` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /auth/profile` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /user` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `GET /user/:id` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `PUT /user/:id` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `POST /user/:id/roles` | ❌ | ❌ | ❌ | ❌ | ✅ |

### Guards and Decorators

- `@UseGuards(JwtAuthGuard)` - Requires valid JWT token
- `@UseGuards(JwtAuthGuard, RolesGuard)` - Requires valid token and specific roles
- `@Roles(Role.ADMIN, Role.OPS)` - Specifies required roles

Example usage:
```typescript
@Get('admin-only')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async adminOnlyEndpoint() {
  // Only users with ADMIN role can access
}
```

### Best Practices

1. **Token Storage**:
   - Store access tokens in memory or secure storage
   - Store refresh tokens securely (HttpOnly cookies recommended)

2. **Token Refresh**:
   - Automatically refresh access tokens before expiration
   - Handle refresh token expiration gracefully

3. **Security**:
   - Always use HTTPS in production
   - Implement proper CORS policies
   - Monitor for suspicious token usage

4. **Role Management**:
   - Only ADMIN users can add roles to other users
   - Use principle of least privilege
   - Regularly audit user permissions

## How to run

To execute de project you need to have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.
You can run the project using the following command:

```bash
docker-compose up
```

Once the project is running, you can access it at the port configurated in the `.env` file (default `3000`). The API includes the following endpoints:

### Available Endpoints

#### Public Endpoints
- (GET) `/` - Home page
- (POST) `/auth/login` - User login
- (POST) `/auth/refresh` - Refresh access token
- (POST) `/auth/logout` - User logout
- (POST) `/user` - Create a new user

#### Protected Endpoints (Authentication Required)
- (GET) `/auth/profile` - Get authenticated user profile

#### Admin/OPS Endpoints (ADMIN or OPS role required)
- (GET) `/user` - List all users
- (GET) `/user/:id` - Get a user by id
- (PUT) `/user/:id` - Update a user

#### Admin Only Endpoints (ADMIN role required)
- (POST) `/user/:id/roles` - Add role to user

The API documentation is available at `/api` when running in development mode.
