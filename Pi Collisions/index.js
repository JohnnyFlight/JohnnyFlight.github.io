class CollisionObject {
  constructor(x, mass, velocity, width)
  {
    this.x = x;
    this.mass = mass;
    this.velocity = velocity;
    this.width = width;
  }

  move(time)
  {
    this.x += this.velocity * time;
  }
}

const CollisionTypes = {
  Wall : 0,
  Blocks: 1,
  None: 3
};

var smallObject = new CollisionObject(10, 1, 0, 10);
var largeObject = new CollisionObject(100, 100, -10, 100);
let collisionCount = 0;

window.onload = () =>
{
  document.getElementById('nextCollision').onclick = () => {
    var result = update();
    draw(getParameters());

    if (result != CollisionTypes.None)
    {
      
    }
  };

  let params = getParameters();
  draw(params);
}

function update()
{
  //  Check velocity directions to see what collision will be
  var collision = CollisionTypes.None;
  if (smallObject.velocity < 0)
  {
    collision = CollisionTypes.Wall;
  }
  else
  {
    if (smallObject.velocity > largeObject.velocity)
    {
      collision = CollisionTypes.Blocks;
    }
    //  Else type is None but we already default to that
  }

  switch (collision)
  {
    case CollisionTypes.Wall:
      console.log('Wall Collision');
      doWallCollision();
      collisionCount++;
      break;
    case CollisionTypes.Blocks:
      console.log('Block Collision');
      doBlockCollision();
      collisionCount++;
      break;
    default:
      console.log('No Collision');
  }

  console.log(collisionCount);

  return collision;
}

function doWallCollision()
{
  //  Calculate time taken for collision to occur to move other object
  let t = smallObject.x / smallObject.velocity;

  //  Perfectly elastic collision so just reverse the velocity and set to wall position
  smallObject.x = 0;
  smallObject.velocity *= -1;

  largeObject.move(t);
}

function doBlockCollision()
{
  //  Get time to collision
  let t = (largeObject.x - smallObject.x - smallObject.width) / (smallObject.velocity - largeObject.velocity);

  //  Update block positions
  smallObject.move(t);
  largeObject.move(t);

  //  Transfer monentum
  //  To make this a bit easier to type I'll declare some shorthand variables
  let m1 = smallObject.mass;
  let m2 = largeObject.mass;
  let v1 = smallObject.velocity;
  let v2 = largeObject.velocity;

  let newV1 = (m1 * v1 + m2 * v2 + m2 * (v2 - v1)) / (m1 + m2);
  let newV2 = (m1 * v1 + m2 * v2 + m1 * (v1 - v2)) / (m1 + m2);

  smallObject.velocity = newV1;
  largeObject.velocity = newV2;
}

function getParameters()
{
  let params = {};
  //  Yes, I know I've defined these objects in the global scope already
  params.smallObject = smallObject;
  params.largeObject = largeObject;

  return params;
}

function draw(params)
{
  console.log(params);

  let ctx = document.getElementById('canvas').getContext('2d');
  ctx.fillStyle = 'black';

  ctx.clearRect(0, 0, 800, 800, 'white');

  ctx.beginPath();
  ctx.rect(params.smallObject.x, 0, params.smallObject.width, params.smallObject.width);
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.rect(params.largeObject.x, 0, params.largeObject.width, params.largeObject.width);
  ctx.fill();
  ctx.closePath();
}
