

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
