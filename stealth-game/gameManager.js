class GameManager
{
  constructor()
  {
    this.selectedLevel = -1;
    this.levelFuncs = [
      LoadLevel1
    ];

    this.level = null;
    this.camera = new Camera();

    this.Init();
  }

  Init()
  {
    this.LoadLevel(0);
  }

  LoadLevel(levelIdx)
  {
    this.selectedLevel = levelIdx;

    this.level = this.levelFuncs[levelIdx]();
  }

  HandleInput(inputManager)
  {
    let direction = new Vector2(0, 0);
    if (inputManager.keys['a'])
    {
      direction.x -= 1;
    }
    if (inputManager.keys['d'])
    {
      direction.x += 1;
    }
    if (inputManager.keys['w'])
    {
      direction.y -= 1;
    }
    if (inputManager.keys['s'])
    {
      direction.y += 1;
    }

    if (this.level)
    {
      this.level.player.direction = direction;
    }
  }

  Update(deltaTime, state)
  {
    if (this.level)
    {
      this.level.Update(deltaTime);
    }

    // Make the camera follow the player
    // Get distance between camera and player
    let diff = Vector2.Subtract(this.camera.position, this.level.player.position);
    let len = diff.length();
    len *= 0.1;
    this.camera.position = Vector2.Subtract(this.camera.position, Vector2.Multiply(diff.normal(), len * deltaTime));

    this.camera.position = this.level.player.position.mult(-1);
  }

  GetDrawList(state)
  {
    // Assumes draw list is empty
    if (!this.level)
    {
      return;
    }

    // Set Camera state
    state.camera = Object.assign({}, this.camera);

    // Draw player
    state.drawables.push(new Drawable(DrawCircle,
    {
      pos: this.level.player.position,
      rad: 5
    }));

    // Draw walls
    for (let wall of this.level.walls)
    {
      state.drawables.push(new Drawable(DrawLine, wall));
    }

    // Draw guards
    for (let guard of this.level.guards)
    {
      state.drawables.push(new Drawable(DrawGuard, guard));
    }
  }
}
