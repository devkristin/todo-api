# Todo List API

REST API for a custom Daily Planner and Todo List application.

Built with Node.js, TypeScript, Express, TSOA, and a local Docker environment via the Supabase CLI.

## Prerequisites

- Node.js (v18+ recommended)
- Docker Desktop (must be open and running)

## Getting Started

1. Install Dependencies

   ```
   npm install
   ```

2. Create a Local Environment File (.env)

   You will copy and paste your local credentials here after they have been generated in step 3

   ```
   PORT=3000
   SUPABASE_URL="http://localhost:54321"
   SUPABASE_PUBLISHABLE_KEY="your-local-anon-key"
   SUPABASE_SECRET_KEY="your-local-service-role-key"
   ```

3. Set Up Local Supabase Environment

   Ensure Docker Desktop is active, then spin up Supabase

   ```
   npx supabase start
   ```

   - The terminal will print out your local keys upon completion
   - Copy those values into your .env file
   - Access the local database dashboard (Supabase Studio) at: http://localhost:54323

4. Run Local Development Server

   Automatically builds your TSOA Swagger documentation and boots the server connected to your local Docker/Supabase setup

   ```
   npm run dev
   ```

   - Access the API docs (Swagger) at: http://localhost:3000

5. Run Automated Tests

   Executes the integration test suite against your local isolated environment

   ```
   npm run test
   ```

6. Stop the Local Database

   To shut down the background Docker containers and free up system resources

   ```
   npx supabase stop
   ```

## Daily Workflow

1. Start Supabase

   Ensure Docker Desktop is active, then spin up Supabase

   ```
   npx supabase start
   ```

   - Access Supabase Studio at: http://localhost:54323

2. Run the API Server

   ```
   npm run dev
   ```

   - Access Swagger at: http://localhost:3000

3. Run Tests

   ```
   npm run test
   ```

4. Stop Supabase

   ```
   npx supabase stop
   ```
