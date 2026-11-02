$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Start-Process -FilePath "$projectRoot\.venv\Scripts\python.exe" -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000" -WorkingDirectory "$projectRoot\backend" -WindowStyle Hidden
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "$projectRoot\frontend" -WindowStyle Hidden

Write-Host "ModemScope started:"
Write-Host "  Frontend  http://localhost:3000"
Write-Host "  API docs  http://localhost:8000/docs"
