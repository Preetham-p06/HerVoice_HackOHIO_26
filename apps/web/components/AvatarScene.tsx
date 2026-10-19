"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  Bone,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Euler,
  Vector3,
} from "three";
import { styleMaya } from "./mayaStyling";
import type { RefObject } from "react";
export type AvatarMotion = {
  speaking: boolean;
  expression: string;
  paused: boolean;
  level: RefObject<number>;
  audio: RefObject<HTMLAudioElement | null>;
  cues: RefObject<{ start: number; end: number; value: string }[]>;
};
function Character({
  speaking,
  expression,
  paused,
  level,
  audio,
  cues,
  onReady,
}: AvatarMotion & { onReady: () => void }) {
  const { scene } = useGLTF("/models/maya-studio.glb");
  const model = useMemo(() => clone(scene), [scene]);
  const rig = useMemo(() => {
    const faces: Mesh[] = [];
    model.traverse((node) => {
      const mesh = node as Mesh;
      if (mesh.morphTargetInfluences) faces.push(mesh);
      if (node.name === "Wolf3D_Glasses") node.visible = false;
      if (
        node.name === "Wolf3D_Outfit_Top" ||
        node.name === "Wolf3D_Outfit_Bottom"
      ) {
        const material = (mesh.material as MeshStandardMaterial).clone();
        material.map = null;
        material.color.set(
          node.name === "Wolf3D_Outfit_Top" ? "#9dbdd8" : "#354354",
        );
        material.roughness = 0.86;
        material.metalness = 0;
        material.needsUpdate = true;
        mesh.material = material;
      }
    });
    // Relax the reference pose so the shoulders and arms rest naturally.
    for (const side of ["Left", "Right"]) {
      model.updateMatrixWorld(true);
      const arm = model.getObjectByName(side + "Arm") as Bone;
      const elbow = model.getObjectByName(side + "ForeArm") as Bone;
      if (!arm?.parent || !elbow) continue;
      const direction = elbow.getWorldPosition(new Vector3()).sub(arm.getWorldPosition(new Vector3())).normalize();
      const target = new Vector3(side === "Left" ? .16 : -.16, -1, .08).normalize();
      const world = arm.getWorldQuaternion(new Quaternion());
      world.premultiply(new Quaternion().setFromUnitVectors(direction, target));
      arm.quaternion.copy(arm.parent.getWorldQuaternion(new Quaternion()).invert().multiply(world));
    }
    styleMaya(model as import("three").Group);
    const head = model.getObjectByName("Head") as Bone;
    const spine = model.getObjectByName("Spine1") as Bone;
    return {
      faces,
      head,
      spine,
      headRest: head?.quaternion.clone(),
      spineRest: spine?.quaternion.clone(),
    };
  }, [model]);
  const offset = useRef(new Quaternion());
  const rotation = useRef(new Euler());
  useEffect(() => onReady(), [onReady]);
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const current = audio.current?.currentTime || 0;
    const cue = speaking
      ? cues.current.find((c) => c.start <= current && c.end > current)?.value
      : undefined;
    const energy = speaking && !paused ? Math.min(0.8, level.current * 6) : 0;
    const blink =
      !paused && t % 4.7 < 0.16 ? Math.sin(((t % 4.7) / 0.16) * Math.PI) : 0;
    const viseme = cue
      ? (
          {
            A: "viseme_PP",
            B: "viseme_kk",
            C: "viseme_E",
            D: "viseme_aa",
            E: "viseme_O",
            F: "viseme_U",
            G: "viseme_FF",
            H: "viseme_TH",
            X: "viseme_sil",
          } as Record<string, string>
        )[cue]
      : null;
    for (const mesh of rig.faces) {
      const values = mesh.morphTargetInfluences!;
      for (const [name, index] of Object.entries(
        mesh.morphTargetDictionary || {},
      )) {
        let target = 0;
        if (name === "eyeBlinkLeft" || name === "eyeBlinkRight") target = blink;
        if (name === "jawOpen") target = viseme ? 0 : energy * 0.8;
        if (name === "mouthSmileLeft" || name === "mouthSmileRight")
          target = expression === "gentle" ? 0.22 : 0.12;
        if (name === "eyeSquintLeft" || name === "eyeSquintRight")
          target = 0.035;
        if (name === "browInnerUp")
          target = expression === "gentle" ? 0.09 : 0.045;
        if (viseme === name && !paused) target = 0.65;
        values[index] = MathUtils.damp(
          values[index],
          target,
          20,
          Math.min(delta, 0.1),
        );
      }
    }
    if (!paused && rig.head && rig.headRest) {
      rotation.current.set(
        -0.018 +
          Math.sin(t * 0.65) * 0.012 +
          (speaking ? Math.sin(t * 2.2) * 0.008 : 0),
        Math.sin(t * 0.35) * 0.022,
        -0.025 + Math.sin(t * 0.48) * 0.014,
      );
      offset.current.setFromEuler(rotation.current);
      rig.head.quaternion.copy(rig.headRest).multiply(offset.current);
    }
    if (!paused && rig.spine && rig.spineRest) {
      rotation.current.set(
        Math.sin(t * 0.8) * 0.003,
        0,
        Math.sin(t * 0.38) * 0.003,
      );
      rig.spine.quaternion
        .copy(rig.spineRest)
        .multiply(offset.current.setFromEuler(rotation.current));
    }
  });
  return <primitive object={model} />;
}
function Camera({ close }: { close: boolean }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 1.56, close ? 1.3 : 1.65);
    camera.lookAt(0, close ? 1.62 : 1.48, 0);
  }, [camera, close]);
  return null;
}
export default function AvatarScene({
  close,
  onReady,
  ...motion
}: AvatarMotion & { close: boolean; onReady: () => void }) {
  return (
    <Canvas
      camera={{ position: [0, 1.52, 1.5], fov: 32 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#fff0e5", "#b0bdbe", 0.8]} />
      <directionalLight position={[2, 3, 4]} intensity={1.8} color="#fff3e7" />
      <directionalLight position={[-3, 2, 1]} intensity={0.7} color="#e4e9ff" />
      <directionalLight position={[0, 3, -2]} intensity={1.3} color="#fff2dc" />
      <Camera close={close} />
      <Suspense fallback={null}>
        <Character {...motion} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
