window.onload = () =>
{
  init();
  run();
}

initialParticleCount = 100;
wallRestitution = 0.5;

frameCountLimit = 60;
frameTimes = [];

class Particle
{
  // Repulsion is how strongly it resists being inside other particles
  constructor(position = new Vector2(0, 0), radius = 15, mass = 1, repulsion = 40000,
    velocity = new Vector2(0, 0), restitution = 0.05)
  {
    this.radius = radius;
    this.mass = mass;
    this.repulsion = repulsion;

    this.position = position;
    this.velocity = velocity;
    this.restitution = restitution;

    this.linearDamping = 1;

    this.instantaneousForce = new Vector2(0, 0);
  }

  UpdatePosition(deltaTime)
  {
    this.velocity = this.velocity.add(this.instantaneousForce.mult(deltaTime / this.mass));

    // Apply damping
    this.velocity = this.velocity.mult(1.0 / (1.0 + this.linearDamping * deltaTime));

    this.position = this.position.add(this.velocity.mult(deltaTime));

    this.instantaneousForce = new Vector2(0, 0);
  }

  IntersectsParticle(particle)
  {
    let diff = this.position.subtract(particle.position);

    return (diff.x * diff.x + diff.y * diff.y <
      (this.radius + particle.radius) * (this.radius + particle.radius));
  }

  IntersectParticleDepth(particle)
  {
    let diff = this.position.subtract(particle.position);

    return Math.sqrt((this.radius + particle.radius) * (this.radius + particle.radius)) -
    (Math.sqrt(diff.x * diff.x + diff.y * diff.y));
  }

  IntersectsLine(line)
  {
    let normalDist = Math.abs(line.distance(this.position));
    let perpDist = Math.abs(line.perpendicular().distance(this.position));

    return normalDist < this.radius && perpDist <= line.length() / 2;
  }

  IntersectLineDepth(line)
  {
    let dist = line.distance(this.position);
    //console.log(dist);

    return this.radius - Math.abs(dist);
  }

  IntersectLineDistance(line)
  {
    let dist = line.distance(this.position);
    return dist;
  }

  ResolveCollision(collision)
  {
    // Assume linear growth of repulsive impulse
    this.instantaneousForce = this.instantaneousForce.add(collision.dir.mult((collision.depth / this.radius) * this.repulsion * collision.restitution));

    if (collision.solid)
    {
      if (collision.distance < 0)
      {
        this.position = this.position.add(collision.dir.mult(Math.abs(collision.distance)));
      }
    }
  }

  AddForce(force)
  {
    this.instantaneousForce = this.instantaneousForce.add(force);
  }
}

class Collision
{
  constructor(idx, depth, dir, solid = false, distance, restitution = 1)
  {
    this.idx = idx;
    this.depth = depth;
    this.dir = dir;
    this.solid = solid;
    this.distance = distance;
    this.restitution = restitution;
  }
}

/*
  GLOBALS
*/

particles = [];
lines = [];
frameTime = 0;

function init()
{
  frameTime = (new Date()).getTime();

  document.getElementById('canvas').onclick = canvasClick;

  for (let i = 0; i < initialParticleCount; i++)
  {
    particles.push(new Particle(new Vector2(Math.random() * 600 + 100, Math.random() * 200 + 100)));
  }

  lines.push(new Line(new Vector2(0, 0), new Vector2(0, 400)));
  lines.push(new Line(new Vector2(0, 400), new Vector2(400, 600)));
  lines.push(new Line(new Vector2(0, 500), new Vector2(800, 500)));
  lines.push(new Line(new Vector2(400, 600), new Vector2(800, 400)));
  lines.push(new Line(new Vector2(800, 400), new Vector2(800, 000)));

  lines.push(new Line(new Vector2(700, 0), new Vector2(600, 100)));
  lines.push(new Line(new Vector2(600, 100), new Vector2(500, 0)));
  lines.push(new Line(new Vector2(500, 0), new Vector2(700, 0)));
  //lines.push(new Line(new Vector2(400, 400), new Vector2(800, 400)));
}

