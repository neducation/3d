// 3D Army Runner Game Engine
class Game3D {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.enemies = [];
    this.collectibles = [];
    this.multipliers = [];
    this.coins = [];
    this.obstacles = [];

    // Game state
    this.gameState = "loading"; // loading, start, playing, gameOver
    this.score = 0;
    this.armySize = 10;
    this.coinsCollected = 0;
    this.level = 1;
    this.distance = 0;
    this.speed = 0.1;
    this.spawnRate = 60;
    this.difficulty = 1;

    // Player movement
    this.playerX = 0;
    this.targetX = 0;
    this.isDragging = false;
    this.lastMouseX = 0;

    // Game objects
    this.gameObjects = [];
    this.particles = [];

    // Timing
    this.lastSpawn = 0;
    this.gameTime = 0;

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLights();
    this.setupPlayer();
    this.setupControls();
    this.setupUI();
    this.startLoadingSequence();
  }

  setupRenderer() {
    this.canvas = document.getElementById("gameCanvas");
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x87ceeb, 1);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

    // Create ground
    this.createGround();
    this.createEnvironment();
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 15, 20);
    this.camera.lookAt(0, 0, 0);
  }

  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    this.scene.add(directionalLight);

    // Point light for player
    this.playerLight = new THREE.PointLight(0x4caf50, 1, 30);
    this.playerLight.position.set(0, 5, 0);
    this.scene.add(this.playerLight);
  }

  createGround() {
    // Main road
    const roadGeometry = new THREE.PlaneGeometry(20, 1000);
    const roadMaterial = new THREE.MeshLambertMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.8,
    });
    this.road = new THREE.Mesh(roadGeometry, roadMaterial);
    this.road.rotation.x = -Math.PI / 2;
    this.road.position.y = -0.1;
    this.road.receiveShadow = true;
    this.scene.add(this.road);

    // Lane markers
    for (let i = 0; i < 100; i++) {
      const markerGeometry = new THREE.BoxGeometry(0.2, 0.1, 2);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(-3, 0, -i * 10);
      this.scene.add(marker);

      const marker2 = new THREE.Mesh(markerGeometry, markerMaterial);
      marker2.position.set(3, 0, -i * 10);
      this.scene.add(marker2);
    }

    // Side terrain
    const terrainGeometry = new THREE.PlaneGeometry(100, 1000);
    const terrainMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.2;
    terrain.receiveShadow = true;
    this.scene.add(terrain);
  }

  createEnvironment() {
    // Create trees and rocks randomly
    for (let i = 0; i < 50; i++) {
      if (Math.random() > 0.5) {
        this.createTree(-25 + Math.random() * 10, -i * 20);
        this.createTree(15 + Math.random() * 10, -i * 20);
      }

      if (Math.random() > 0.7) {
        this.createRock(-20 + Math.random() * 5, -i * 15);
        this.createRock(15 + Math.random() * 5, -i * 15);
      }
    }
  }

  createTree(x, z) {
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 3, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1.5, z);
    trunk.castShadow = true;
    this.scene.add(trunk);

    // Tree crown
    const crownGeometry = new THREE.SphereGeometry(2, 8, 6);
    const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.set(x, 4, z);
    crown.castShadow = true;
    this.scene.add(crown);
  }

  createRock(x, z) {
    const rockGeometry = new THREE.DodecahedronGeometry(1 + Math.random());
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, 0.5, z);
    rock.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    rock.castShadow = true;
    this.scene.add(rock);
  }

  setupPlayer() {
    // Create player army group
    this.player = new THREE.Group();
    this.playerSoldiers = [];

    this.updatePlayerArmy();
    this.scene.add(this.player);
  }

  updatePlayerArmy() {
    // Clear existing soldiers
    this.playerSoldiers.forEach((soldier) => this.player.remove(soldier));
    this.playerSoldiers = [];

    // Calculate formation
    const rows = Math.ceil(Math.sqrt(this.armySize));
    const cols = Math.ceil(this.armySize / rows);
    let soldierIndex = 0;

    for (let row = 0; row < rows && soldierIndex < this.armySize; row++) {
      for (let col = 0; col < cols && soldierIndex < this.armySize; col++) {
        const soldier = this.createSoldier();
        soldier.position.set((col - cols / 2) * 0.8, 0, (row - rows / 2) * 0.8);
        this.player.add(soldier);
        this.playerSoldiers.push(soldier);
        soldierIndex++;
      }
    }

    this.player.position.set(0, 0, 0);
  }

  createSoldier() {
    const soldier = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.2);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    soldier.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.15);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbae });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1;
    head.castShadow = true;
    soldier.add(head);

    // Helmet
    const helmetGeometry = new THREE.SphereGeometry(0.17);
    const helmetMaterial = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.y = 1;
    helmet.castShadow = true;
    soldier.add(helmet);

    // Weapon
    const weaponGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.05);
    const weaponMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0.2, 0.6, 0);
    weapon.castShadow = true;
    soldier.add(weapon);

    return soldier;
  }

  setupControls() {
    // Mouse/Touch controls
    this.canvas.addEventListener("mousedown", (e) => this.onPointerDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.onPointerMove(e));
    this.canvas.addEventListener("mouseup", (e) => this.onPointerUp(e));

    this.canvas.addEventListener("touchstart", (e) =>
      this.onPointerDown(e.touches[0])
    );
    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      this.onPointerMove(e.touches[0]);
    });
    this.canvas.addEventListener("touchend", (e) => this.onPointerUp(e));

    // Window resize
    window.addEventListener("resize", () => this.onWindowResize());
  }

  onPointerDown(e) {
    if (this.gameState !== "playing") return;
    this.isDragging = true;
    this.lastMouseX = e.clientX;
  }

  onPointerMove(e) {
    if (this.gameState !== "playing" || !this.isDragging) return;

    const deltaX = e.clientX - this.lastMouseX;
    this.targetX += deltaX * 0.01;
    this.targetX = Math.max(-6, Math.min(6, this.targetX));
    this.lastMouseX = e.clientX;
  }

  onPointerUp(e) {
    this.isDragging = false;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setupUI() {
    // UI elements
    this.loadingScreen = document.getElementById("loadingScreen");
    this.startScreen = document.getElementById("startScreen");
    this.gameHUD = document.getElementById("gameHUD");
    this.gameOverScreen = document.getElementById("gameOverScreen");
    this.touchIndicator = document.getElementById("touchIndicator");

    // Buttons
    document
      .getElementById("startBtn")
      .addEventListener("click", () => this.startGame());
    document
      .getElementById("restartBtn")
      .addEventListener("click", () => this.restartGame());

    // HUD elements
    this.scoreEl = document.getElementById("score");
    this.armySizeEl = document.getElementById("armySize");
    this.coinsEl = document.getElementById("coins");
    this.levelEl = document.getElementById("level");
    this.distanceEl = document.getElementById("distance");
  }

  startLoadingSequence() {
    const progressBar = document.querySelector(".loading-progress");
    let progress = 0;

    const loadingInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingInterval);
        setTimeout(() => this.showStartScreen(), 500);
      }
      progressBar.style.width = progress + "%";
    }, 200);
  }

  showStartScreen() {
    this.loadingScreen.style.display = "none";
    this.startScreen.style.display = "flex";
    this.gameState = "start";
    this.animate();
  }

  startGame() {
    this.startScreen.style.display = "none";
    this.gameHUD.style.display = "block";
    this.touchIndicator.style.display = "block";
    this.gameState = "playing";

    // Reset game state
    this.score = 0;
    this.armySize = 10;
    this.coinsCollected = 0;
    this.level = 1;
    this.distance = 0;
    this.speed = 0.1;
    this.difficulty = 1;
    this.gameTime = 0;

    this.updatePlayerArmy();
    this.updateUI();

    setTimeout(() => {
      this.touchIndicator.style.display = "none";
    }, 3000);
  }

  restartGame() {
    // Clear all game objects
    this.enemies.forEach((enemy) => this.scene.remove(enemy));
    this.collectibles.forEach((collectible) => this.scene.remove(collectible));
    this.multipliers.forEach((multiplier) => this.scene.remove(multiplier));
    this.coins.forEach((coin) => this.scene.remove(coin));
    this.particles.forEach((particle) => this.scene.remove(particle));

    this.enemies = [];
    this.collectibles = [];
    this.multipliers = [];
    this.coins = [];
    this.particles = [];

    this.gameOverScreen.style.display = "none";
    this.startGame();
  }

  createEnemy(x, z, health = 1) {
    const enemy = new THREE.Group();
    enemy.userData = {
      health: health * this.difficulty,
      maxHealth: health * this.difficulty,
      type: "enemy",
    };

    // Enemy body
    const bodyGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.3);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    enemy.add(body);

    // Enemy head
    const headGeometry = new THREE.SphereGeometry(0.2);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xc0392b });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.2;
    head.castShadow = true;
    enemy.add(head);

    // Health indicator
    const healthBarGeometry = new THREE.PlaneGeometry(0.8, 0.1);
    const healthBarMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8,
    });
    const healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
    healthBar.position.y = 1.6;
    healthBar.lookAt(this.camera.position);
    enemy.add(healthBar);

    enemy.position.set(x, 0, z);
    this.enemies.push(enemy);
    this.scene.add(enemy);

    return enemy;
  }

  createMultiplier(x, z, value) {
    const multiplier = new THREE.Group();
    multiplier.userData = { value: value, type: "multiplier" };

    // Base
    const baseGeometry = new THREE.CylinderGeometry(1, 1.2, 0.3, 8);
    const baseMaterial = new THREE.MeshLambertMaterial({
      color: value > 0 ? 0x4caf50 : 0xe74c3c,
      transparent: true,
      opacity: 0.8,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.15;
    base.castShadow = true;
    multiplier.add(base);

    // Sign
    const signGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
    const signMaterial = new THREE.MeshLambertMaterial({
      color: value > 0 ? 0x66bb6a : 0xef5350,
    });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.y = 1;
    sign.castShadow = true;
    multiplier.add(sign);

    // Text (simplified - in real game you'd use TextGeometry)
    const textGeometry = new THREE.PlaneGeometry(1.2, 0.6);
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.font = "bold 60px Arial";
    context.textAlign = "center";
    context.fillText(value > 0 ? `x${value}` : `${value}`, 128, 80);

    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const text = new THREE.Mesh(textGeometry, textMaterial);
    text.position.y = 1;
    text.position.z = 0.06;
    multiplier.add(text);

    multiplier.position.set(x, 0, z);
    multiplier.rotation.y = Math.PI;

    // Add floating animation
    multiplier.userData.originalY = 0;
    multiplier.userData.floatOffset = Math.random() * Math.PI * 2;

    this.multipliers.push(multiplier);
    this.scene.add(multiplier);

    return multiplier;
  }

  createCoin(x, z) {
    const coin = new THREE.Group();
    coin.userData = { type: "coin", value: 1 };

    const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
    const coinMaterial = new THREE.MeshLambertMaterial({
      color: 0xffd700,
      emissive: 0x333300,
    });
    const coinMesh = new THREE.Mesh(coinGeometry, coinMaterial);
    coinMesh.rotation.x = Math.PI / 2;
    coinMesh.castShadow = true;
    coin.add(coinMesh);

    coin.position.set(x, 1, z);
    coin.userData.rotationSpeed = 0.05;

    this.coins.push(coin);
    this.scene.add(coin);

    return coin;
  }

  spawnObjects() {
    if (this.gameTime - this.lastSpawn < this.spawnRate) return;

    const spawnZ = -30;
    const lanes = [-4, -2, 0, 2, 4];

    // Spawn pattern based on level
    if (Math.random() < 0.3) {
      // Spawn enemy group
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const enemyCount = Math.floor(this.difficulty + Math.random() * 3);
      const health = Math.floor(1 + this.difficulty * 0.5);

      for (let i = 0; i < enemyCount; i++) {
        this.createEnemy(
          lane + (Math.random() - 0.5) * 2,
          spawnZ - i * 2,
          health
        );
      }
    }

    if (Math.random() < 0.2) {
      // Spawn multiplier
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const value = Math.random() < 0.7 ? 2 : -1;
      this.createMultiplier(lane, spawnZ, value);
    }

    if (Math.random() < 0.4) {
      // Spawn coins
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const coinCount = Math.floor(1 + Math.random() * 3);

      for (let i = 0; i < coinCount; i++) {
        this.createCoin(lane + (Math.random() - 0.5) * 1, spawnZ - i * 1.5);
      }
    }

    this.lastSpawn = this.gameTime;
    this.spawnRate = Math.max(30, 60 - this.level * 2);
  }

  updateGameObjects() {
    // Update player position
    this.playerX += (this.targetX - this.playerX) * 0.1;
    this.player.position.x = this.playerX;

    // Keep camera following player at fixed relative position
    this.camera.position.x = this.playerX * 0.3;
    this.camera.position.y = 15;
    this.camera.position.z = this.player.position.z + 20;
    this.camera.lookAt(this.player.position.x, 0, this.player.position.z);

    // Update distance and difficulty
    this.distance += this.speed * 100;
    this.level = Math.floor(this.distance / 1000) + 1;
    this.difficulty = 1 + (this.level - 1) * 0.3;
    this.speed = 0.1 + this.level * 0.01;

    // Update enemies
    this.enemies.forEach((enemy, index) => {
      enemy.position.z += this.speed;

      // Remove if too far
      if (enemy.position.z > 20) {
        this.scene.remove(enemy);
        this.enemies.splice(index, 1);
        return;
      }

      // Check collision with player
      const distance = enemy.position.distanceTo(this.player.position);
      if (distance < 2) {
        this.handleEnemyCollision(enemy, index);
      }
    });

    // Update multipliers
    this.multipliers.forEach((multiplier, index) => {
      multiplier.position.z += this.speed;

      // Floating animation
      multiplier.position.y =
        multiplier.userData.originalY +
        Math.sin(this.gameTime * 0.02 + multiplier.userData.floatOffset) * 0.3;
      multiplier.rotation.y += 0.02;

      if (multiplier.position.z > 20) {
        this.scene.remove(multiplier);
        this.multipliers.splice(index, 1);
        return;
      }

      // Check collision
      const distance = multiplier.position.distanceTo(this.player.position);
      if (distance < 2) {
        this.handleMultiplierCollision(multiplier, index);
      }
    });

    // Update coins
    this.coins.forEach((coin, index) => {
      coin.position.z += this.speed;
      coin.rotation.y += coin.userData.rotationSpeed;

      if (coin.position.z > 20) {
        this.scene.remove(coin);
        this.coins.splice(index, 1);
        return;
      }

      // Check collision
      const distance = coin.position.distanceTo(this.player.position);
      if (distance < 1.5) {
        this.handleCoinCollision(coin, index);
      }
    });

    // Update particles
    this.particles.forEach((particle, index) => {
      particle.position.add(particle.userData.velocity);
      particle.userData.velocity.multiplyScalar(0.98);
      particle.userData.life -= 0.02;

      if (particle.userData.life <= 0) {
        this.scene.remove(particle);
        this.particles.splice(index, 1);
      } else {
        particle.material.opacity = particle.userData.life;
      }
    });
  }

  handleEnemyCollision(enemy, index) {
    if (this.armySize <= 0) return;

    const damage = Math.min(this.armySize, enemy.userData.health);
    this.armySize -= damage;
    enemy.userData.health -= damage;

    // Create hit particles
    this.createHitParticles(enemy.position, 0xff0000);

    if (enemy.userData.health <= 0) {
      this.score += Math.floor(enemy.userData.maxHealth * 10 * this.difficulty);
      this.scene.remove(enemy);
      this.enemies.splice(index, 1);

      // Create explosion particles
      this.createExplosionParticles(enemy.position);
    }

    // Update army formation
    this.updatePlayerArmy();

    // Check game over
    if (this.armySize <= 0) {
      this.gameOver();
    }

    // Play sound
    this.playSound("hitSound");
  }

  handleMultiplierCollision(multiplier, index) {
    const value = multiplier.userData.value;

    if (value > 0) {
      this.armySize = Math.floor(this.armySize * value);
    } else {
      this.armySize = Math.floor(this.armySize / 2);
    }

    this.armySize = Math.max(1, Math.min(200, this.armySize));

    this.updatePlayerArmy();
    this.createCollectParticles(
      multiplier.position,
      value > 0 ? 0x4caf50 : 0xe74c3c
    );

    this.scene.remove(multiplier);
    this.multipliers.splice(index, 1);

    this.playSound("collectSound");
  }

  handleCoinCollision(coin, index) {
    this.coinsCollected += coin.userData.value;
    this.score += 5;

    this.createCollectParticles(coin.position, 0xffd700);

    this.scene.remove(coin);
    this.coins.splice(index, 1);

    this.playSound("collectSound");
  }

  createHitParticles(position, color) {
    for (let i = 0; i < 5; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.1);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      particle.position.copy(position);
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        Math.random() * 0.2,
        (Math.random() - 0.5) * 0.3
      );
      particle.userData.life = 1;

      this.particles.push(particle);
      this.scene.add(particle);
    }
  }

  createExplosionParticles(position) {
    for (let i = 0; i < 10; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.05);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xff6b35 : 0xf7931e,
        transparent: true,
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      particle.position.copy(position);
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        Math.random() * 0.3,
        (Math.random() - 0.5) * 0.4
      );
      particle.userData.life = 1;

      this.particles.push(particle);
      this.scene.add(particle);
    }
  }

  createCollectParticles(position, color) {
    for (let i = 0; i < 8; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.08);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      particle.position.copy(position);
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        Math.random() * 0.25,
        (Math.random() - 0.5) * 0.2
      );
      particle.userData.life = 1;

      this.particles.push(particle);
      this.scene.add(particle);
    }
  }

  playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {}); // Ignore autoplay restrictions
    }
  }

  updateUI() {
    this.scoreEl.textContent = this.score.toLocaleString();
    this.armySizeEl.textContent = this.armySize;
    this.coinsEl.textContent = this.coinsCollected;
    this.levelEl.textContent = this.level;
    this.distanceEl.textContent = Math.floor(this.distance) + "m";
  }

  gameOver() {
    this.gameState = "gameOver";
    this.gameHUD.style.display = "none";
    this.gameOverScreen.style.display = "flex";

    // Update final stats
    document.getElementById("finalScore").textContent =
      this.score.toLocaleString();
    document.getElementById("finalLevel").textContent = this.level;
    document.getElementById("finalDistance").textContent =
      Math.floor(this.distance) + "m";
    document.getElementById("finalCoins").textContent = this.coinsCollected;
  }

  animate() {
    if (this.gameState === "playing") {
      this.gameTime++;
      this.spawnObjects();
      this.updateGameObjects();
      this.updateUI();
    }

    // Always render
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize game when page loads
window.addEventListener("load", () => {
  new Game3D();
});

// Prevent context menu on mobile
window.addEventListener("contextmenu", (e) => e.preventDefault());

// Prevent default touch behaviors
document.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  },
  { passive: false }
);

document.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);
