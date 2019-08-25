class Ship
{
  constructor(model)
  {
    this.model = model;
    this.physics = new PhysicsObject();
    this.physics.gravity = 0;
  }

  Update(deltaTime)
  {
    this.physics.update(deltaTime);
    this.model.position.x = this.physics.position.x;
    this.model.position.y = this.physics.position.y;
    this.model.rotation.z = this.physics.rotation;
  }
}
