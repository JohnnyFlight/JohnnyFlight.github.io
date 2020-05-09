// A level is the initial state of the level
// It gets copied into the manager and updated from their
class Level
{
  constructor()
  {
    this.player = new Player(new Vector2(0, 0));
    this.walls = [];
    this.guards = [];
    this.paths = [];
  }

  Update(deltaTime)
  {
    this.player.Update(deltaTime);
    for (let guard of this.guards)
    {
      guard.Update(deltaTime);
    }

    this.CollisionDetection();
  }

  CollisionDetection()
  {

  }
}

function LoadLevel1()
{
  // Create a level object
  let level = new Level();

  // Create player
  level.player = new Player(new Vector2(0, 0));

  // Create Walls
  level.walls.push(new Line(new Vector2(0, 0), new Vector2(100, 100)));

  // Create paths

  // Create guards
  level.guards.push(Object.assign(new Guard(), {
    position: new Vector2(200, 200),
    pathIdx: 0,
    path: [
      new Vector2(200, 200),
      new Vector2(300, 300)
    ]
  }));

  return level;
}
