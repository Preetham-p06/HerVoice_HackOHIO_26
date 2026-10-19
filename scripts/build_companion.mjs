/** Original HerVoice character. Regenerates the bundled GLB; no external assets. */
import * as T from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { writeFileSync } from 'node:fs';
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(buffer => { this.result=buffer; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(buffer => { this.result='data:'+blob.type+';base64,'+Buffer.from(buffer).toString('base64'); this.onloadend?.(); }); }
};
const scene=new T.Scene();
const root=new T.Group();root.name='Maya';scene.add(root);
const skin=new T.MeshStandardMaterial({color:'#b77955',roughness:.72});
const hair=new T.MeshStandardMaterial({color:'#30201e',roughness:.75});
const shirt=new T.MeshStandardMaterial({color:'#7ba6d2',roughness:.86});
const collar=new T.MeshStandardMaterial({color:'#b4cfe8',roughness:.8,side:T.DoubleSide});
const white=new T.MeshStandardMaterial({color:'#fff4e7',roughness:.5});
const iris=new T.MeshStandardMaterial({color:'#493026',roughness:.6});
const pupil=new T.MeshStandardMaterial({color:'#151a21',roughness:.5});
const lip=new T.MeshStandardMaterial({color:'#874843',roughness:.7});
const mouth=new T.MeshStandardMaterial({color:'#331f23',roughness:.9});
const head=new T.Group();head.name='Head';head.position.y=1.7;root.add(head);
function ellipsoid(parent,name,pos,scale,material,morphs={}) {
 const g=new T.SphereGeometry(1,40,28);g.scale(...scale);
 const attr=g.attributes.position;
 const names=Object.keys(morphs);
 if(names.length) {
  g.morphTargetsRelative=true;
  g.morphAttributes.position=names.map(name=>{
   const v=new Float32Array(attr.count*3);
   for(let i=0;i<attr.count;i++){
    const a=new T.Vector3().fromBufferAttribute(attr,i);
    const b=morphs[name](a.clone());
    v.set([b.x-a.x,b.y-a.y,b.z-a.z],i*3);
   }
   const target=new T.Float32BufferAttribute(v,3);target.name=name;return target;
  });
 }
 const mesh=new T.Mesh(g,material);mesh.name=name;mesh.position.set(...pos);parent.add(mesh);return mesh;
}
function curve(parent,name,points,radius,material){
 const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),32,radius,8,false);
 const m=new T.Mesh(g,material);m.name=name;parent.add(m);return m;
}
ellipsoid(root,'Blouse',[0,.42,0],[.57,.70,.28],shirt);
for(const sign of [-1,1]){
 const arm=ellipsoid(root,'Sleeve'+sign,[sign*.56,.36,0],[.145,.59,.16],shirt);arm.rotation.z=sign*.1;
 ellipsoid(root,'Hand'+sign,[sign*.62,-.17,.07],[.12,.20,.10],skin);
}
ellipsoid(root,'Neck',[0,1.12,0],[.13,.27,.13],skin);
ellipsoid(head,'HairBack',[0,.07,-.13],[.38,.51,.29],hair);
ellipsoid(head,'Face',[0,0,0],[.335,.45,.295],skin,{
 jawOpen:v=>{if(v.y<-.18) v.y-=.025*Math.min(1,(-v.y-.18)/.2);return v;}
});
for(const sign of [-1,1]){
 ellipsoid(head,'Ear'+sign,[sign*.329,-.045,-.01],[.06,.10,.045],skin);
 ellipsoid(head,'Earring'+sign,[sign*.35,-.14,.015],[.022,.026,.014],collar);
 // Separate eye surfaces carry actual eyelid/blink morph targets.
 const blink=v=>{v.y*=.025;return v;};
 ellipsoid(head,'EyeWhite'+sign,[sign*.135,.065,.265],[.091,.060,.035],white,{blink});
 ellipsoid(head,'Iris'+sign,[sign*.135,.062,.296],[.043,.045,.012],iris,{blink});
 ellipsoid(head,'Pupil'+sign,[sign*.135,.062,.306],[.022,.030,.008],pupil,{blink});
 ellipsoid(head,'EyeGlint'+sign,[sign*.135-.012,.079,.313],[.009,.010,.004],white,{blink});
 curve(head,'Brow'+sign,[[sign*.22,.16,.254],[sign*.145,.185,.28],[sign*.065,.17,.27]],.014,hair);
 curve(head,'Lash'+sign,[[sign*.22,.072,.288],[sign*.14,.116,.291],[sign*.05,.078,.288]],.007,hair);
}
ellipsoid(head,'Nose',[0,-.055,.287],[.045,.073,.050],skin);
ellipsoid(head,'Mouth',[0,-.205,.252],[.089,.010,.025],mouth,{
 jawOpen:v=>{v.y=v.y*5-.026;return v;},
 mouthSmile:v=>{v.y+=Math.pow(v.x/.089,2)*.018;v.x*=1.08;return v;},
 mouthFunnel:v=>{v.x*=.62;v.y*=2.2;v.z+=.012;return v;}
});
ellipsoid(head,'UpperLip',[0,-.195,.273],[.091,.012,.015],lip,{
 mouthSmile:v=>{v.y+=Math.pow(v.x/.091,2)*.019;v.x*=1.08;return v;},
 mouthFunnel:v=>{v.x*=.65;v.z+=.015;return v;}
});
ellipsoid(head,'LowerLip',[0,-.217,.269],[.080,.015,.016],lip,{
 jawOpen:v=>{v.y-=.056;return v;},
 mouthSmile:v=>{v.y+=Math.pow(v.x/.08,2)*.019;return v;},
 mouthFunnel:v=>{v.x*=.65;v.z+=.015;return v;}
});
ellipsoid(head,'HairCap',[0,.34,-.025],[.34,.20,.28],hair);
ellipsoid(head,'HairBun',[-.055,.51,-.17],[.22,.21,.19],hair);
for(let i=0;i<5;i++){
 curve(head,'SweptHair'+i,[[-.30,.12+i*.025,.13],[-.24,.34+i*.018,.22],[.01,.44+i*.012,.16],[.22,.30+i*.014,.05]],.038,hair);
}
for(const sign of [-1,1]){
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([sign*.04,1.16,.16,sign*.27,1.02,.25,sign*.14,.82,.28],3));geo.computeVertexNormals();
 const m=new T.Mesh(geo,collar);m.name='Collar'+sign;root.add(m);
}
for(let i=0;i<5;i++)ellipsoid(root,'Button'+i,[0,.77-i*.17,.279],[.014,.014,.008],white);
function rotationTrack(times, rotations) {
 return new T.QuaternionKeyframeTrack('Head.quaternion',times,rotations.flatMap(r=>new T.Quaternion().setFromEuler(new T.Euler(...r)).toArray()));
}
const idle=new T.AnimationClip('Idle',6,[rotationTrack([0,1.5,3,4.5,6],[[0,0,0],[0,0,.018],[0,0,0],[0,0,-.018],[0,0,0]])]);
const talking=new T.AnimationClip('Talking',2.4,[rotationTrack([0,.6,1.2,1.8,2.4],[[0,0,0],[.025,0,-.018],[0,0,0],[-.012,0,.018],[0,0,0]])]);
root.userData={author:'HerVoice',description:'Original stylized Maya companion with mouth and blink morph targets. Not a clinical professional.'};
const out=await new GLTFExporter().parseAsync(scene,{binary:true,animations:[idle,talking],onlyVisible:true});
writeFileSync(new URL('../apps/web/public/models/maya.glb',import.meta.url),Buffer.from(out));
console.log('Built original Maya GLB:',out.byteLength,'bytes');
