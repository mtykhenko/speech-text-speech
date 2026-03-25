#!/bin/bash

# Speech-to-Text & Text-to-Speech Platform Setup Script

set -e

echo "🚀 Setting up Speech-to-Text & Text-to-Speech Platform..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before starting services"
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo "📁 Creating storage directories..."
mkdir -p storage/audio storage/voices storage/documents tmp

# Create .gitkeep files
touch storage/audio/.gitkeep storage/voices/.gitkeep storage/documents/.gitkeep

# Build and start services
echo "🐳 Building Docker containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📍 Access points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo "   Health:    http://localhost:8000/health"
echo ""
echo "📝 Next steps:"
echo "   1. Edit .env file with your API keys"
echo "   2. Restart services: docker-compose restart"
echo "   3. View logs: docker-compose logs -f"
echo ""
echo "🛑 To stop: docker-compose down"
echo "🗑️  To reset: docker-compose down -v"
