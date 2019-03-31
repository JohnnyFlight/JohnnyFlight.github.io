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

  //  Draw lines
  for (var i = 0; i < params.steps; i++)
  {
    let lineTop = topEdge + height - (height / params.steps) * (i + 1);
    let lineRight = leftEdge + width - (width / params.steps) * (i);

    ctx.beginPath();
    var color = `hsl(${(360 / params.steps) * i}, 100%, 80%)`;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    //  Draw points
    ctx.beginPath();
    ctx.arc(lineRight, topEdge + height, 5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();

    //  Draw lines
    ctx.beginPath();
    ctx.moveTo(leftEdge, lineTop);
    ctx.lineTo(lineRight, topEdge + height);
    ctx.stroke();
    ctx.closePath();
  }

  //  Draw axis points
  for (var i = 0; i < params.steps; i++)
  {
    let lineTop = topEdge + height - (height / params.steps) * (i + 1);
    let lineRight = leftEdge + width - (width / params.steps) * (i);

    ctx.beginPath();
    var color = `hsl(${(360 / params.steps) * i}, 100%, 80%)`;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    //  Draw points
    ctx.arc(leftEdge, lineTop, 5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();

    //  Draw points
    ctx.beginPath();
    ctx.arc(lineRight, topEdge + height, 5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
  }

  //  Draw bezier points
  for (var i = 0; i < params.steps; i++)
  {
    let lineTop = topEdge + height - (height / params.steps) * (i + 1);
    let lineRight = leftEdge + width - (width / params.steps) * (i);

    var color = `hsl(${(360 / params.steps) * i}, 100%, 60%)`;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    //  Draw another point a percentage of the way along the line
    let factor = 1 - (1.0 / (params.steps + 1)) * (i + 1);

    ctx.beginPath();
    ctx.arc(leftEdge + (lineRight - leftEdge) * factor, topEdge + height - (topEdge + height - lineTop) * (1 - factor), 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }
}
