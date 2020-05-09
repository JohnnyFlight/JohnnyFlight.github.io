class Drawable
{
  constructor(func, param)
  {
    this.func = func;
    this.param = param;
  }

  Draw(context)
  {
    this.func(context, this.param);
  }
}

function DrawCircle(ctx, param)
{
  ctx.beginPath();
  {
    ctx.arc(param.pos.x, param.pos.y, param.rad, 0, 2 * Math.PI);
  }
  ctx.stroke();
}

function DrawLine(ctx, param)
{
  ctx.beginPath();
  {
    ctx.moveTo(param.start.x, param.start.y);
    ctx.lineTo(param.end.x, param.end.y);
  }
  ctx.stroke();
}


function DrawGuard(ctx, param)
{
  // Draw body
  DrawCircle(ctx, {
    pos: param.position,
    rad: 5
  });

  let visionCentre = param.direction.multiply(param.visionDistance);

  // Draw vision range
  DrawLine(ctx, {
    start: param.position,
    end: visionCentre.rotate(param.visionRange).add(param.position)
  });
  DrawLine(ctx, {
    start: param.position,
    end: visionCentre.rotate(-param.visionRange).add(param.position)
  });
}
