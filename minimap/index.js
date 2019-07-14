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
    map = Object.assign(new Map(), JSON.parse(localStorage.map));

    for (let cell in map.cells)
    {
      map.cells[cell] = Object.assign(new MapCell(), map.cells[cell]);
    }
  }
  else {
    map = new Map();

    map.cells.push(new MapCell(new Vector2(0, 0), 'Start', ['start']));
  }

  map.customRenderCell = CustomCellRender;

  can = document.getElementById('canvas');

  can.onclick = mapClick;

  RenderMap();

  document.getElementById('placeCell').onclick = () =>
    ChangeState(EditorState_PlaceCell);

  document.getElementById('cellName').onchange = Autosave;
  document.getElementById('cellPosX').onchange = Autosave;
  document.getElementById('cellPosY').onchange = Autosave;

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
};

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
  // Need this boilerplate so Tweego can compile from export
  let output = `:: StoryTitle
Map Export

:: StorySettings
ifid:Map Export\n\n`;

  for (let cell of map.cells)
  {
    output += `:: ${cell.name} [ ${cell.tags.toString()} ]\n\n`;

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
  SaveToLocalStorage();
}

function SaveCellDetails()
{
  if (selectedCellIdx < 0) return;

  let cell = map.cells[selectedCellIdx];
  cell.name = document.getElementById('cellName').value;
  cell.position.x = parseFloat(document.getElementById('cellPosX').value);
  cell.position.y = parseFloat(document.getElementById('cellPosY').value);

  RenderMap();

  SaveToLocalStorage();
}

function SaveToLocalStorage()
{
  localStorage.map = JSON.stringify(map);
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

      map.cells[selectedCellIdx].position = pos;

      ChangeState(EditorState_Default);
      break;
  }

  SaveToLocalStorage();

  RenderMap();
}

function ChangeState(state)
{
  editorState = state;
}

function PlaceCell(pos)
{
  map.cells.push(new MapCell(pos, 'Cell ' + (map.cells.length + 1)));
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
  document.getElementById('cellTags').innerText = cell.tags.join(', ') || 'No tags';
}
