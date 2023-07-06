const fs = require("fs");
const { Readable, Writable } = require("stream");

class Graph {
  constructor() {
    this.nodes = {};
  }

  addNode(nodeId, data) {
    if (!this.nodes[nodeId]) {
      this.nodes[nodeId] = { data: data, edges: {} };
    }
  }

  addEdge(nodeId1, nodeId2) {
    if (this.nodes[nodeId1] && this.nodes[nodeId2]) {
      this.nodes[nodeId1].edges[nodeId2] = true;
      this.nodes[nodeId2].edges[nodeId1] = true;
    }
  }

  getNodes(query, nodeId) {
    if (nodeId && this.nodes[nodeId]) {
      const node = this.nodes[nodeId];

      const result = {
        node: node,
        edges: Object.keys(node.edges),
        mutualNeighbors: [],
      };

      // Find mutual neighbors
      Object.keys(node.edges).forEach((neighborId) => {
        const neighbor = this.nodes[neighborId];
        const mutualNeighbors = Object.keys(neighbor.edges).filter(
          (id) => this.nodes[id].edges[nodeId]
        );
        result.mutualNeighbors.push({
          nodeId: neighborId,
          neighbors: mutualNeighbors,
        });
      });

      return result;
    }

    if (!query) {
      return this.nodes;
    }

    const result = {};
    for (const nodeId in this.nodes) {
      if (this.nodes.hasOwnProperty(nodeId)) {
        const node = this.nodes[nodeId];
        if (query(node.data)) {
          result[nodeId] = node;
        }
      }
    }

    return result;
  }

  async writeToFile(filename) {
    const writeStream = fs.createWriteStream(filename);
    const graphData = JSON.stringify(await this.getNodes(), null, 2);

    const readableStream = Readable.from([graphData]);
    readableStream.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        console.log(`Data successfully saved to ${filename}`);
        resolve();
      });

      writeStream.on("error", (err) => {
        console.error("Error writing to file:", err);
        reject(err);
      });
    });
  }

  async readFromFile(filename) {
    const readStream = fs.createReadStream(filename);
    let data = "";

    readStream.on("data", (chunk) => {
      data += chunk;
    });

    return new Promise((resolve, reject) => {
      readStream.on("end", () => {
        try {
          const parsedData = JSON.parse(data);
          this.nodes = parsedData;
          console.log("Graph data successfully loaded.");
          resolve();
        } catch (err) {
          console.error("Error parsing JSON:", err);
          reject(err);
        }
      });

      readStream.on("error", (err) => {
        console.error("Error reading file:", err);
        reject(err);
      });
    });
  }
}

const graph = async ()=>{
  const myGraph = new Graph();

// Adding nodes
myGraph.addNode(1, { id: 1, name: "Node 1", type: "A" });
myGraph.addNode(2, { id: 2, name: "Node 2", type: "B" });
myGraph.addNode(3, { id: 3, name: "Node 3", type: "A" });

// Adding edges between nodes
myGraph.addEdge(1, 2);
myGraph.addEdge(2, 3);

// Get nodes with a specific condition
const nodesOfTypeA = myGraph.getNodes((node) => node.type === "A");
console.log("Nodes of type A:", nodesOfTypeA);

// Get the entire graph
const entireGraph = myGraph.getNodes();
console.log("Entire Graph:", entireGraph);

// Write the graph data to a file
await myGraph.writeToFile("graph_data.json");

// Read the graph data from a file
await myGraph.readFromFile("graph_data.json");

// Get edges and mutual neighbors of a specific node
const node2Info = myGraph.getNodes(null, 2);
console.log("Edges and Mutual Neighbors of Node 2:", node2Info);

}

graph()