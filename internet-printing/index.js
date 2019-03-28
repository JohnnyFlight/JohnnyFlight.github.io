window.onload = () => {
  document.getElementById('send_button').onclick = button_click;
}

function button_click()
{
  var message = document.getElementById('message_text').value;

  if (message == '')
  {
    document.getElementById('response').value = 'You need to type something in the box, muppet.';
    return;
  }

  message = `"${message}"`;

  fetch('http://localhost/api/values', {
  	method: 'POST',
  	headers: {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
  	body: message
  }).then((x) => {
    document.getElementById('response').innerText = x.text().then((x) => document.getElementById('response').innerText = x);
  });

  document.getElementById('message_text').value = '';
}
