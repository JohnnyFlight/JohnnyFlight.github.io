window.onload = () => {
  document.getElementById('import_button').onclick = () => import_parameters();
  document.getElementById('export_button').onclick = () => export_parameters();

  //  Load from local storage
  if (localStorage.parameters)
  {
    loadParametersFromLocalStorage();
  }

  setInterval(() => {
    update();
  }, 1);
}

function import_parameters()
{
  //  Pull data from text area
  var data = document.getElementById('import_text').value;

  try {
    //  Parse data and try to put it into session
    JSON.parse(data);

    //  If there are errors, this won't get hit
    localStorage.parameters = data;
    loadParametersFromLocalStorage();
  } catch (e) {
    alert('Invalid import parameters');
  }
}

function export_parameters() {
  document.getElementById('import_text').value = localStorage.parameters;
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

function update() {
  //  Check inputs
  var parameters = getParameters();

  //  Store in local storage
  localStorage.parameters = JSON.stringify(parameters);

  draw(parameters);
}

function getParameters() {
  var parameters = {};
  parameters.arms = document.getElementById('arms').value;
  parameters.arm_speed = document.getElementById('arm_speed').value; // Rotations per second
  parameters.arm_length = document.getElementById('arm_length').value;
  parameters.rings_per_arm = document.getElementById('rings_per_arm').value;
  parameters.ring_radius = document.getElementById('ring_radius').value;
  parameters.ring_speed = document.getElementById('ring_speed').value;
  parameters.points_per_ring = document.getElementById('points_per_ring').value;
  parameters.point_radius = document.getElementById('point_radius').value;
  parameters.angular_offset = document.getElementById('angular_offset').value;

  return parameters;
}

function draw(parameters) {
  var canvas = document.getElementById('disco');
  var ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 500, 500);

  ctx.beginPath();
  ctx.strokeStyle = 'rgb(200, 0, 0)';
  ctx.fillStyle = 'rgb(200, 0, 0)';
  //ctx.arc(250, 250, 50, 0, Math.PI * 2, true);

  var timeSeconds = (new Date()).getTime() / 1000;

  //  For each arm
  for (var i = 0; i < parameters.arms; i++)
  {
    var angle = Math.PI * 2 * parameters.arm_speed * timeSeconds + Math.PI * 2 / parameters.arms * i;
    for (var j = 0; j < parameters.rings_per_arm; j++)
    {
      angle += parameters.angular_offset * j;

      for (var k = 0; k < parameters.points_per_ring; k++)
      {
        var ring_angle = Math.PI * 2 * parameters.ring_speed * timeSeconds + Math.PI * 2 / parameters.points_per_ring * k;
        var x = 250
          //  Position of arm
          + (j * parameters.arm_length * Math.sin(angle))
          //  Position of ring
          + (parameters.ring_radius * Math.sin(ring_angle));
        var y = 250
          + (j * parameters.arm_length * Math.cos(angle))
          + (parameters.ring_radius * Math.cos(ring_angle));
        ctx.moveTo(x, y);
        ctx.arc(x, y, parameters.point_radius, 0, Math.PI * 2, true);
      }
    }
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
