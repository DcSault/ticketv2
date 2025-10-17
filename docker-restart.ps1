# Script pour redémarrer Docker proprement
Write-Host "🛑 Arrêt et nettoyage des conteneurs..." -ForegroundColor Yellow
docker-compose down -v

Write-Host "🚀 Redémarrage avec reconstruction complète..." -ForegroundColor Cyan
docker-compose up -d

Write-Host ""
Write-Host "📊 Voir les logs en temps réel:" -ForegroundColor Green
Write-Host "   docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "✅ L'application sera disponible sur:" -ForegroundColor Green
Write-Host "   http://localhost:7979" -ForegroundColor Cyan
Write-Host ""
Write-Host "👤 Identifiants:" -ForegroundColor Green
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
