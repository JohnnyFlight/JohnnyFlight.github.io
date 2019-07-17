let map;
let can;
let selectedCellIdx = -1;

// Define editor states here
const EditorState_Default = 'default';
const EditorState_PlaceCell = 'placeCell';
const EditorState_LinkCell = 'linkCell';
const EditorState_MoveCell = 'moveCell';

let editorState = EditorState_Default;

window.onload = () => {
  if (localStorage.map)
  {
    LoadFromLocalStorage();
  }
  else {
    map = new Map();

    map.cells.push(new MapCell(new Vector2(0, 0), 'Start', ['start']));
    document.getElementById('storyTitle').value = 'New Story';
  }

  SetupEventListeners();

  map.customRenderCell = CustomCellRender;

  can = document.getElementById('canvas');

  can.onclick = mapClick;

  RenderMap();
};

function SetupEventListeners()
{
  document.getElementById('placeCell').onclick = () =>
    ChangeState(EditorState_PlaceCell);

  // Cell properties
  document.getElementById('cellName').onchange = Autosave;

  document.getElementById('cellPosX').onchange = Autosave;
  document.getElementById('cellPosY').onchange = Autosave;

  document.getElementById('cellSizeX').onchange = Autosave;
  document.getElementById('cellSizeY').onchange = Autosave;

  document.getElementById('cellFlavour').onchange = Autosave;

  // Story properties
  document.getElementById('storyTitle').onchange = Autosave;

  document.getElementById('defaultCellSizeX').onchange = Autosave;
  document.getElementById('defaultCellSizeY').onchange = Autosave;

  document.getElementById('cellVisible').onchange = Autosave;
  document.getElementById('cellHidden').onchange = Autosave;

  document.getElementById('cellTags').onchange = Autosave;

  document.getElementById('linkCell').onclick = () =>
  {
    if (selectedCellIdx < 0) return;
    ChangeState(EditorState_LinkCell);
  }

  document.getElementById('moveCell').onclick = () =>
  {
    if (selectedCellIdx < 0) return;
    ChangeState(EditorState_MoveCell);
  }

  document.getElementById('exportTweego').onclick = ExportTweego

  document.getElementById('saveCell').onclick = SaveCellDetails;
}

function CustomCellRender(ctx, cell)
{
  if (map.getCellIndexByName(cell.name) == selectedCellIdx)
  {
    console.log(map.getCellIndexByName(cell.name), selectedCellIdx)
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;
  }
  else
  {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
  }

  // If cell is visible and in map size or connected to cell in map size
  if (!cell.visible)
  {
    ctx.setLineDash([10, 5]);
  };

  ctx.save();
  {
    ctx.translate(-cell.size.x / 2, -cell.size.y / 2);

    ctx.beginPath();
    {
      ctx.rect(cell.position.x, cell.position.y, cell.size.x, cell.size.y);
      ctx.stroke();
    }
    ctx.closePath();
  }
  ctx.restore();
}

function ExportTweego()
{
  if (map.getCellIndexByName('Start') == -1)
  {
    alert('No Start passage found (must be case sensitive)');
    return;
  }

  let includeMap = document.getElementById('includeMap').checked;
  let includeEvents = document.getElementById('includeEvents').checked;
  let includeMapReveal = document.getElementById('includeMapReveal').checked;

  // Need this boilerplate so Tweego can compile from export
  let output = `:: StoryTitle
${document.getElementById('storyTitle').value}

:: StorySettings
ifid:Map Export

:: PassageDone
${includeMap ? '<<script>>State.variables.RenderMap();<</script>>' : ''}

:: StoryPassage
${includeMap ? '<canvas id="canvas" width="200" height="200"></canvas>' : ''}\n\n`;

  for (let cell of map.cells)
  {
    output += `:: ${cell.name} [ ${cell.tags.toString()} ]
${includeMap ? '<<set $mapName to "' + cell.name + '">>' : ''}
${includeMapReveal ? '<<print $map.setCellVisibilityByName("' + cell.name + '")>>' : ''}

${includeEvents ? '<<print $GetEventsForScene("' + cell.name + '")>>' : ''}

${cell.flavourText || ''}\n\n`;

    for (let linkIdx of cell.links)
    {
      let link = map.cells[linkIdx];

      output += `[[${link.name}]]\n`;
    }

    output += '\n\n';
  }

  document.getElementById('export').innerHTML = output;
}

function Autosave()
{
  SaveCellDetails();
}

