"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, MathUtils, Mesh } from "three";
import type { RefObject } from "react";

export type AvatarMotion = {
  speaking: boolean;
  expression: string;
  paused: boolean;
  level: RefObject<number>;
  audio: RefObject<HTMLAudioElement | null>;
  cues: RefObject<{ start: number; end: number; value: string }[]>;
};
function Character({ speaking, expression, paused, level, audio, cues, onReady }: AvatarMotion & {onReady: () => void}) {
  const { scene, animations } = useGLTF("/models/maya.glb");
  const model = useMemo(() => scene.clone(true), [scene]);
  const group = useRef<Group>(null);
  const { actions } = useAnimations(animations, group);
  const faces = useMemo(() => {
    const list: Mesh[] = [];
    model.traverse(node => { if ((node as Mesh).morphTargetInfluences) list.push(node as Mesh); });
    return list;
  }, [model]);
  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => {
    const next = actions[speaking ? "Talking" : "Idle"];
    if (paused) { Object.values(actions).forEach(a => { if(a) a.paused=true; }); return; }
    Object.values(actions).forEach(a => { if(a) a.paused=false; });
    next?.reset().fadeIn(.35).play();
    return () => { next?.fadeOut(.35); };
  }, [actions, speaking, paused]);
  useFrame(({ clock }, delta) => {
    const time=clock.elapsedTime;
    const position=audio.current?.currentTime || 0;
    const cue=cues.current.find(c => c.start<=position && c.end>position)?.value;
    const aligned = !!cue && speaking;
    const intensity = speaking ? Math.min(1, level.current * 5) : 0;
    const open = paused ? 0 : aligned ? ({A:0,B:.15,C:.55,D:.9,E:.65,F:.35,G:.1,H:.2,X:0} as Record<string,number>)[cue!] || 0 : intensity;
    const blink = !paused && time % 4.3 < .13 ? Math.sin((time % 4.3)/.13*Math.PI) : 0;
    for(const mesh of faces) {
      const dictionary=mesh.morphTargetDictionary || {};
      const values=mesh.morphTargetInfluences!;
      for(const [name,index] of Object.entries(dictionary)) {
        const target = name === "jawOpen" ? open : name === "mouthFunnel" ? aligned && ["E","F"].includes(cue!) ? .6 : 0 : name === "mouthSmile" ? expression === "gentle" ? .45 : .08 : name === "blink" ? blink : 0;
        values[index] = MathUtils.damp(values[index], target, 18, Math.min(delta,.1));
      }
    }
  });
  return <group ref={group}><primitive object={model} /></group>;
}
function Camera({ close }: { close: boolean }) {
  const { camera }=useThree();
  useEffect(() => { camera.position.set(0,close ? 1.7 : 1.30,close ? 2.65 : 3.65); camera.lookAt(0,close ? 1.7 : 1.18,0); }, [camera,close]);
  return null;
}
export default function AvatarScene({ close, onReady, ...motion }: AvatarMotion & { close: boolean; onReady: () => void }) {
  return <Canvas camera={{ position:[0,1.3,3.65], fov:38 }} dpr={[1,1.5]} gl={{ antialias:true, alpha:true }}>
    <ambientLight intensity={1.4} />
    <directionalLight position={[3,4,5]} intensity={2.2} color="#fff3df" />
    <directionalLight position={[-3,2,2]} intensity={1} color="#d7e8ff" />
    <Camera close={close}/>
    <Suspense fallback={null}><Character {...motion} onReady={onReady}/></Suspense>
  </Canvas>;
}
