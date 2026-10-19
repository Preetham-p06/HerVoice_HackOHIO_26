"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { Bone, MathUtils, Mesh, MeshStandardMaterial, Quaternion, Euler } from "three";
import type { RefObject } from "react";
export type AvatarMotion = {
  speaking: boolean; expression: string; paused: boolean;
  level: RefObject<number>; audio: RefObject<HTMLAudioElement | null>;
  cues: RefObject<{start:number;end:number;value:string}[]>;
};
function Character({speaking,expression,paused,level,audio,cues,onReady}:AvatarMotion & {onReady:()=>void}) {
  const {scene}=useGLTF("/models/maya-studio.glb");
  const model=useMemo(()=>clone(scene),[scene]);
  const rig=useMemo(()=>{
    const faces:Mesh[]=[];
    model.traverse(node=>{
      const mesh=node as Mesh;
      if(mesh.morphTargetInfluences) faces.push(mesh);
      if(node.name==='Wolf3D_Glasses') node.visible=false;
      if(node.name==='Wolf3D_Outfit_Top' || node.name==='Wolf3D_Outfit_Bottom') {
        const material=(mesh.material as MeshStandardMaterial).clone();
        material.map=null;
        material.color.set(node.name==='Wolf3D_Outfit_Top' ? '#9dbdd8' : '#354354');
        material.roughness=.86; material.metalness=0; material.needsUpdate=true;
        mesh.material=material;
      }
    });
    const head=model.getObjectByName('Head') as Bone;
    const spine=model.getObjectByName('Spine1') as Bone;
    return {faces,head,spine,headRest:head?.quaternion.clone(),spineRest:spine?.quaternion.clone()};
  },[model]);
  const offset=useRef(new Quaternion());
  const rotation=useRef(new Euler());
  useEffect(()=>onReady(),[onReady]);
  useFrame(({clock},delta)=>{
    const t=clock.elapsedTime;
    const current=audio.current?.currentTime || 0;
    const cue=speaking ? cues.current.find(c=>c.start<=current && c.end>current)?.value : undefined;
    const energy=speaking&&!paused ? Math.min(.8,level.current*6) : 0;
    const blink=!paused && t%4.7<.16 ? Math.sin((t%4.7)/.16*Math.PI) : 0;
    const viseme=cue ? ({A:'viseme_PP',B:'viseme_kk',C:'viseme_E',D:'viseme_aa',E:'viseme_O',F:'viseme_U',G:'viseme_FF',H:'viseme_TH',X:'viseme_sil'} as Record<string,string>)[cue] : null;
    for(const mesh of rig.faces){
      const values=mesh.morphTargetInfluences!;
      for(const [name,index] of Object.entries(mesh.morphTargetDictionary || {})){
        let target=0;
        if(name==='eyeBlinkLeft'||name==='eyeBlinkRight') target=blink;
        if(name==='jawOpen') target=viseme ? 0 : energy*.8;
        if(name==='mouthSmileLeft'||name==='mouthSmileRight') target=expression==='gentle' ? .16 : .025;
        if(name==='browInnerUp') target=expression==='gentle' ? .06 : .02;
        if(viseme===name&&!paused) target=.65;
        values[index]=MathUtils.damp(values[index],target,20,Math.min(delta,.1));
      }
    }
    if(!paused&&rig.head&&rig.headRest){
      rotation.current.set(Math.sin(t*.65)*.012+(speaking?Math.sin(t*2.2)*.008:0),Math.sin(t*.35)*.022,Math.sin(t*.48)*.014);
      offset.current.setFromEuler(rotation.current);
      rig.head.quaternion.copy(rig.headRest).multiply(offset.current);
    }
    if(!paused&&rig.spine&&rig.spineRest){
      rotation.current.set(Math.sin(t*.8)*.003,0,Math.sin(t*.38)*.003);
      rig.spine.quaternion.copy(rig.spineRest).multiply(offset.current.setFromEuler(rotation.current));
    }
  });
  return <primitive object={model} />;
}
function Camera({close}:{close:boolean}){
  const {camera}=useThree();
  useEffect(()=>{camera.position.set(0,1.52,close?1.0:1.5);camera.lookAt(0,close?1.64:1.46,0);},[camera,close]);
  return null;
}
export default function AvatarScene({close,onReady,...motion}:AvatarMotion&{close:boolean;onReady:()=>void}){
  return <Canvas camera={{position:[0,1.52,1.5],fov:32}} dpr={[1,1.75]} gl={{antialias:true,alpha:true}}>
    <ambientLight intensity={.8}/>
    <hemisphereLight args={['#fff0e5','#8f879a',1.5]}/>
    <directionalLight position={[2,3,4]} intensity={2.2} color="#fff3e7"/>
    <directionalLight position={[-3,2,1]} intensity={1.2} color="#e4e9ff"/>
    <directionalLight position={[0,3,-2]} intensity={1.8} color="#fff2dc"/>
    <Camera close={close}/>
    <Suspense fallback={null}><Character {...motion} onReady={onReady}/></Suspense>
  </Canvas>;
}
