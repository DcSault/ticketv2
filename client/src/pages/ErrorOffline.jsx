import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function ErrorOffline() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem('dinoHighScore') || '0')
  );
  const [gameOver, setGameOver] = useState(false);

  // Configuration du jeu
  const gameConfig = {
    gravity: 0.6,
    jumpStrength: -12,
    gameSpeed: 6,
    obstacleFrequency: 100,
  };

  // État du jeu
  const gameState = useRef({
    dino: { x: 50, y: 0, velocity: 0, jumping: false },
    obstacles: [],
    frameCount: 0,
    running: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 200;

    const ground = canvas.height - 20;
    const dinoWidth = 40;
    const dinoHeight = 40;

    // Initialiser le dinosaure
    gameState.current.dino.y = ground - dinoHeight;

    // Fonction de saut
    const jump = () => {
      if (!gameState.current.dino.jumping && gameState.current.running) {
        gameState.current.dino.velocity = gameConfig.jumpStrength;
        gameState.current.dino.jumping = true;
      }
    };

    // Gestion des touches
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameState.current.running && !gameOver) {
          startGame();
        } else {
          jump();
        }
      }
      if (e.code === 'Enter' && gameOver) {
        resetGame();
      }
    };

    // Gestion du clic
    const handleClick = () => {
      if (!gameState.current.running && !gameOver) {
        startGame();
      } else if (gameState.current.running) {
        jump();
      } else if (gameOver) {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleClick);

    // Démarrer le jeu
    const startGame = () => {
      gameState.current.running = true;
      gameState.current.frameCount = 0;
      setGameStarted(true);
      setGameOver(false);
      setScore(0);
    };

    // Réinitialiser le jeu
    const resetGame = () => {
      gameState.current = {
        dino: { x: 50, y: ground - dinoHeight, velocity: 0, jumping: false },
        obstacles: [],
        frameCount: 0,
        running: false,
      };
      setGameOver(false);
      setScore(0);
      startGame();
    };

    // Dessiner le dinosaure
    const drawDino = () => {
      const dino = gameState.current.dino;
      ctx.fillStyle = '#535353';
      
      // Corps
      ctx.fillRect(dino.x, dino.y, dinoWidth, dinoHeight);
      
      // Tête
      ctx.fillRect(dino.x + 25, dino.y - 10, 15, 15);
      
      // Oeil
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dino.x + 30, dino.y - 5, 5, 5);
      
      // Pattes (animation simple)
      ctx.fillStyle = '#535353';
      const legOffset = Math.floor(gameState.current.frameCount / 6) % 2 === 0 ? 0 : 5;
      ctx.fillRect(dino.x + 5, dino.y + dinoHeight, 8, 10 + legOffset);
      ctx.fillRect(dino.x + 25, dino.y + dinoHeight, 8, 10 + (5 - legOffset));
    };

    // Dessiner un obstacle (cactus)
    const drawObstacle = (obstacle) => {
      ctx.fillStyle = '#535353';
      
      // Corps du cactus
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Bras du cactus
      ctx.fillRect(obstacle.x - 8, obstacle.y + 15, 8, 15);
      ctx.fillRect(obstacle.x + obstacle.width, obstacle.y + 10, 8, 15);
    };

    // Dessiner le sol
    const drawGround = () => {
      ctx.strokeStyle = '#535353';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, ground);
      ctx.lineTo(canvas.width, ground);
      ctx.stroke();
      
      // Petites lignes décoratives
      for (let i = 0; i < canvas.width; i += 20) {
        const offset = (gameState.current.frameCount + i) % 40;
        ctx.fillRect(i - offset, ground + 5, 10, 2);
      }
    };

    // Détection de collision
    const checkCollision = () => {
      const dino = gameState.current.dino;
      
      for (let obstacle of gameState.current.obstacles) {
        if (
          dino.x < obstacle.x + obstacle.width &&
          dino.x + dinoWidth > obstacle.x &&
          dino.y < obstacle.y + obstacle.height &&
          dino.y + dinoHeight > obstacle.y
        ) {
          return true;
        }
      }
      return false;
    };

    // Boucle de jeu
    const gameLoop = () => {
      // Effacer le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dessiner le sol
      drawGround();

      if (gameState.current.running) {
        // Mettre à jour le dinosaure
        const dino = gameState.current.dino;
        dino.velocity += gameConfig.gravity;
        dino.y += dino.velocity;

        // Vérifier si le dino est au sol
        if (dino.y >= ground - dinoHeight) {
          dino.y = ground - dinoHeight;
          dino.velocity = 0;
          dino.jumping = false;
        }

        // Générer des obstacles
        gameState.current.frameCount++;
        if (gameState.current.frameCount % gameConfig.obstacleFrequency === 0) {
          const height = 30 + Math.random() * 20;
          gameState.current.obstacles.push({
            x: canvas.width,
            y: ground - height,
            width: 20,
            height: height,
          });
        }

        // Mettre à jour et dessiner les obstacles
        gameState.current.obstacles = gameState.current.obstacles.filter((obstacle) => {
          obstacle.x -= gameConfig.gameSpeed;
          
          if (obstacle.x + obstacle.width > 0) {
            drawObstacle(obstacle);
            return true;
          }
          
          // Incrémenter le score quand un obstacle est passé
          setScore((s) => s + 1);
          return false;
        });

        // Vérifier les collisions
        if (checkCollision()) {
          gameState.current.running = false;
          setGameOver(true);
          
          // Mettre à jour le high score
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('dinoHighScore', score.toString());
          }
        }
      }

      // Dessiner le dinosaure
      drawDino();

      // Afficher le score
      ctx.fillStyle = '#535353';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`Score: ${score}`, canvas.width - 150, 30);
      ctx.fillText(`Best: ${highScore}`, canvas.width - 150, 55);

      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleClick);
    };
  }, [score, highScore, gameOver]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-4xl w-full">
        {/* En-tête avec animation */}
        <div className="mb-8 animate-fade-in">
          <div className="text-6xl mb-4 animate-bounce">
            🦖
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Vous êtes <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">hors ligne</span>
          </h1>
          <p className="text-gray-300 text-lg mb-2">
            La page n'est pas disponible
          </p>
          <p className="text-gray-400 text-sm">
            Mais vous pouvez jouer en attendant ! 🎮
          </p>
        </div>

        {/* Zone de jeu */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 animate-scale-in">
          <div className="mb-4">
            <canvas
              ref={canvasRef}
              className="border-4 border-gray-200 rounded-lg mx-auto shadow-inner bg-gray-50"
              style={{ maxWidth: '100%' }}
            />
          </div>

          {/* Instructions */}
          <div className="text-gray-600 space-y-2">
            {!gameStarted && !gameOver && (
              <div className="animate-pulse">
                <p className="text-lg font-semibold text-gray-800">
                  Appuyez sur <kbd className="px-3 py-1 bg-gray-200 rounded border-2 border-gray-300 font-mono">ESPACE</kbd> ou cliquez pour commencer
                </p>
              </div>
            )}
            
            {gameStarted && !gameOver && (
              <div>
                <p className="text-sm text-gray-500">
                  <kbd className="px-2 py-1 bg-gray-200 rounded border border-gray-300 font-mono text-xs">ESPACE</kbd> ou 
                  <kbd className="px-2 py-1 bg-gray-200 rounded border border-gray-300 font-mono text-xs ml-1">↑</kbd> pour sauter
                </p>
              </div>
            )}

            {gameOver && (
              <div className="animate-fade-in">
                <p className="text-2xl font-bold text-red-600 mb-2">
                  💥 Game Over !
                </p>
                <p className="text-lg text-gray-700 mb-2">
                  Score final : <span className="font-bold text-blue-600">{score}</span>
                </p>
                {score > highScore && (
                  <p className="text-green-600 font-semibold mb-2">
                    🎉 Nouveau record !
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Appuyez sur <kbd className="px-3 py-1 bg-gray-200 rounded border-2 border-gray-300 font-mono">ENTRÉE</kbd> ou cliquez pour rejouer
                </p>
              </div>
            )}
          </div>

          {/* Indicateur de high score */}
          {highScore > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-yellow-600">
                <span className="text-2xl">🏆</span>
                <span className="font-bold">Meilleur score : {highScore}</span>
              </div>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-4 justify-center animate-slide-in-up">
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Vérifier la connexion
            </span>
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Accueil (cache)
            </span>
          </button>
        </div>

        {/* Informations techniques */}
        <div className="mt-8 text-gray-400 text-sm">
          <p>Code erreur: <span className="font-mono font-bold text-yellow-400">OFFLINE</span></p>
          <p className="mt-2 text-xs">
            Les pages en cache restent accessibles • Synchronisation automatique à la reconnexion
          </p>
        </div>
      </div>
    </div>
  );
}

export default ErrorOffline;
