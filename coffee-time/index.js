window.onload = () => {
  CheckLent();
  setInterval(CheckLent, 500);
}

function CheckLent()
{
  var d = new Date();

  if (IsDateInLent(d))
  {
    //  TODO: Put time left in here
    document.getElementById('answer').innerText = 'No! Not for ' + GetTimeToEndOfLentString(d);
  }
  else
  {
    document.getElementById('answer').innerText = 'Yes!';
  }
}

function GetTimeToEndOfLentString(d) {
  var timeLeftSeconds = Math.floor((new Date('2019-04-19') - d) / 1000);

  console.log(timeLeftSeconds);

  var outputSeconds = timeLeftSeconds % 60;
  timeLeftSeconds -= outputSeconds;

  var timeLeftMinutes = timeLeftSeconds / 60;
  var outputMinutes = timeLeftMinutes % 60;
  timeLeftMinutes -= outputMinutes;

  var timeLeftHours = timeLeftMinutes / 60;
  var outputHours = timeLeftHours % 24;
  timeLeftHours -= outputHours;

  var outputDays = timeLeftHours / 24;

  return outputDays + ' days '
    + outputHours + ' hours '
    + outputMinutes + ' minutes '
    + outputSeconds + ' seconds';
}

//  Fudge it just for 2019 for now because the rules are more complex than I thought
function IsDateInLent(d) {
  return (d >= (new Date('2019-03-06'))) && (d < (new Date('2019-04-17')));
}
