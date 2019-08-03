let frameTime = 0;

let objects = [];
let spawnCounter = 0;
let spawnTime = 1;
let arms = 5;
let particleRadiusVelocity = 5;
let particleAngleVelocity = 5;
let despawnRadius;

class PolarParticle
{
  // Angles in degrees to make my life easier
  constructor(radius = 0, angle = 0, radiusVelocity = 0, angleVelocity = 0)
  {
    this.radius = radius;
    this.angle = angle;

    this.radiusVelocity = radiusVelocity;
    this.angleVelocity = angleVelocity;
  }

  static Update(particle, deltaTime)
  {
    particle.radius += particle.radiusVelocity * deltaTime;
    particle.angle += particle.angleVelocity * deltaTime;
  }

  static PolarToCartesian(particle)
  {
    return {
      x: Math.sin(particle.angle * Math.PI / 180) * particle.radius,
      y: Math.cos(particle.angle * Math.PI / 180) * particle.radius
    }
  }
}

window.onload = () => {
  let canvas = document.getElementById('canvas');
  let ctx = canvas.getContext('2d');

  frameTime = (new Date()).getTime();

  despawnRadius = Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2));

  init();

  requestAnimationFrame(run);
}

function SpawnLayer(radiusOffset = 0, angleOffset = 0)
{
  for (let j = 0; j < arms; ++j)
  {
    objects.push(new PolarParticle(radiusOffset, angleOffset + j * (360 / arms), particleRadiusVelocity, particleAngleVelocity));
  }
}

function init()
{
  for (let i = 0; i < 100; ++i)
  {
    for (let j = 0; j < arms; ++j)
    {
      SpawnLayer(i * particleRadiusVelocity, i * particleAngleVelocity);
    }
  }

  // Event Listeners
  document.getElementById('arms').onchange = (x) => arms = x.srcElement.value;
  document.getElementById('radiusVelocity').onchange = (x) => particleRadiusVelocity = x.srcElement.value;
  document.getElementById('angleVelocity').onchange = (x) => particleAngleVelocity = x.srcElement.value;
  document.getElementById('spawnTime').onchange = (x) => spawnTime = x.srcElement.value;
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

  spawnCounter += deltaTime;
  if (spawnCounter >= spawnTime)
  {
    spawnCounter -= spawnTime;
    SpawnLayer();
  }

  objects = objects.filter((x) => x.radius < despawnRadius);

  for (o of objects)
  {
    PolarParticle.Update(o, deltaTime);
  }

  state.objects = objects;

  return state;
}

function draw(state)
{
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    for (o of state.objects)
    {
      let pos = PolarParticle.PolarToCartesian(o);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }
    ctx.restore();
}
