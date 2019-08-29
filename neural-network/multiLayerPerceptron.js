class MLPNode
{
  constructor(bias = 0, links)
  {
    this.bias = bias;
    this.weights = [];
    this.lastActivation = 0;

    for (let i = 0; i < links; ++i)
    {
      this.weights.push(0);
    }
  }

  getActivation(layer)
  {
    this.activation = 0;
    for (let i = 0; i < this.weights.length; ++i)
    {
      this.activation += layer[i] * this.weights[i] - this.bias;
    }

    // Sigmoid function
    this.activation = 1 / (1 + Math.pow(Math.E, -this.activation));
  }
}

class MultiLayerPerceptron
{
  // This is an array of the inputs of each layer.
  constructor(layers = [])
  {
    this.inputSize = layers[0];
    this.layers = [];

    let first = true;
    let lastLayer = 0;

    for (let layer of layers)
    {
      let l = [];

      for (let i = 0; i < layer; ++i)
      {
        l.push(new MLPNode(0, (first ? 0 : lastLayer)));
      }

      this.layers.push(l);

      first = false;
      lastLayer = layer;
    }
  }

  randomise()
  {
    let first = true;
    for (let layer of this.layers)
    {
      // First layer is input layer so skip
      if (first)
      {
        first = false;
        continue;
      }

      for (let node of layer)
      {
        for (let i = 0; i < node.weights.length; ++i)
        {
          node.weights[i] = Math.random();
        }
      }
    }
  }

  test(inputs)
  {
    // Inputs must be right size
    this.layers[0] = inputs;

    for (let i = 1; i < this.layers.length; ++i)
    {
      for (let node of this.layers[i].nodes)
      {
        node.getActivation(this.layers[i - 1]);
      }
    }
  }
}
