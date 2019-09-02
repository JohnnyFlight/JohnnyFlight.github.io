class MLPNode
{
  constructor(bias = 0, links)
  {
    this.bias = bias;
    this.weights = [];
    this.activation = 0;

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
      this.activation += layer[i].activation * this.weights[i] - this.bias;
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

    // TODO: This is jank
    this.layers[0] = inputs.map((x) => {
      let y = new MLPNode();
      y.activation = x;
      return y;
    });

    for (let i = 1; i < this.layers.length; ++i)
    {
      for (let node of this.layers[i])
      {
        node.getActivation(this.layers[i - 1]);
      }
    }

    return this.layers[this.layers.length - 1].map((x) => x.activation);
  }

  // inputs is an array of input arrays
  // expectedOutputs is an array of expected output arrays
  train(inputs, expectedOutputs)
  {
    // TODO: Check sizes are same length

    // Create a copy of the network to store changed weights?
    let givenOutputs = [];
    for (let input of inputs)
    {
      let calculatedOutput = this.test(input);
      givenOutputs.push(calculatedOutput);

      // Calculate cost by comparing input and output

      // Adjust weight and bias accordingly
    }
  }
}
