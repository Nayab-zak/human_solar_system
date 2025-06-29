import { v4 as uuidv4 } from 'uuid';
import { NodeDatum } from './PhysicsService';
import { ConfigService } from './ConfigService';

/**
 * NodeService handles generation of NodeDatum objects
 * including random creation, similarity computations, and attaching metadata.
 */
export class NodeService {
  /**
   * Generate a list of NodeDatum with random attribute vectors.
   * @param count Number of nodes to generate
   */
  public static generateRandomNodes(count: number): NodeDatum[] {
    const config = ConfigService.config as any;
    const dimensions = config.traits?.dimensions ?? 3;
    const nodes: NodeDatum[] = [];
    for (let i = 0; i < count; i++) {
      // Random attribute values 0–100
      const attributes = Array.from({ length: dimensions }, () =>
        Math.floor(Math.random() * 101)
      );
      nodes.push({
        id: uuidv4(),
        attributes,
        // @ts-ignore: d3-force-3d will use x, y, z
        x: Math.random() * 100 - 50,
        // @ts-ignore
        y: Math.random() * 100 - 50,
        // @ts-ignore
        z: Math.random() * 100 - 50,
      });
    }
    return nodes;
  }

  /**
   * Compute similarity between two nodes based on attribute vectors.
   * Similarity = 1 - (sum(abs differences) / (N * 100)).
   */
  public static computeSimilarity(a: NodeDatum, b: NodeDatum): number {
    const dims = a.attributes.length;
    let diffSum = 0;
    for (let i = 0; i < dims; i++) {
      diffSum += Math.abs(a.attributes[i] - b.attributes[i]);
    }
    return 1 - diffSum / (dims * 100);
  }

  /**
   * Attach similarity scores to each node relative to a central node.
   * @param nodes Array of NodeDatum (excluding central)
   * @param central Central NodeDatum
   */
  public static withSimilarities(
    nodes: NodeDatum[],
    central: NodeDatum
  ): NodeDatum[] {
    return nodes.map((node) => ({
      ...node,
      similarity: NodeService.computeSimilarity(node, central),
    }));
  }
}
