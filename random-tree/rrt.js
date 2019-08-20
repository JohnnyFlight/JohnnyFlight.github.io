const ARM_LENGTH = 50;

class RRTNode
{
  constructor(position = new Vector2(0, 0), angle = 0, range = Math.PI / 2, distance = ARM_LENGTH)
  {
    this.position = position;
    this.angle = angle;
    this.range = range;
    this.distance = distance;
  }

  static AngleVector(node)
  {
    return new Vector2(Math.cos(node.angle), Math.sin(node.angle));
  }

  static Render(ctx, node)
  {
    ctx.save();
    {
      ctx.beginPath();
      {
        // Node
        ctx.arc(node.position.x, node.position.y, 5, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.beginPath();

      // Direction
      ctx.beginPath();
      {
        ctx.moveTo(node.position.x, node.position.y);
        ctx.lineTo(node.position.x + node.distance * Math.cos(node.angle), node.position.y + node.distance * Math.sin(node.angle));
        ctx.stroke();
      }
      ctx.closePath();

      // Range
      ctx.beginPath();
      {
        ctx.moveTo(node.position.x, node.position.y);
        ctx.lineTo(node.position.x + node.distance * Math.cos(node.angle - node.range / 2), node.position.y + node.distance * Math.sin(node.angle - node.range / 2));

        ctx.moveTo(node.position.x, node.position.y);
        ctx.lineTo(node.position.x + node.distance * Math.cos(node.angle + node.range / 2), node.position.y + node.distance * Math.sin(node.angle + node.range / 2));
        ctx.stroke();
      }
      ctx.closePath();

      ctx.beginPath();
      {
        ctx.arc(node.position.x, node.position.y, node.distance, node.angle - node.range / 2, node.angle + node.range / 2);
        ctx.stroke();
      }
      ctx.closePath();
    }
    ctx.restore();
  }
}
