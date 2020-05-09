class Player
{
  constructor(position)
  {
    this.position = position;
    this.speed = 5; // units per second
    this.direction = new Vector2(0, 0); // direction to move in
  }

  Update(deltaTime)
  {
    this.direction = this.direction.normal();

    this.position = this.position.add(Vector2.Multiply(this.direction, this.speed));
  }
}
