//====================
// Vector2
//====================

class Vector2
{
  constructor(x = 0, y = 0)
  {
    if (typeof x == 'object')
    {
      this.x = x.x;
      this.y = x.y;
    }
    else
    {
      this.x = x;
      this.y = y;
    }
  };

  add(v)
  {
    let n = new Vector2(this);
    n.x += v.x;
    n.y += v.y;
    return n;
  }

  // TODO: Write these as separate functions for improved performance
  subtract(v)
  {
    return this.add(v.mult(-1));
  }

  multiply(x)
  {
    return this.mult(x);
  }

  mult(x)
  {
    let n = new Vector2(this);
    n.x *= x;
    n.y *= x;
    return n;
  }

  divide(x)
  {
    return this.mult(1 / x);
  }

  length()
  {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normal()
  {
    let n = new Vector2(this);
    let length = n.length();
    n.x /= length;
    n.y /= length;
    return n;
  }

  // angle in radians
  rotate(angle)
  {
    let n = new Vector2(this);
    n.x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
    n.y = this.x * Math.sin(angle) + this.y * Math.cos(angle);
    return n;
  }

  static cross(u, v)
  {
    return u.x*v.y-u.y*v.x;
  }
}

class AABB
{
  constructor(min, max)
  {
    this.min = min;
    this.max = max;
  }

  draw(ctx)
  {
    ctx.beginPath();

    ctx.lineTo(min.x, min.y);
    ctx.lineTo(max.x, min.y);
    ctx.lineTo(max.x, max.y);
    ctx.lineTo(min.x, max.y);

    ctx.closePath();
    ctx.stroke();
  }
}

//====================
// Line
//====================

class Line
{
  constructor(start = new Vector2(0, 0), end = new Vector2(0, 0))
  {
    this.start = start;
    this.end = end;
  }

  normal()
  {
    let dir = this.end.subtract(this.start);
    return (new Vector2(-dir.y, dir.x)).normal();
  }

  distance(point)
  {
    return ((this.end.y - this.start.y) * point.x -
      (this.end.x - this.start.x) * point.y +
      (this.end.x * this.start.y - this.end.y * this.start.x))
      / this.end.subtract(this.start).length();
  }

  midpoint()
  {
    return this.start.add((this.end.subtract(this.start)).divide(2));
  }

  length()
  {
    return (this.end.subtract(this.start)).length();
  }

  // Returns a perpendicular bisector of the same length
  perpendicular()
  {
    let midPoint = (this.end.add(this.start).mult(0.5));
    let length = this.length();
    let normal = this.normal();

    return new Line(midPoint.subtract(normal.mult(length)), midPoint.add(normal.mult(length)));
  }

  intersects(line)
  {
    let x1 = this.start.x;
    let y1 = this.start.y;

    let x2 = this.end.x;
    let y2 = this.end.y;

    let x3 = line.start.x;
    let y3 = line.start.y;

    let x4 = line.end.x;
    let y4 = line.end.y;

    let denominator = ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    // No intersection because lines are parallel
    if (denominator == 0) return null;

    let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

    // Lines intersect but not within segments
    if (t < 0 || t > 1) return null;
    if (u < 0 || u > 1) return null;

    let px = x1 + t * (x2 - x1);
    let py = y1 + t * (y2 - y1);

    return new Vector2(px, py);
  }

  draw(ctx)
  {
    ctx.save();
    ctx.beginPath();

    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);

    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

class Polygon
{
  constructor(position = new Vector2(0, 0), points = [])
  {
    this.position = position;
    this.points = points;
    this.rotation = 0;
  }

  draw(ctx)
  {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.beginPath();

    for (let point of this.points)
    {
        ctx.lineTo(point.x, point.y);
    }

    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  getGlobalPoints()
  {
    let points = [];
    for (let i = 0; i < this.points.length; i++)
    {
      points.push(this.points[i].rotate(this.rotation).add(this.position));
    }
    return points;
  }

  getAABB()
  {
    // Get rotated points
    let rotatedPoints = [];
    for (let point of this.points)
    {
      rotatedPoints = point.rotate(this.rotation);
    }

    // Get min and max of rotated points
    let min = new Vector2(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    let max = new Vector2(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

    for (let point of rotatedPoints)
    {
      if (point.x < min.x) min.x = point.x;
      if (point.y < min.y) min.y = point.y;
      if (point.x > max.x) max.x = point.x;
      if (point.y > max.y) max.y = point.y;
    }

    // Add position
    min = min.Add(this.position);
    max = max.Add(this.position);

    return new AABB(min, max);
  }

  getCentroid()
  {
    // Sum y- and y- positions
    let sum = new Vector2();
    for (let point of this.points)
    {
      sum.x += point.x;
      sum.y += point.y;
    }

    // Divide by number of points
    return sum.divide(this.points.length);
  }
}

class Chain
{
  constructor(points = [])
  {
    this.points = points;
  }

  draw(ctx)
  {
    ctx.save();
    ctx.beginPath();

    for (let point of this.points)
    {
        ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();
    ctx.restore();
  }
}
