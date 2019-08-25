class Ship
{
  constructor(model)
  {
    this.model = model;
    this.physics = new PhysicsObject();
    this.physics.gravity = 0;

    this.physics.angularVelocity = 0.1;
  }

  Update(deltaTime)
  {
    this.physics.update(deltaTime);
    this.model.position.x = this.physics.position.x;
    this.model.position.y = this.physics.position.y;
    this.model.rotation.z = this.physics.rotation;
  }
}
