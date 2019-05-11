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

  mult(x)
  {
    let n = new Vector2(this);
    n.x *= x;
    n.y *= x;
    return n;
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
}
