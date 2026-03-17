@echo off
echo ===================================================
echo   TATA MOTORS CRM - INITIAL SETUP
echo ===================================================
echo.

cd backend

echo [1/2] Creating Database Schema...
node src/scripts/setupDatabase.js

echo.
echo [2/2] Seeding Initial Data (Users, Dealers, Mappings)...
node src/scripts/seedData.js

echo.
echo ===================================================
echo   SETUP COMPLETED SUCCESSFULLY
echo ===================================================
echo.
echo To start the application:
echo 1. Open a terminal in /backend and run: npm run dev
echo 2. Open another terminal in /frontend and run: npm run dev
echo.
pause
