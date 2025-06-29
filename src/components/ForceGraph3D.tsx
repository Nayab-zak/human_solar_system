import React, { useRef, useEffect, useState, FC } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { SphereGeometry } from 'three';
import * as THREE from 'three';
import { PhysicsService, NodeDatum } from '../services/PhysicsService';
import { NodeService } from '../services/NodeService';
import { ConfigService } from '../services/ConfigService';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

interface ForceGraph3DProps {
  nodeCount?: number;
}

export const ForceGraph3D: FC<ForceGraph3DProps> = ({ nodeCount }) => {
  console.log('ForceGraph3D function body');
  const config = ConfigService.config as any;
  const count = nodeCount ?? config.display.maxNodes;
  console.log('Config:', config);
  console.log('Count:', count);

  const [nodes, setNodes] = useState<NodeDatum[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const physics = useRef<PhysicsService | null>(null);
  const centralNode = useRef<NodeDatum | null>(null);

  console.log('ForceGraph3D render', { config, count, nodes, hoveredId, draggingId });

  // Initialize nodes and physics
  useEffect(() => {
    console.log('ForceGraph3D useEffect: generating nodes', { count });
    // Keep the simulation alive: disable cooling
    const generated = NodeService.generateRandomNodes(count);
    centralNode.current = generated[0];
    const others = generated.slice(1);
    const all = [centralNode.current, ...NodeService.withSimilarities(others, centralNode.current)];
    console.log('All nodes after withSimilarities:', all);

    const svc = new PhysicsService({
      attractForce: config.physics.attractForce,
      repelForce: config.physics.repelForce,
      damping: config.physics.damping,
    });
    console.log('PhysicsService created', svc);
    svc.init(all);
    svc.setAlphaOptions(0, 0.1); // Disable cooling
    svc.onTick(() => setNodes([...all]));
    svc.start();
    console.log('PhysicsService started');
    physics.current = svc;

    return () => {
      console.log('PhysicsService stopped');
      svc.stop();
    };
  }, [count, config.physics]);

  // Handlers for pointer interactions
  // Use correct event types for drei/three fiber
  const handlePointerDown = (id: string) => (e: any) => {
    console.log('PointerDown', { id, e });
    if (e.stopPropagation) e.stopPropagation();
    setDraggingId(id);
    physics.current?.stop();
  };

  const handlePointerUp = (id: string) => (e: any) => {
    console.log('PointerUp', { id, e });
    if (e.stopPropagation) e.stopPropagation();
    if (draggingId === id) {
      setDraggingId(null);
      physics.current?.start();
    }
  };

  const handlePointerMove = (node: NodeDatum) => (e: any) => {
    if (draggingId === node.id) {
      console.log('PointerMove', { node, e });
      if (e.stopPropagation) e.stopPropagation();
      const { x, y, z } = e.point || {};
      if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
        (node as any).x = x;
        (node as any).y = y;
        (node as any).z = z;
        setNodes((prev) => [...prev]);
      }
    }
  };

  const NodeSpheres: FC = () => {
    console.log('Rendering NodeSpheres', nodes);
    return (
      <>
        {nodes.map((node, idx) => {
          console.log('Rendering mesh', { node, idx });
          const isCentral = node.id === centralNode.current?.id;
          const color = isCentral
            ? (config as any).display.colors.central
            : (config as any).display.colors.orbit;

          return (
            <mesh
              key={node.id}
              position={[
                typeof (node as any).x === 'number' ? (node as any).x : 0,
                typeof (node as any).y === 'number' ? (node as any).y : 0,
                typeof (node as any).z === 'number' ? (node as any).z : 0,
              ]}
              onPointerOver={(e) => { e.stopPropagation(); setHoveredId(node.id); }}
              onPointerOut={() => setHoveredId(null)}
              onPointerDown={handlePointerDown(node.id)}
              onPointerUp={handlePointerUp(node.id)}
              onPointerMove={handlePointerMove(node)}
            >
              <primitive object={new SphereGeometry(isCentral ? 2 : 1.5, 32, 32)} attach="geometry" />
              <meshStandardMaterial
                emissive={new THREE.Color(color)}
                emissiveIntensity={0.8}
              />

              {hoveredId === node.id && (
                <Html center distanceFactor={8}>
                  <div className="tooltip bg-gray-800 text-white p-2 rounded">
                    <strong>Attributes:</strong> {node.attributes.join(', ')}
                  </div>
                </Html>
              )}
            </mesh>
          );
        })}
      </>
    );
  };

  return (
    <Canvas camera={{ position: [0, 0, (config as any).display.fov ?? 75], fov: (config as any).display.fov ?? 75 }}>
      <EffectComposer>
        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={2.5} />
      </EffectComposer>
      <ambientLight intensity={0.9} />
      <pointLight position={[50, 50, 50]} intensity={0.7} />
      <OrbitControls enablePan enableZoom enableRotate />
      <NodeSpheres />
    </Canvas>
  );
};
