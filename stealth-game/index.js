let frameTime = 0;
let inputs = new InputManager();
let game = new GameManager();

window.onload = () => {
  let canvas = document.getElementById('canvas');
  let ctx = canvas.getContext('2d');

  frameTime = (new Date()).getTime();

  init();

  requestAnimationFrame(run);
}

function init()
{
  window.onkeydown = (e) => inputs.OnKeyDown(e);
  window.onkeypress = (e) => inputs.OnKeyPress(e);
  window.onkeyup = (e) => inputs.OnKeyUp(e);
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
    drawables: []
  };

  game.HandleInput(inputs);
  game.Update(deltaTime, state);
  game.GetDrawList(state);

  return state;
}

function draw(state)
{
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');


    if (state.camera)
    {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(state.camera.scale.x, state.camera.scale.y);
      ctx.translate(state.camera.position.x + canvas.width / 2, state.camera.position.y + canvas.height / 2);
    }

    for (let d of state.drawables)
    {
      d.Draw(ctx);
    }
}