function canvasClick(e)
{
  let range = 50;

  if (e.ctrlKey)
  {
    particles = particles.filter((x) => (x.position.subtract(new Vector2(e.offsetX, e.offsetY)).length() > x.radius));
  }
  else if (e.shiftKey)
  {
    for (let i = 0; i < 10; i++)
    {
      particles.push(new Particle(new Vector2(e.offsetX - range + Math.random() * (2 * range), e.offsetY - range + Math.random() * (2 * range))));
    }
  }
  else
  {
    particles.push(new Particle(new Vector2(e.offsetX, e.offsetY)));
  }
}

function run()
{
  let deltaTime = ((new Date()).getTime() - frameTime) / 1000;
  let state = update(deltaTime);

  draw(state);

  frameTime = (new Date()).getTime();

  if (state.end) return;

  requestAnimationFrame(run);
}

function update(deltaTime)
{
  let state = {};

  // Move lines
  lines[5].start.y += 100 * deltaTime;
  lines[5].end.y += 100 * deltaTime;
  lines[6].start.y += 100 * deltaTime;
  lines[6].end.y += 100 * deltaTime;
  lines[7].start.y += 100 * deltaTime;
  lines[7].end.y += 100 * deltaTime;

  // Update particle position
  for (particle of particles)
  {
    // Gravity
    particle.AddForce(new Vector2(0, 500));

    particle.UpdatePosition(deltaTime);
  }

  // Removing particles that have clipped through the wall
  particles = particles.filter((x) => x.position.y < 600);

  // Collision detection
  let collisions = [];

  for (let i = 0; i < particles.length; i++)
  {
    // Inter-particle collisions
    for (let j = i + 1; j < particles.length; j++)
    {
      if (particles[i].IntersectsParticle(particles[j]))
      {
        let depth = particles[i].IntersectParticleDepth(particles[j]);
        let dir = particles[i].position.subtract(particles[j].position).normal();

        collisions.push(new Collision(i, depth, dir, false, 0, particles[j].restitution));
        collisions.push(new Collision(j, depth, dir.mult(-1), false, 0, particles[i].restitution));

        //console.log("Collision", i, j, depth, dir);
      }
    }

    // Particle-wall collisions
    for (line of lines)
    {
      if (particles[i].IntersectsLine(line))
      {
        let depth = particles[i].IntersectLineDepth(line);
        let dist = particles[i].IntersectLineDistance(line);
        let dir = line.normal();

        collisions.push(new Collision(i, depth, dir.mult(-1), true, dist, wallRestitution));
        //console.log("Wall bounce", i, depth, dir);
      }
    }
  }

  // Collision response
  for (collision of collisions)
  {
    particles[collision.idx].ResolveCollision(collision);
  }

  // Send to draw
  state.particles = particles;
  state.lines = lines;

  // Update framerate
  frameTimes.push(deltaTime);
  if (frameTimes.length > frameCountLimit)
  {
    frameTimes = frameTimes.filter((x, y) => y >= frameTimes.length - frameCountLimit);
  }

  let frameTime = 0;
  for (f of frameTimes)
  {
    frameTime += f;
  }

  frameTime /= frameTimes.length;

  // Update UI
  // TODO: Average FPS over a number of frames
  document.getElementById('particleCount').innerText = particles.length;
  document.getElementById('frameRate').innerText = (1.0 / frameTime).toFixed(2);

  return state;
}

function draw(data)
{
  var ctx = document.getElementById('canvas').getContext('2d');
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.strokeStyle = 'black';

  if (data.particles)
  {
    for (particle of data.particles)
    {
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.radius, 0, Math.PI * 2, true);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
    }
  }

  if (data.lines)
  {
    for (line of data.lines)
    {
      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
    }
  }
}





























;
