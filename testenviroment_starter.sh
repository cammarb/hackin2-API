#!/bin/bash

# Start the test containers
echo "Starting test containers..."
docker compose -f test-compose.yml up -d

# Wait a moment for the containers to start
echo "Waiting for containers to initialize..."
sleep 5

# Generate private-public key pair
echo "Applying database migrations..."
./generate_keys.sh

# Apply migrations
echo "Applying database migrations..."
npx dotenv -e .env.test -- npx prisma db push

# Run test seed
echo "Running seed file..."
npx dotenv -e .env.test -- ts-node prisma/seeds/testSeed.ts

# Run the tests
echo "Running tests..."
npx dotenv -e .env.test -- jest --forceExit --detectOpenHandles

# Stop the test containers
echo "Stopping test containers..."
docker compose -f test-compose.yml down

echo "Test run completed."