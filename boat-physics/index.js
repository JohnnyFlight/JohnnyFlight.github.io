window.onload = () =>
{
  init();

  requestAnimationFrame(run);

  document.getElementById('canvas').onclick = (e) => {
    if (e.ctrlKey) {
      globalState.boat.physics.position = new Vector2(e.offsetX, e.offsetY)
    }
    else {
      console.log(e.offsetX, e.offsetY);
    }
  };
}

class Boat
{
  constructor(physics, polygon)
  {
    this.physics = physics;
    this.polygon = polygon;
  }

  init()
  {
    // Adjust polygon to be centroid
    let centre = this.polygon.getCentroid();

    for (let point in this.polygon.points)
    {
      this.polygon.points[point] = this.polygon.points[point].subtract(centre);
    }
  }

  update(deltaTime)
  {
    this.physics.update(deltaTime);

    this.polygon.position = this.physics.position;
    this.polygon.rotation = this.physics.rotation;
  }

  draw(ctx)
  {
    this.polygon.draw(ctx);
  }
}

let frameTime;
let globalState = {};

function init()
{
  frameTime = getTicks();

  let width = 200;
  let height = 100;

  let top = points(new Vector2(-width, -height), new Vector2(width, -height), 50);
  let right = points(new Vector2(width, -height), new Vector2(width/ 2, 0), 50);
  let bottom = points(new Vector2(width/ 2, 0), new Vector2(-width / 2, 0), 50);
  let left = points(new Vector2(-width / 2, 0), new Vector2(-width, -height), 50);

  globalState.boat = new Boat(
    new PhysicsObject(),
    new Polygon(new Vector2(),
      [top, right, bottom, left].flatMap((x) => x)));

  globalState.boat.physics.position = new Vector2(400, 250);
  globalState.boat.physics.rotation = 0.1;
  globalState.boat.physics.mass = 11000000;
  globalState.boat.physics.gravity = 98.1;
  globalState.boat.physics.inertia = 2000000000000;

  globalState.boat.init();

  globalState.waterLine = new Chain([new Vector2(0, 300),
    new Vector2(800, 300)]);
}

function points(start, end, count)
{
  let result = [];
  let step = (end.subtract(start)).divide(count);

  for (let i = 0; i < count; i++)
  {
    result.push(start.add(step.multiply(i)));
  }
  return result;
}

function run()
{
  let ticks = getTicks();
  let deltaTime = (ticks - frameTime) / 1000;
  frameTime = ticks;

  let state = update(deltaTime);

  draw(state);

  requestAnimationFrame(run);
}

function update(deltaTime)
{
  let state = globalState;

  state.boat.update(deltaTime);
  state.intersectionPoints = intersection(state.boat.polygon, state.waterLine);
  state.submergedLines = getSubmergedLines(state.boat.polygon, state.waterLine);
  state.forces = [];

  // F = -rho * g * hCentre * n
  let rho = 1025; // Density of seawater, Kg / m^3
  let g = state.boat.physics.gravity; // Acceleration due to gravity, m / s^2
  let waterLine = new Line(state.waterLine.points[0], state.waterLine.points[1]);

  // Apply hydrostatic forces based on submerged lines
  for (let sub of state.submergedLines)
  {
    let n = sub.normal();

    let z0 = Math.min(sub.start.y, sub.end.y);
    let h = Math.max(sub.start.y, sub.end.y) - z0;

    let tc = (4 * z0 + 3 * h) / (6 * z0 + 4 * h);

    let mid = sub.intersects(new Line(new Vector2(Math.min(sub.start.x, sub.end.x), z0 + h * tc), new Vector2(Math.max(sub.start.x, sub.end.x), z0 + h * tc)));
    if (!mid)
    {
      mid = sub.midpoint();
    }
    let hCentre = Math.abs(waterLine.distance(mid));

    let f = rho * g * hCentre * sub.length();
    let force = n.multiply(f);
    force.x = 0;
    state.boat.physics.applyForce(mid, force);
    state.forces.push(new Line(mid, mid.add(n.multiply(f / 100000))));
  }

  return state;
}

