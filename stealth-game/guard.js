class Guard
{
  constructor()
  {
    this.position = new Vector2();
    this.path = [];
    this.pathIdx = -1;
    this.speed = 20;
    this.direction = new Vector2();

    this.visionDistance = 100;
    this.visionRange = 30 / 180 * Math.PI;
  }

  SetPath(path)
  {

  }

  Update(deltaTime)
  {
    // Check proximity to path waypoint
    let waypoint = this.path[this.pathIdx];
    let dist = Vector2.Length(Vector2.Subtract(this.position, waypoint));

    // If close enough then switch to next waypoint
    if (dist < 5)
    {
      this.pathIdx++;
      if (this.pathIdx >= this.path.length)
      {
        this.pathIdx = 0;
      }
    }

    // Follow along path
    this.direction = waypoint.subtract(this.position).normal();
    this.position = this.position.add(this.direction.multiply(this.speed * deltaTime));
  }
}
