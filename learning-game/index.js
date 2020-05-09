let ui = {
  grid: null,
  score: null
};

let tiles = [];
const board = {
  width: 5,
  height: 5
};

const tileSize = 128;
let turnCount = 0;

// How many turns before the enemy can move
const enemySpeed = 3;
const enemySpawnRate = 5;
const powerupSpawnRate = 7;
const powerupDuration = 3;

const validKeys = [
  'w', 'a', 's', 'd'
];

const keys = {
  left: 'a',
  right: 'd',
  up: 'w',
  down: 's'
}

class Enemy
{
  constructor(x, y)
  {
    this.x = x;
    this.y = y;
    this.speed = enemySpeed;
    // Counts down to let you know turns remaining before movement
    this.turnCount = enemySpeed;
  }
}

class Powerup
{
  constructor(x, y)
  {
    this.x = x;
    this.y = y;
    this.duration = powerupDuration;
  }
}

let player = {
  x: 2,
  y: 2,
  superTurns: 0
}

let enemies = [];
let powerups = [];

let files =
{
  empty: "./img/empty.png",
  player: "./img/player.png",
  super: "./img/super.png",
  superFade: "./img/superFade.png",
  enemy: "./img/enemy.png",
  enemyReady: "./img/enemyReady.png",
  powerup: "./img/powerup.png"
}

const cellContents =
{
  empty: 'empty',
  player: 'player',
  enemy: 'enemy',
  powerup: 'powerup'
};

const validEnemyMoves = [
  cellContents.player,
  cellContents.empty,
  cellContents.powerup
]

function CheckCell(x, y)
{
  if (x == player.x && y == player.y)
  {
    return cellContents.player;
  }

  for (let enemy of enemies)
  {
    if (x == enemy.x && y == enemy.y)
    {
      return cellContents.enemy;
    }
  }

  for (let powerup of powerups)
  {
    if (x == powerup.x && y == powerup.y)
    {
      return cellContents.powerup;
    }
  }

  return cellContents.empty;
}

function SpawnEnemy()
{
  let attempts = 0;

  while (attempts < 100)
  {
    let x = Math.floor(Math.random() * board.width);
    let y = Math.floor(Math.random() * board.height);

    if (CheckCell(x, y) == cellContents.empty)
    {
      enemies.push(new Enemy(x, y));
      return;
    }

    ++attempts;
  }
}

function SpawnPowerup()
{
  let attempts = 0;

  while (attempts < 100)
  {
    let x = Math.floor(Math.random() * board.width);
    let y = Math.floor(Math.random() * board.height);

    if (CheckCell(x, y) == cellContents.empty)
    {
      powerups.push(new Powerup(x, y));
      return;
    }

    ++attempts;
  }
}

function Draw()
{
  // Clearing
  for (let row of tiles)
  {
    for (let tile of row)
    {
      tile.src = files.empty;
    }
  }

  // Player
  if (player.superTurns == 0)
  {
    tiles[player.y][player.x].src = files.player;
  }
  else if (player.superTurns == 1)
  {
    tiles[player.y][player.x].src = files.superFade;
  }
  else
  {
    tiles[player.y][player.x].src = files.super;
  }

  // Enemies
  for (let enemy of enemies)
  {
    if (enemy.turnCount == 1)
    {
      tiles[enemy.y][enemy.x].src = files.enemyReady;
    }
    else
    {
      tiles[enemy.y][enemy.x].src = files.enemy;
    }
  }

  // Powerups
  for (let powerup of powerups)
  {
    tiles[powerup.y][powerup.x].src = files.powerup;
  }

  // UI
  ui.score.innerText = turnCount;
}

