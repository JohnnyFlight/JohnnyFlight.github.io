class Person
{
  constructor(name)
  {
    this.name = name;
    this.preferences = [];
  }
}

let people = [];

window.onload = () =>
{
  let canvas = document.getElementById('canvas');
  let ctx = canvas.getContext('2d');

  people.push(new Person('John'));
  people.push(new Person('Jenny'));
  people.push(new Person('Valerie'));
  people.push(new Person('Lilian'));
  people.push(new Person('Kat'));
  people.push(new Person('Emma'));

  GeneratePreferences(people);
}

function GeneratePreferences(people)
{
  // Create a list of array indexes
  let indices = [];

  for (let person of people)
  {
    indices.push(indices.length);
  }

  for (let index of indices)
  {
    people[index].preferences = (Shuffle(indices)).filter((x) => x != index);
  }
}

// Returns a copy of the array
function Shuffle(array)
{
  let output = JSON.parse(JSON.stringify(array));

  for (let i = 0; i < 100; ++i)
  {
    let idx1 = Math.floor(Math.random() * array.length);
    let idx2 = Math.floor(Math.random() * array.length);

    if (idx1 == idx2) continue;

    let temp = output[idx1];
    output[idx1] = output[idx2];
    output[idx2] = temp;
  }

  return output;
}