function intersection(boatPolygon, waterLine)
{
  // Turn polygon and waterLine into arrays of Lines
  let lines = [];
  let boatPoints = boatPolygon.getGlobalPoints();

  for (let i = 1; i < boatPoints.length; i++)
  {
    lines.push(new Line(boatPoints[i - 1], boatPoints[i]));
  }
  lines.push(new Line(boatPoints[boatPoints.length - 1], boatPoints[0]));

  let waterLines = [];
  for (let i = 1; i < waterLine.points.length; i++)
  {
    waterLines.push(new Line(waterLine.points[i - 1], waterLine.points[i]));
  }

  intersectionPoints = [];

  //  Check intersection between all lines and waterLine
  for (let line of lines)
  {
    for (let water of waterLines)
    {
      let p = line.intersects(water);
      if (p)
      {
        intersectionPoints.push(p);
      }
    }
  }

  return intersectionPoints;
}

function displacementArea(boatPolygon, waterLine)
{
  // Turn polygon and waterLine into arrays of Lines
  let lines = [];
  let boatPoints = boatPolygon.getGlobalPoints();

  for (let i = 1; i < boatPoints.length; i++)
  {
    lines.push(new Line(boatPoints[i - 1], boatPoints[i]));
  }
  lines.push(new Line(boatPoints[boatPoints.length - 1], boatPoints[0]));

  let waterLines = [];
  for (let i = 1; i < waterLine.points.length; i++)
  {
    waterLines.push(new Line(waterLine.points[i - 1], waterLine.points[i]));
  }

  intersectionPoints = [];
  interim = [];

  //  Check intersection between all lines and waterLine
  for (let i = 0; i < lines.length; i++)
  {
    for (let water of waterLines)
    {
      let p = lines[i].intersects(water);
      if (p)
      {
        interim.push({ point: p, index: i });
      }
    }
  }

  // Assume there will always be an even number of interims
  for (let i = 0; i < interim.length; i+=2)
  {
    intersectionPoints.push(interim[i].point);

    // Get all points between intersection points
    for (let j = interim[i].index; j < interim[i + 1].index; j++)
    {
      intersectionPoints.push(lines[j].end);
    }

    intersectionPoints.push(interim[i + 1].point);
  }

  return intersectionPoints;
}

function getSubmergedLines(boatPolygon, waterLine)
{
  // Turn polygon and waterLine into arrays of Lines
  let lines = [];
  let boatPoints = boatPolygon.getGlobalPoints();

  for (let i = 1; i < boatPoints.length; i++)
  {
    lines.push(new Line(boatPoints[i - 1], boatPoints[i]));
  }
  lines.push(new Line(boatPoints[boatPoints.length - 1], boatPoints[0]));

  let waterLines = [];
  for (let i = 1; i < waterLine.points.length; i++)
  {
    waterLines.push(new Line(waterLine.points[i - 1], waterLine.points[i]));
  }

  submergedLines = [];

  //  Check intersection between all lines and waterLine
  for (let line of lines)
  {
    for (let water of waterLines)
    {
      //  Check if one point is above and another below the line and within range
      let p = line.intersects(water);
      if (p)
      {
        // Check if start point is above the line
        if (water.distance(line.start) < 0)
        {
          // Line is between intersect and end
          submergedLines.push(new Line(line.start, p));
        }
        else
        {
          // Line is between start and intersect
          submergedLines.push(new Line(p, line.end));
        }
      }
      else
      {
        if (line.start.x >= water.start.x && line.start.x < water.end.x)
        {
          if (water.distance(line.start) < 0)
          {
            // Line is beneath water
            submergedLines.push(line);
          }
        }
      }
    }
  }

  return submergedLines;
}

function draw(state)
{
  let can = document.getElementById('canvas');
  let ctx = can.getContext('2d');

  ctx.clearRect(0, 0, can.width, can.height);

  ctx.save();
  state.boat.draw(ctx);
  ctx.restore();

  state.waterLine.draw(ctx);

  ctx.save();
  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 5;
  // Draw submerged lines here
  for (let line of state.submergedLines)
  {
    line.draw(ctx);
  }
  ctx.restore();

  for (let intersect of state.intersectionPoints)
  {
    ctx.save();
    ctx.beginPath();

    ctx.arc(intersect.x, intersect.y, 5, 0, 2 * Math.PI);

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  for (let f of state.forces)
  {
    f.draw(ctx);
  }
}