function UpdateEnemies()
{
  for (let enemy of enemies)
  {
    enemy.turnCount -= 1;
    if (enemy.turnCount == 0)
    {
      enemy.turnCount = enemy.speed;
      // Try to move towards player
      let xDif = enemy.x - player.x;
      let yDif = enemy.y - player.y;

      // NOTE(JF): This means that when at a diagonal enemies will prefer to move vertically
      if (Math.abs(xDif) > Math.abs(yDif))
      {
        // Try to move left
        if (xDif > 0)
        {
          if (validEnemyMoves.includes(CheckCell(enemy.x - 1, enemy.y)))
          {
            enemy.x -= 1;
          }
        }
        // Try to move right
        else if (xDif < 0)
        {
          if (validEnemyMoves.includes(CheckCell(enemy.x + 1, enemy.y)))
          {
            enemy.x += 1;
          }
        }
      }
      else if (yDif != 0)
      {
          // Try to move up
          if (yDif > 0)
          {
            if (validEnemyMoves.includes(CheckCell(enemy.x, enemy.y - 1)))
            {
              enemy.y -= 1;
            }
          }
          // Try to move down
          else if (yDif < 0)
          {
            if (validEnemyMoves.includes(CheckCell(enemy.x, enemy.y + 1)))
            {
              enemy.y += 1;
            }
          }
      }
    }
  }
}

function CheckPlayerCollisions()
{
  // Check powerups first
  for (let p in powerups)
  {
    let powerup = powerups[p];
    if (powerup.x == player.x && powerup.y == player.y)
    {
      player.superTurns = powerup.duration;

      powerups.splice(p, 1);
    }
  }

  // Check enemies
  for (let e = 0; e < enemies.length; ++e)
  {
    let enemy = enemies[e];
    if (enemy.x == player.x && enemy.y == player.y)
    {
      if (player.superTurns > 0)
      {
        enemies.splice(e, 1);
        e--;
      }
      else {
        alert("dead. score " + turnCount);
        Reset();
        return;
      }
    }
  }
}

function CheckEnemyCollisions()
{
  for (let enemy of enemies)
  {
    // Check if enemy has stepped on a powerup
    for (let p in powerups)
    {
      if (powerups[p].x == enemy.x && powerups[p].y == enemy.y)
      {
        powerups.splice(p, 1);
        break;
      }
    }
  }
}

function Reset()
{
  player.x = 2;
  player.y = 2;
  enemies = [];
  powerups = [];
  turnCount = 0;
  superTurns = 0;
  Draw();
}

function OnKeyUp(e)
{
  if (!(validKeys.includes(e.key)))
  {
    return;
  }

  let validMove = false;

  // Move player
  switch (e.key)
  {
    case keys.left:
    {
      if (player.x > 0)
      {
        player.x -= 1;
        validMove= true;
      }
      break;
    }
    case keys.right:
    {
      if (player.x < board.width - 1)
      {
        player.x += 1;
        validMove= true;
      }
      break;
    }
    case keys.up:
    {
      if (player.y > 0)
      {
        player.y -= 1;
        validMove= true;
      }
      break;
    }
    case keys.down:
    {
      if (player.y < board.height - 1)
      {
        player.y += 1;
        validMove= true;
      }
      break;
    }
  }

  if (!validMove)
  {
    return;
  }

  // Incremenet turn counter
  turnCount++;

  if (player.superTurns > 0)
  {
    player.superTurns -= 1;
  }

  // Move enemies
  UpdateEnemies();

  // Check collisions
  CheckPlayerCollisions();
  CheckEnemyCollisions();

  // Check spawns
  if (!(turnCount % enemySpawnRate))
  {
    SpawnEnemy();
  }

  if (!(turnCount % powerupSpawnRate))
  {
    SpawnPowerup();
  }

  // Render
  Draw();
}

window.onload = () =>
{
  ui.grid = document.getElementById('grid');
  ui.score = document.getElementById('score');
  window.onkeyup = OnKeyUp;

  // Populate tiles
  for (let i = 0; i < board.width; ++i)
  {
    tiles.push([]);
    for (let j = 0; j < board.height; ++j)
    {
      tiles[i].push(new Image(tileSize, tileSize));

      tiles[i][j].src = files.empty;

      ui.grid.appendChild(tiles[i][j]);
    }
  }

  SpawnEnemy();
  SpawnPowerup();

  Draw();
}
