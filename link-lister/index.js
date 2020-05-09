window.onload = () =>
{
  // TODO: Add event listener
}

function MakeListLink()
{
  // Split sentence into array
  let words = document.getElementById('sentence').split(' ');

  // If there are too few words for the links then discard end links
  let links = document.getElementById('links').split(' ');

  while (words.length < links.length)
  {
    links.pop();
  }

  
}
