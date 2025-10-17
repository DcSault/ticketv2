# Script de démarrage rapide
Write-Host "🚀 Démarrage de TicketV2..." -ForegroundColor Cyan

# Vérifier si .env existe
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  Fichier .env non trouvé. Copie du fichier .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Fichier .env créé. Veuillez le configurer avant de continuer." -ForegroundColor Green
    Write-Host "📝 Éditez le fichier .env avec vos paramètres PostgreSQL" -ForegroundColor Yellow
    notepad .env
    Read-Host "Appuyez sur Entrée une fois la configuration terminée"
}

# Vérifier si node_modules existe
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances backend..." -ForegroundColor Yellow
    npm install
}

# Vérifier si client/node_modules existe
if (-Not (Test-Path "client/node_modules")) {
    Write-Host "📦 Installation des dépendances frontend..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "✨ Prêt à démarrer !" -ForegroundColor Green
Write-Host ""
Write-Host "Options disponibles:" -ForegroundColor Cyan
Write-Host "1. Initialiser la base de données" -ForegroundColor White
Write-Host "2. Démarrer l'application (dev)" -ForegroundColor White
Write-Host "3. Quitter" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Choisissez une option (1-3)"

switch ($choice) {
    "1" {
        Write-Host "🗄️  Initialisation de la base de données..." -ForegroundColor Yellow
        npm run db:setup
        Write-Host ""
        Write-Host "✅ Base de données initialisée !" -ForegroundColor Green
        Write-Host ""
        Write-Host "Voulez-vous démarrer l'application maintenant ? (O/N)" -ForegroundColor Cyan
        $start = Read-Host
        if ($start -eq "O" -or $start -eq "o") {
            Write-Host "🚀 Démarrage de l'application..." -ForegroundColor Cyan
            npm run dev
        }
    }
    "2" {
        Write-Host "🚀 Démarrage de l'application..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📍 Backend:  http://localhost:3000" -ForegroundColor Yellow
        Write-Host "📍 Frontend: http://localhost:5173" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "👤 Identifiants par défaut:" -ForegroundColor Cyan
        Write-Host "   Username: admin" -ForegroundColor White
        Write-Host "   Password: admin123" -ForegroundColor White
        Write-Host ""
        npm run dev
    }
    "3" {
        Write-Host "👋 Au revoir !" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "❌ Option invalide" -ForegroundColor Red
    }
}
