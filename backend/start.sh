#!/bin/bash
# Install Chromium if not already installed
if [ ! -d "/opt/render/.cache/puppeteer/chrome" ]; then
  echo "🔽 Installing Chromium for Puppeteer..."
  npx puppeteer browsers install chrome
else
  echo "✅ Chromium already installed"
fi

# Start the server
npm start
