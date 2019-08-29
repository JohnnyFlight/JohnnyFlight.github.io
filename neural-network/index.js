window.onload = () =>
{
  let network = new MultiLayerPerceptron([3, 4, 5]);
  network.randomise();

  let canvas = document.getElementById('canvas');
  let ctx = canvas.getContext('2d');

  RenderNetwork(ctx, network);
}

function RenderNetwork(ctx, network)
{
  let first = false;

  let nodeRad = 10;
  let nodeSpace = 50;

  for (let i in network.layers)
  {
    i = parseInt(i);
    for (let j in network.layers[i])
    {
      j = parseInt(j);
      let node = network.layers[i][j];

      // Draw circle
      ctx.beginPath();
      {
        ctx.arc((i + 1) * nodeSpace, (j + 1) * nodeSpace, nodeRad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.closePath();

      // Draw weights
      for (let k in network.layers[i][j].weights)
      {
        k = parseInt(k);
        ctx.beginPath();
        {
          let colour = 255 * network.layers[i][j].weights[k];
          ctx.strokeStyle = `rgb(${colour}, ${colour},${colour})`;
          ctx.lineWidth = 5;
          // Previous node
          ctx.moveTo((i) * nodeSpace, (k + 1) * nodeSpace);
          // Current node
          ctx.lineTo((i + 1) * nodeSpace, (j + 1) * nodeSpace);
          ctx.stroke();
        }
        ctx.closePath();
      }
    }

    first = false;
  }
}
