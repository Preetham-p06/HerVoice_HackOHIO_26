"use client";
import { Component, useCallback, useEffect, useState, type ReactNode } from "react";
import { ZoomIn, ZoomOut, Pause, Play, Image as ImageIcon } from "lucide-react";
import dynamic from "next/dynamic";
import type { AvatarMotion } from "./AvatarScene";
const Scene=dynamic(() => import("./AvatarScene"),{ssr:false});
class AvatarBoundary extends Component<{children:ReactNode; fallback:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed ? this.props.fallback : this.props.children;}
}
export default function Companion({ speaking, expression, busy, level, audio, cues }: Omit<AvatarMotion, "paused"> & { busy: boolean; mouthShape?: string }) {
  const [close, Close]=useState(false);
  const [still, Still]=useState(false);
  const [paused, Paused]=useState(false);
  const [ready, Ready]=useState(false);
  useEffect(() => {
    const preference=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>Paused(preference.matches);update();
    preference.addEventListener("change",update);
    try { const probe=document.createElement("canvas"); if(!probe.getContext("webgl2")) Still(true); } catch { Still(true); }
    return ()=>preference.removeEventListener("change",update);
  },[]);
  const onReady=useCallback(()=>Ready(true),[]);
  const portrait=<img className={close ? "portrait close" : "portrait"} src="/images/companion-maya.png" alt="Maya, an original illustrated female AI companion in a blue shirt" width={1024} height={1536}/>;
  return <div className={"companion portrait-companion animated-companion"+(speaking ? " is-speaking" : "")} data-avatar-state={still ? "still" : ready ? "ready" : "loading"}>
    <div className="companion-name"><span className="eyebrow">YOUR AI COMPANION</span><strong>Maya</strong><small>One moment at a time.</small></div>
    <div className="portrait-halo" />
    {still ? portrait : <AvatarBoundary fallback={<div className="avatar-fallback">{portrait}<span>3D is unavailable here. Text and voice still work.</span></div>}>
      <div className="avatar-canvas" role="img" aria-label="Maya, an animated 3D AI companion">
        <Scene speaking={speaking} expression={expression} paused={paused} level={level} audio={audio} cues={cues} close={close} onReady={onReady}/>
      </div>
      {!ready && <p className="avatar-loading" role="status">Getting Maya ready…</p>}
    </AvatarBoundary>}
    <div className="avatar-controls">
      <button onClick={()=>Close(!close)} aria-label={close ? "Zoom out companion" : "Zoom in companion"}>{close ? <ZoomOut size={19}/> : <ZoomIn size={19}/>}</button>
      {!still && <button onClick={()=>Paused(!paused)} aria-label={paused ? "Resume animation" : "Pause animation"}>{paused ? <Play size={19}/> : <Pause size={19}/>}</button>}
      <button onClick={()=>Still(!still)} aria-label={still ? "Show 3D companion" : "Show still image"}><ImageIcon size={19}/></button>
    </div>
    <div className="companion-caption" role="status"><span className="voice-bars" aria-hidden="true"><i/><i/><i/><i/></span>{speaking ? "Speaking" : busy ? "Taking a moment to reply" : "Ready when you are"}</div>
    <small className="portrait-note">AI companion · not a therapist</small>
    <a className="avatar-credit" href="/models/maya-studio.LICENSE.txt" target="_blank" rel="noreferrer">Avatar credits</a>
  </div>;
}
