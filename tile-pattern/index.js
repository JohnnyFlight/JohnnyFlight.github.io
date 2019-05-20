tiles = [];

let colour1 = 'ghostwhite';
let colour2 = 'darkblue';

window.onload = () =>
{
  let buffer = 1;
  let rad = 30;

  let state = {};

  if (localStorage.tiles)
  {
    let tempTiles = JSON.parse(localStorage.tiles);
    console.log(localStorage.tiles);
    console.log(tempTiles);
    for (tile of tempTiles)
    {
      tiles.push(new Tile(tile.x, tile.y, tile.rad, tile.colour));
    }
  }
  else
  {
    for (let x = 0; x < 16; x++)
    {
      for (let y = 0; y < 30; y++)
      {
        tiles.push(new Tile(((rad + buffer) * 2) * x + ((y % 2) ? rad + buffer : 0), (rad + buffer) * y, rad, (Math.random() < 0.5 ? colour1 : colour2)));
      }
    }
  }

  saveTiles(tiles);

  state.tiles = tiles;

  document.getElementById('canvas').onclick = canvasClick;
  document.getElementById('random').onclick = randomiseTiles;

  draw(state);
}

function randomiseTiles()
{
  for (tile of tiles)
  {
    tile.colour = (Math.random() < 0.5 ? colour1 : colour2);
  }

  let state = {
    tiles: tiles
  };

  saveTiles(tiles);
  draw(state);
}

function saveTiles(tiles)
{
  localStorage.tiles = JSON.stringify(tiles);
}

function canvasClick(evt)
{
  for (tile of tiles)
  {
    if (tile.intersectPoint(evt.offsetX, evt.offsetY))
    {
      if (tile.colour == colour1)
      {
        tile.colour = colour2;
      }
      else
      {
        tile.colour = colour1;
      }
    }
  }

  let state = {
    tiles: tiles
  };

  saveTiles(tiles);

  draw(state);
}

class Tile
{
  constructor(x, y, rad, colour)
  {
    this.x = x;
    this.y = y;
    this.rad = rad;
    this.colour = colour;
  }

  intersectPoint(x, y)
  {
    // Distance from centre to mouse
    let dx = x - this.x;
    let dy = y - this.y;

    let d1 = dx * dx + dy * dy;
    if (d1 > this.rad * this.rad) return false;

    // Distance from top-left to mouse
    dx = x - (this.x - this.rad);
    dy = y - (this.y - this.rad);
    d1 = dx * dx + dy * dy;
    if (d1 < this.rad * this.rad) return false;

    // Distance from top-right to mouse
    dx = x - (this.x + this.rad);
    dy = y - (this.y - this.rad);
    d1 = dx * dx + dy * dy;
    if (d1 < this.rad * this.rad) return false;

    return true;
  }
}

function draw(data)
{
  let can = document.getElementById('canvas');
  let ctx = can.getContext('2d');

  // Clear
  ctx.fillStyle = 'grey';
  ctx.fillRect(0, 0, can.width, can.height);

  for (tile of data.tiles)
  {
    drawTile(tile, ctx);
  }

  // Draw border line
  ctx.fillStyle = 'black';
  ctx.fillRect(897.5 / 2, 0, 5, 800);

  // Draw rough shower area
  ctx.fillRect(900 / 4 - 50, 200, 100, 150);
}

function drawTile(tile, ctx)
{
  ctx.save();

  ctx.fillStyle = tile.colour;
  ctx.translate(tile.x, tile.y);
  ctx.beginPath();
  ctx.arc(-tile.rad, -tile.rad, tile.rad, 0, Math.PI / 2);
  ctx.arc(0, 0, tile.rad, Math.PI, 2 * Math.PI, true);
  ctx.arc(tile.rad, -tile.rad, tile.rad, Math.PI / 2, Math.PI);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
