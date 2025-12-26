#!/bin/bash
echo "🐳 Stopping old containers..."
docker-compose -f docker-compose.prod.yml down

echo "🏗️  Building Docker image (this may take a while)..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting container..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Done! Access app at http://localhost:3000"
docker-compose -f docker-compose.prod.yml logs -f
