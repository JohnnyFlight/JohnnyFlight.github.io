let frameTime = 0;

let startNodes = [];
let goalNodes = [];
let walls = [];
let maxAttempts = 2000;
let maxResets = 50;
let resetCounter = 0;

// If a node is this close to another node then reject
let distanceLimit = 30;

let goalTime = Infinity;
let goalNodeCount = Infinity;
let velocity = 10;

let range = Math.PI / 1;
let distance = 100;

window.onload = () => {
  let canvas = document.getElementById('canvas');
  let ctx = canvas.getContext('2d');

  frameTime = (new Date()).getTime();

  init();

  requestAnimationFrame(run);
}

function init()
{
  startNodes.push(new RRTNode(new Vector2(100, 100), Math.PI / 4, range, distance));
  goalNodes.push(new RRTNode(new Vector2(700, 500), Math.PI / 4, range, distance));

  walls.push(new Line(new Vector2(0, 200), new Vector2(300, 200)));
  walls.push(new Line(new Vector2(800, 400), new Vector2(300, 400)));

  document.getElementById('tick').onclick = run;
  document.getElementById('reset').onclick = reset;
}

function run()
{
  let deltaTime = ((new Date()).getTime() - frameTime) / 1000;
  let state = update(deltaTime);

  draw(state);

  frameTime = (new Date()).getTime();

  if (startNodes.length > goalNodeCount * 2)
  {
    resetCounter++;
    if (resetCounter >= maxResets)
    {
      console.log('Failed to find path after', maxResets, 'resets');
      state.end = true;
    }
    else
    {
      reset();
    }
  }

  if (state.end)
  {
    //draw(state);
    return;
  }

  requestAnimationFrame(run);
}

function reset()
{
  startNodes = [startNodes[0]];
}

function update(deltaTime)
{
  let canvas = document.getElementById('canvas');

  let state = {
    stageWidth : canvas.width,
    stageHeight : canvas.height
  };

  state.walls = walls;

  // Generate a random point
  let inStart = false;
  let inGoal = false;

  let done = false;

  let sortedNodes = startNodes.slice().sort((x) => x.time);

  let attemptCounter = 0;
  while (!done)
  {
    let pos = new Vector2(Math.random() * state.stageWidth, Math.random() * state.stageHeight);

    if (IsNodeCloseToOtherNodes(pos))
    {
      attemptCounter++;
      if (attemptCounter >= maxAttempts)
      {
        console.log('Failed to find a new node after', maxAttempts, 'attempts');
        state.end = true;
        break;
      }
      continue;
    }

    // Is point in range of anything in start tree?
    for (let p of sortedNodes)
    {
      let dir = Vector2.Subtract(pos, p.position);
      if (Vector2.AngleBetween(RRTNode.AngleVector(p), dir) < p.range / 2) //  && Vector2.Length(dir) < p.distance)
      {
        // Check wall intersections
        if (DoesPathIntersectWalls(pos, p.position)) continue;

        let length = Vector2.Length(dir);
        if (p.time + length / velocity > goalTime) {
          //console.log('Point rejected for taking too long');
          continue;
        }

        if (length > p.distance)
        {
          p.distance = length;
        }

        let node = new RRTNode(pos, Vector2.Angle(dir), range, distance, p.time + length / velocity);

        startNodes.push(node);
        done = true;
        inStart = true;
        // Check if point can also see goal node
        dir = Vector2.Subtract(goalNodes[0].position, pos);
        if (Vector2.AngleBetween(RRTNode.AngleVector(node), dir) < node.range / 2)// && Vector2.Length(dir) < node.distance)
        {
          if (!DoesPathIntersectWalls(pos, goalNodes[0].position))
          {
            if (node.time + Vector2.Length(dir) / velocity <= goalTime)
            {
              node.distance = Vector2.Length(dir);
              goalNodes[0].time = node.time + node.distance / velocity;

              resetCounter = 0;
              inGoal = true;
              break;
            }
          }
        }
        break;
      }
    }
  }

  if (inGoal && inStart)
  {
    state.end = true;
    goalNodeCount = startNodes.length;
    goalTime = goalNodes[0].time;
    console.log('Graph complete with', startNodes.length, 'in start set and', goalNodes.length, 'nodes in goal set.');
    console.log('Path time is', goalTime, 'seconds');
  }

  state.startNodes = startNodes;
  state.goalNodes = goalNodes;

  return state;
}

function DoesPathIntersectWalls(from, to)
{
  for (let wall of walls)
  {
    if (wall.intersects(new Line(from, to)))
      return true;
  }

  return false;
}

function IsNodeCloseToOtherNodes(point)
{
  for (let i of startNodes)
  {
    if (Vector2.LengthSq(Vector2.Subtract(point, i.position)) < distanceLimit * distanceLimit)
      return true;
  }

  return false;
}

function draw(state)
{
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (node of state.startNodes)
    {
      ctx.save();
      {
        RRTNode.Render(ctx, node);
      }
      ctx.restore();
    }

    for (node of state.goalNodes)
    {
      ctx.save();
      {
        ctx.strokeStyle = 'green';
        RRTNode.Render(ctx, node);
      }
      ctx.restore();
    }

    for (let line of state.walls)
    {
      ctx.save();
      {
        ctx.strokeStyle = 'red';
        line.draw(ctx);
      }
      ctx.restore();
    }
}
