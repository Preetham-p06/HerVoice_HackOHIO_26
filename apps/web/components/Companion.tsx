"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, Component, ReactNode } from "react";
import * as THREE from "three";
function Friend({
  speaking,
  mouthShape = "",
}: {
  speaking: boolean;
  mouthShape?: string;
}) {
  const group = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const eyes = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current) group.current.rotation.y = Math.sin(t * 0.5) * 0.12;
    if (mouth.current)
      mouth.current.scale.y = mouthShape
        ? {
            A: 0.3,
            B: 1.2,
            C: 2,
            D: 3,
            E: 1.5,
            F: 0.8,
            G: 0.6,
            H: 0.5,
            X: 0.2,
          }[mouthShape] || 1
        : speaking
          ? 1 + Math.abs(Math.sin(t * 12)) * 3
          : 1;
    if (eyes.current) eyes.current.scale.y = t % 4 < 0.12 ? 0.1 : 1;
  });
  return (
    <group ref={group}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#a8c6b3" roughness={0.6} />
      </mesh>
      <group ref={eyes}>
        {[-0.32, 0.32].map((x) => (
          <mesh key={x} position={[x, 0.2, 0.91]}>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshStandardMaterial color="#243e37" />
          </mesh>
        ))}
      </group>
      <mesh ref={mouth} position={[0, -0.2, 0.98]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#385c50" />
      </mesh>
      <mesh position={[0, 1.08, 0]} rotation={[0, 0, -0.5]}>
        <sphereGeometry args={[0.23, 24, 24]} />
        <meshStandardMaterial color="#47725b" />
      </mesh>
    </group>
  );
}
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p>3D is unavailable on this device. Text and voice remain available.</p>
    ) : (
      this.props.children
    );
  }
}
export default function Companion({
  speaking,
  mouthShape = "",
}: {
  speaking: boolean;
  mouthShape?: string;
}) {
  return (
    <Boundary>
      <div
        className="companion"
        role="img"
        aria-label="Optional original animated companion"
      >
        <Canvas
          camera={{ position: [0, 0, 4], fov: 40 }}
          frameloop={
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "demand"
              : "always"
          }
        >
          <ambientLight intensity={2} />
          <directionalLight position={[3, 4, 5]} intensity={3} />
          <Friend speaking={speaking} mouthShape={mouthShape} />
        </Canvas>
        <small>
          Original 3D companion · timed mouth cues when available; playback
          animation otherwise
        </small>
      </div>
    </Boundary>
  );
}
