#!/bin/bash

echo "API bootstrap script startup"

if [[ $IOTENV == "development" || "$1" = "development" ]]; then
  echo "Starting API in development mode"
  npm run dev
else
  npm start
fi
