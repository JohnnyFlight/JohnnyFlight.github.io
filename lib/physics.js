class PhysicsObject
{
  constructor(w, h, m)
  {
    this.width = w;
    this.height = h;
    this.mass = m;

    this.position = new Vector2(0, 0);
    this.velocity = new Vector2(0, 0);
    this.acceleration = new Vector2(0, 0);

    this.rotation = 0; // Radians
    this.angularVelocity = 0; // Radians / s
    this.angularAcceleration = 0; // Radians / s / s
  };

  update(deltaTime) {
    this.velocity = this.velocity.add(this.acceleration.mult(deltaTime));
    this.position = this.position.add(this.velocity.mult(deltaTime));

    this.angularVelocity += this.angularAcceleration * deltaTime;
    this.rotation += this.angularVelocity * deltaTime;
  }

  getAABB()
  {
    let sine = Math.sin(this.rotation);
    let cosine = Math.cos(this.rotation);

    let topLeft = {
        x : (-this.width / 2) * cosine - (-this.height / 2) * sine,
        y : (-this.height / 2) * sine + (-this.height / 2) * cosine
      };
    let topRight = {
        x : (-this.width / 2) * cosine - (this.height / 2) * sine,
        y : (-this.height / 2) * sine + (this.height / 2) * cosine
      };
    let bottomLeft = {
        x : (this.width / 2) * cosine - (-this.height / 2) * sine,
        y : (this.height / 2) * sine + (-this.height / 2) * cosine
      };
    let bottomRight = {
        x : (this.width / 2) * cosine - (this.height / 2) * sine,
        y : (this.height / 2) * sine + (this.height / 2) * cosine
      };

    return new AxisAlignedBoundingBox(
      new Vector2(
        Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x),
        Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)),
      new Vector2(
        Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x),
        Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)));
  }
}

class AxisAlignedBoundingBox
{
  constructor(topLeft, bottomRight)
  {
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;

    this.height = this.bottomRight.y - this.topLeft.y;
    this.width = this.bottomRight.x - this.topLeft.x;
  }

  getHeight()
  {
    return this.bottomRight.y - this.topLeft.y;
  }

  getWidth()
  {
    return this.bottomRight.x - this.topLeft.x;
  }
}
