class Vector2
{
  constructor(x, y)
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
}
