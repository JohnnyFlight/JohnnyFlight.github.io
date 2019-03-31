const height = 700;
const width = 700;

const topEdge = 50;
const leftEdge = 50;

window.onload = () =>
{
  //  Setup event listeners
  document.getElementById('steps').onchange = updateView;
  document.getElementById('minus10').onclick = () => changeSteps(-10);
  document.getElementById('minus1').onclick = () => changeSteps(-1);
  document.getElementById('plus1').onclick = () => changeSteps(1);
  document.getElementById('plus10').onclick = () => changeSteps(10);

  loadParametersFromLocalStorage();

  updateView();
}

function changeSteps(value)
{
  var elem = document.getElementById('steps');
  var steps = parseInt(elem.value);
  steps += value;

  if (steps < elem.min) steps = elem.min;
  if (steps > elem.max) steps = elem.max;

  elem.value = steps;
  elem.onchange();
}

function loadParametersFromLocalStorage()
{
  var parameters = JSON.parse(localStorage.parameters);

  for (var param of Object.keys(parameters))
  {
    var elem = document.getElementById(param);
    if (elem)
    {
      elem.value = parameters[param];
    }
  }
}

function updateView()
{
  draw(getParameters());
}

function getParameters()
{
  var params = {};

  params.steps = parseInt(document.getElementById('steps').value);

  localStorage.parameters = JSON.stringify(params);

  return params;
}

function draw(params)
{
  var ctx = document.getElementById('canvas').getContext('2d');
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  //  Draw axes
  ctx.beginPath();

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;

  ctx.moveTo(topEdge, leftEdge);
  ctx.lineTo(leftEdge, topEdge + height);
  ctx.lineTo(leftEdge + width, topEdge + height);
  ctx.stroke();

  ctx.closePath();


  for (var i = 0; i < params.steps; i++)
  {
    ctx.beginPath();
    var color = `hsl(${(360 / params.steps) * i}, 100%, 80%)`;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    //  Draw points
    ctx.arc(leftEdge, topEdge + height - (height / params.steps) * (i + 1), 5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();

    ctx.closePath();

    ctx.beginPath();
    //  Draw points
    ctx.arc(leftEdge + width - (width / params.steps) * (i), topEdge + height, 5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();

    ctx.closePath();

    //  Draw lines
    ctx.beginPath();

    ctx.moveTo(leftEdge, topEdge + height - (height / params.steps) * (i + 1));
    ctx.lineTo(leftEdge + width - (width / params.steps) * (i), topEdge + height);
    ctx.stroke();

    ctx.closePath();
  }

}
