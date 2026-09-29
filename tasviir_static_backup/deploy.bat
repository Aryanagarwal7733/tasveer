@echo off
title Tasveer by Prince Studio - 1-Click Live Deployer
color 0A
echo =========================================================
echo    TASVEER BY PRINCE STUDIO - 1-CLICK LIVE DEPLOYER
echo =========================================================
echo.
echo [*] Deploying all updates to live website (tasviir.in)...
cd /d "%~dp0"
call vercel --prod --yes
echo.
echo =========================================================
echo    [SUCCESS] Website updated live successfully!
echo =========================================================
pause
