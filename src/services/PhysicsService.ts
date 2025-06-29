import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  Simulation,
  SimulationNodeDatum,
} from 'd3-force-3d';

/**
 * Extends the d3 SimulationNodeDatum to include trait vectors
 */
export interface NodeDatum extends SimulationNodeDatum {
  id: string;
  attributes: number[];    // 0–100 values per trait dimension
  similarity?: number;      // Optional precomputed similarity score
}

/**
 * Configuration options for the physics simulation
 */
export interface PhysicsOptions {
  attractForce: number;     // Strength of attraction toward central node
  repelForce: number;       // Strength of repulsion between nodes
  damping: number;          // Velocity decay (0–1)
}

/**
 * PhysicsService wraps a d3-force-3d Simulation for trait-based layouts.
 * Currently uses CPU-based forces; structure allows swapping to GPU later.
 */
export class PhysicsService {
  private sim!: Simulation<NodeDatum, undefined>;
  private options: PhysicsOptions;

  constructor(options: PhysicsOptions) {
    this.options = options;
  }

  /**
   * Initialize the simulation with a set of nodes.
   * @param nodes Array of NodeDatum to simulate
   */
  public init(nodes: NodeDatum[]) {
    // Basic many-body repulsion
    const chargeForce = forceManyBody().strength(-this.options.repelForce);

    // Centering force at origin
    const centerForce = forceCenter(0, 0, 0);

    // Create simulation
    this.sim = forceSimulation(nodes)
      .force('charge', chargeForce)
      .force('center', centerForce)
      .velocityDecay(this.options.damping)
      .stop();
  }

  /**
   * Register a tick callback to receive updates each frame.
   * @param callback Called after each tick with access to updated nodes via the simulation reference.
   */
  public onTick(callback: () => void) {
    if (!this.sim) {
      throw new Error('Simulation not initialized. Call init() first.');
    }
    this.sim.on('tick', callback);
  }

  /**
   * Start or restart the simulation (alpha reset to 1).
   */
  public start() {
    if (!this.sim) {
      throw new Error('Simulation not initialized. Call init() first.');
    }
    this.sim.alpha(1).restart();
  }

  /**
   * Stop the simulation.
   */
  public stop() {
    this.sim.stop();
  }

  /**
   * Dynamically update simulation parameters.
   * @param opts Partial PhysicsOptions to merge
   */
  public updateOptions(opts: Partial<PhysicsOptions>) {
    this.options = { ...this.options, ...opts };

    if (this.sim) {
      // Update existing forces
      const charge = this.sim.force('charge') as d3.ForceManyBody<NodeDatum, undefined>;
      if (charge) charge.strength(-this.options.repelForce);

      this.sim.velocityDecay(this.options.damping);
    }
  }

  /**
   * Set the alpha decay and target for the simulation.
   * @param decay The decay rate for alpha (0-1)
   * @param target The target value for alpha
   */
  public setAlphaOptions(decay: number, target: number) {
    if (this.sim) {
      this.sim.alphaDecay(decay);
      this.sim.alphaTarget(target);
    }
  }
}
