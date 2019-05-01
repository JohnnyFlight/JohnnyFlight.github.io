let frameTime = 0;

let objects = [];

window.onload = () => {
  let canvas = document.getElementById('canvas');
  let ctx = canvas.getContext('2d');

  frameTime = (new Date()).getTime();

  init();

  requestAnimationFrame(run);
}

function init()
{
  let x = new PhysicsObject(50, 50, 10);
  x.position = new Vector2(100, 100);
  x.velocity = new Vector2(-100, -50);
  x.angularVelocity = 1;
  objects.push(x);
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
    stageWidth : 600,
    stageHeight : 300
  };

  for (o of objects)
  {
    o.update(deltaTime);

    let aabb = o.getAABB();

    // TODO: Proper collision handling
    if (o.position.y + aabb.height / 2 > state.stageHeight)
    {
      o.position.y = state.stageHeight - aabb.height / 2;
      o.velocity.y *= -1;
    }
    if (o.position.y - aabb.height / 2 < 0)
    {
      o.position.y = aabb.height / 2;
      o.velocity.y *= -1;
    }
    if (o.position.x + aabb.width / 2 > state.stageWidth)
    {
      o.position.x = state.stageWidth - aabb.width / 2;
      o.velocity.x *= -1;
    }
    if (o.position.x - aabb.width / 2 < 0)
    {
      o.position.x = aabb.height / 2;
      o.velocity.x *= -1;
    }
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
