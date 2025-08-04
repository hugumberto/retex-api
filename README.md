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
- `GET /user/:id` - Get user by ID (requires ADMIN or OPS role)

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

## How to run

To execute de project you need to have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.
You can run the project using the following command:

```bash
docker-compose up
```

Once the project is running, you can access it at the port configurated in the `.env` file (default `3000`). The API includes the following endpoints:

- (GET) `/` - Home page
- (POST) `/auth/login` - User login
- (POST) `/auth/refresh` - Refresh access token
- (POST) `/auth/logout` - User logout
- (GET) `/auth/profile` - Get authenticated user profile
- (POST) `/user` - Create a new user
- (GET) `/user/:id` - Get a user by id (protected - requires ADMIN or OPS role)

The API documentation is available at `/api` when running in development mode.
