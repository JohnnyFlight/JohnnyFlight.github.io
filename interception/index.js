let frameTime = 0;

let objects = [];
let initial = [];

window.onload = () => {
  let canvas = document.getElementById('canvas');
  let ctx = canvas.getContext('2d');

  frameTime = (new Date()).getTime();

  init();

  requestAnimationFrame(run);

  document.getElementById('exportButton').onclick = Export;
}

function Export()
{
  let elements = JSON.parse(JSON.stringify(initial));

  let scaleX = document.getElementById('scaleX').value;
  let scaleY = document.getElementById('scaleY').value;

  let time = 3600;

  for (let i = 0; i < elements.length; ++i)
  {
    elements[i].export = [
      {
        timeStamp: 0,
        position: [ elements[i].position.x, elements[i].position.y, 0 ],
        velocity: [ Math.cos(elements[i].rotation), Math.sin(elements[i].rotation), 0 ],
        rotation: [ 0, 0, elements[i].rotation ],
        angularVelocity: [ 0, 0, 0 ]
      },
      {
        timeStamp: time,
        position: [ elements[i].position.x + elements[i].velocity.x * time, elements[i].position.y + elements[i].velocity.y * time, 0 ],
        velocity: [ Math.cos(elements[i].rotation), Math.sin(elements[i].rotation), 0 ],
        rotation: [ 0, 0, elements[i].rotation ],
        angularVelocity: [ 0, 0, 0 ]
      }
    ];
  }

  document.getElementById('exportText').innerText = JSON.stringify(elements, null, '\n');
}

function init()
{
  let platformSpeed = 30;
  // Only care about x-axis
  let platformStartPos = 0;

  let x = new PhysicsObject(50, 20, 10);
  x.position = new Vector2(platformStartPos, 300);
  x.velocity = new Vector2(platformSpeed, 0);
  x.gravity = 0;

  objects.push(x);

  // For some number of boats
  let numBoats = 10;
  for (let i = 0; i < numBoats; ++i)
  {
    //console.log('Boat ' + i);
    // Pick a random point on the line
    //let len = 200 + Math.random() * 500;
    let len = 200 + ((500 / numBoats) * i);
    //console.log('len', len);

    // Pick a random angle
    let angle = Math.PI / 4 + (Math.PI / 2) * Math.random();
    angle += Math.floor(Math.random() * 2) * -1 * Math.PI;
    //console.log('angle', angle);

    // Pick a random speed
    let speed = 5 + Math.random() * 5;
    //console.log('speed', speed);

    // Calculate where a ship needs to be to intercept at that point
    let time = (len - platformStartPos) / platformSpeed;
    //console.log('time', time);

    let distance = time * speed;
    //console.log('distance', distance);

    let position = new Vector2(len - distance * Math.cos(angle), 300 - distance * Math.sin(angle));

    // Add some noise
    angle += (5 + Math.random() * 10) * Math.PI / 180;

    let y = new PhysicsObject(50, 20, 10);
    y.rotation = angle;
    y.position = position;
    y.gravity = 0;
    y.velocity = new Vector2(speed * Math.cos(angle), speed * Math.sin(angle));

    objects.push(y);
  }

  initial = JSON.parse(JSON.stringify(objects.filter((x, y) => y != 0)));
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
  let state = {
    stageWidth : 800,
    stageHeight : 600
  };

  for (o of objects)
  {
    o.update(deltaTime);
  }

  state.objects = objects;

  return state;
}

function draw(state)
{
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (o of state.objects)
    {
      ctx.save();
      ctx.beginPath();
      ctx.translate(o.position.x, o.position.y);
      ctx.rotate(o.rotation);
      ctx.moveTo(-o.width / 2, -o.height / 2);
      ctx.lineTo( o.width / 2, -o.height / 2);
      ctx.lineTo( o.width / 2,  o.height / 2);
      ctx.lineTo(-o.width / 2,  o.height / 2);
      ctx.lineTo(-o.width / 2, -o.height / 2);
      ctx.stroke();
      ctx.closePath();

      ctx.rotate(-o.rotation);
      let aabb = o.getAABB();
      ctx.beginPath();
      ctx.moveTo(-aabb.getWidth() / 2, -aabb.getHeight() / 2);
      ctx.lineTo( aabb.getWidth() / 2, -aabb.getHeight() / 2);
      ctx.lineTo( aabb.getWidth() / 2,  aabb.getHeight() / 2);
      ctx.lineTo(-aabb.getWidth() / 2,  aabb.getHeight() / 2);
      ctx.lineTo(-aabb.getWidth() / 2, -aabb.getHeight() / 2);
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    }
}