function SaveCellDetails()
{
  if (selectedCellIdx < 0) return;

  let cell = map.cells[selectedCellIdx];
  cell.name = document.getElementById('cellName').value;

  cell.position.x = parseFloat(document.getElementById('cellPosX').value);
  cell.position.y = parseFloat(document.getElementById('cellPosY').value);

  cell.size.x = parseFloat(document.getElementById('cellSizeX').value);
  cell.size.y = parseFloat(document.getElementById('cellSizeY').value);

  cell.visible = document.getElementById('cellVisible').checked;
  cell.hidden = document.getElementById('cellHidden').checked;

  cell.flavourText = document.getElementById('cellFlavour').value;

  cell.tags = document.getElementById('cellTags').value.split(',').map((val) => val.trim());

  RenderMap();

  SaveToLocalStorage();
}

function SaveToLocalStorage()
{
  localStorage.map = JSON.stringify({
    map: map,
    title: document.getElementById('storyTitle').value,
    defaults: {
      cellSize: {
        x: document.getElementById('defaultCellSizeX').value,
        y: document.getElementById('defaultCellSizeY').value
      }
    }
  });
}

function LoadFromLocalStorage()
{
  let load = JSON.parse(localStorage.map);
  map = Object.assign(new Map(), load.map);

  document.getElementById('storyTitle').value = load.title;

  document.getElementById('defaultCellSizeX').value = load.defaults.cellSize.x;
  document.getElementById('defaultCellSizeY').value = load.defaults.cellSize.y;

  for (let cell in map.cells)
  {
    map.cells[cell] = Object.assign(new MapCell(), map.cells[cell]);
  }
}

function mapClick(evt)
{
  let pos = new Vector2(evt.offsetX - can.width / 2 + map.centre.x, evt.offsetY - can.height / 2 + map.centre.y);
  let idx = map.getCellIndexAtPoint(pos.x, pos.y);

  switch (editorState)
  {
    case EditorState_Default:
      if (idx > -1)
      {
        printCell(map.cells[idx]);
        selectedCellIdx = idx;
      }
      break;
    case EditorState_PlaceCell:
      PlaceCell(pos);
      ChangeState(EditorState_Default);
      selectedCellIdx = map.cells.length - 1;
      printCell(map.cells[selectedCellIdx]);
      break;
    case EditorState_LinkCell:
      if (selectedCellIdx < 0 || selectedCellIdx == idx) break;

      map.linkCells(selectedCellIdx, idx);
      if (!(document.getElementById('oneWayLink').checked))
        map.linkCells(idx, selectedCellIdx);

      ChangeState(EditorState_Default);
      break;
    case EditorState_MoveCell:
      if (selectedCellIdx < 0) break;

      if (document.getElementById('snapGrid').checked)
      {
        map.cells[selectedCellIdx].position = SnapToGrid(pos);
      }
      else
      {
        map.cells[selectedCellIdx].position = pos;
      }
      printCell(map.cells[selectedCellIdx]);

      ChangeState(EditorState_Default);
      break;
  }

  SaveToLocalStorage();

  RenderMap();
}

function SnapToGrid(pos)
{
  let gridX = document.getElementById('gridX').value;
  let gridY = document.getElementById('gridY').value;

  pos.x = Math.floor(pos.x / gridX) * gridX;
  pos.y = Math.floor(pos.y / gridY) * gridY;

  return pos;
}

function ChangeState(state)
{
  editorState = state;
  document.getElementById('editorState').innerText = state;
}

function PlaceCell(pos)
{
  let cell = new MapCell(pos, 'Cell ' + (map.cells.length + 1));
  cell.size.x = document.getElementById('defaultCellSizeX').value;
  cell.size.y = document.getElementById('defaultCellSizeY').value;

  if (document.getElementById('snapGrid').checked)
  {
    cell.position = SnapToGrid(cell.position);
  }

  map.cells.push(cell);
}

function RenderMap()
{
  let ctx = can.getContext('2d');
  map.render(ctx, can.width, can.height);
}

function printCell(cell)
{
  document.getElementById('cellName').value = cell.name || 'No name';

  document.getElementById('cellPosX').value = `${cell.position.x}`
  document.getElementById('cellPosY').value = `${cell.position.y}`;

  document.getElementById('cellSizeX').value = `${cell.size.x}`
  document.getElementById('cellSizeY').value = `${cell.size.y}`;

  document.getElementById('cellVisible').checked = cell.visible;
  document.getElementById('cellHidden').checked = cell.hidden;

  document.getElementById('cellFlavour').value = cell.flavourText || '';

  document.getElementById('cellTags').value = cell.tags.join(', ') || '';
}
