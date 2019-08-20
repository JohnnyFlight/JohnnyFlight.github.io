let frameTime = 0;

let startNodes = [];
let goalNodes = [];

let range = Math.PI / 6;
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

  document.getElementById('tick').onclick = run;
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
  let canvas = document.getElementById('canvas');

  let state = {
    stageWidth : canvas.width,
    stageHeight : canvas.height
  };

  // Generate a random point
  let inStart = false;
  let inGoal = false;

  let done = false;
  while (!done)
  {
    let pos = new Vector2(Math.random() * state.stageWidth, Math.random() * state.stageHeight);

    // Is point in range of anything in start tree?
    for (let p of startNodes)
    {
      let dir = Vector2.Subtract(pos, p.position);
      if (Vector2.AngleBetween(RRTNode.AngleVector(p), dir) < p.range / 2 && Vector2.Length(dir) < p.distance)
      {
        startNodes.push(new RRTNode(pos, Vector2.Angle(dir), range, distance));
        done = true;
        inStart = true;
        //console.log(startNodes[startNodes.length - 1], 'is in start set');
        break;
      }
    }

    // Is anything in goal tree in range of point?
    for (let p of goalNodes)
    {
      let dir = Vector2.Subtract(p.position, pos);
      // TODO: Line of Sight check

      // If in start set use existing node
      if (inStart)
      {
        let lastNode = startNodes[startNodes.length - 1];
        if (Vector2.AngleBetween(RRTNode.AngleVector(lastNode), dir) < lastNode.range / 2 && Vector2.Length(dir) < lastNode.distance)
        {
          goalNodes.push(lastNode);
          done = true;
          inGoal = true;
          //console.log(goalNodes[goalNodes.length - 1], 'is also in goal set');
          break;
        }
      }
      else
      {
        // Otherwise just use straight line check
        if (Vector2.Length(dir) < distance && Vector2.AngleBetween(Vector2.Subtract(p.position, pos), RRTNode.AngleVector(p)) < range / 2)
        {
          goalNodes.push(new RRTNode(pos, Vector2.Angle(dir), range, distance));
          done = true;
          inGoal = true;
          //console.log(goalNodes[goalNodes.length - 1], 'is in goal set');
          break;
        }
      }
    }
  }

  if (inGoal && inStart)
  {
    console.log('Graph complete with', startNodes.length, 'in start set and', goalNodes.length, 'nodes in goal set');
    state.end = true;
  }

  state.startNodes = startNodes;
  state.goalNodes = goalNodes;

  return state;
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
        RRTNode.Render(ctx, node);
      }
      ctx.restore();
    }
}
