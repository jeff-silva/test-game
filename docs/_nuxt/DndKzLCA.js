import{_ as y}from"./CGr-aiBZ.js";import{f as k,T as w,S as v,P as M,C as z,W as L}from"./oSmP2IjT.js";import{G as E}from"./F7f5gjRj.js";import{P as S,a as x,A as _}from"./FC848D23.js";import{q as C,n as P,m as R,w as T,o as j,a as d,s as p,t as h}from"./BOLl47Qg.js";const H=(f={})=>{let o,n,t,r,l;const e=C({el:null,models:{},onInit:()=>null,onUpdate:()=>null,onResize:()=>null,onInput:a=>null,onLockChange:()=>null,...f,size:{width:null,height:null,sync(){e.size.width=e.el.offsetWidth,e.size.height=e.el.offsetHeight}},pointerLock:new class{constructor(){this.instance=null,this.locked=!1}init(){return new Promise((a,g)=>{this.instance=new S(n,e.el),this.instance.pointerSpeed=.4,this.instance.addEventListener("lock",()=>{this.locked=!0,e.onLockChange(e.getScope({locked:!0}))}),this.instance.addEventListener("unlock",()=>{this.locked=!1,e.onLockChange(e.getScope({locked:!1}))}),a()})}lock(){this.instance.lock()}},loadingManager:new class{constructor(){this.progress=0,this.instance=new k}init(){return new Promise((a,g)=>{const m={gltf(s,i,c){return new E(c).load(i.url,u=>{e.models[s].loaded=!0,e.models[s].content=u,typeof i.onLoad=="function"&&i.onLoad(e.getScope({gltf:u}))})}};this.instance.onProgress=(s,i,c)=>{let u=i/c*100;e.loadingManager.progress=u},this.instance.onLoad=()=>{e.ready=!0,e.size.sync(),t.setSize(e.size.width,e.size.height),e.onInit(e.getScope()),e.update(),a()},Object.entries(e.models).map(([s,i])=>{e.models[s].name=s,e.models[s].loaded=!1;const c=i.url.split("?").at(0).split(".").at(-1);m[c](s,i,this.instance)})})}},getScope(a={}){return{THREE:w,scene:o,camera:n,renderer:t,clock:r,physics:l,...e,...a}},init(){return new Promise(async(a,g)=>{x("/assets/threejs/ammo",async()=>{e.el=document.querySelector(e.el),e.size.sync(),o=new v,n=new M(50,e.size.width/e.size.height,1,1e3),r=new z,l=new _(o),l.debug.enable(),l.debug.mode(1),t=new L({antialias:!0}),e.el.appendChild(t.domElement),t.domElement.style.width="100%",t.domElement.style.height="100%",await e.loadingManager.init(),await e.pointerLock.init(),["keyup","keydown"].map(m=>{document.addEventListener(m,s=>{e.onInput(e.getScope({event:s}))})}),window.addEventListener("resize",m=>{e.resize()}),a()})})},update(){const a=()=>{l.updateDebugger(),l.update(r.getDelta()*1e3),t.render(o,n),e.onUpdate(e.getScope()),requestAnimationFrame(a)};requestAnimationFrame(a)},resize(){e.size.sync(),n.aspect=e.size.width/e.size.height,n.updateProjectionMatrix(),t.setSize(e.size.width,e.size.height),e.onResize(e.getScope())}});return P(async()=>{e.init()}),e},q={__name:"test-01",setup(f){const o=H({el:"#app-index",models:{scene:{url:"/assets/threejs/models/low-poly-level/scene.gltf",onLoad(n){n.scene.add(n.gltf.scene),n.physics.add.existing(n.gltf.scene,{mass:0,shape:"convex"});const t=new n.THREE.CylinderGeometry(.5,.5,1,32),r=new n.THREE.MeshBasicMaterial({color:16776960});n.cameraMove.collision=new n.THREE.Mesh(t,r),n.cameraMove.collision.position.x-=2,n.scene.add(n.cameraMove.collision),n.physics.add.existing(n.cameraMove.collision,{mass:0,shape:"cylinder"}),console.clear(),console.log(n.camera),console.log(n.cameraMove.collision)}}},cameraMove:{collision:null,front:0,left:0},onInput(n){this.moveWASD(n)},moveWASD(n){const{event:t}=n;t.type=="keydown"&&t.key=="w"&&(o.cameraMove.front=1),t.type=="keyup"&&t.key=="w"&&(o.cameraMove.front=0),t.type=="keydown"&&t.key=="s"&&(o.cameraMove.front=-1),t.type=="keyup"&&t.key=="s"&&(o.cameraMove.front=0),t.type=="keydown"&&t.key=="a"&&(o.cameraMove.left=-1),t.type=="keyup"&&t.key=="a"&&(o.cameraMove.left=0),t.type=="keydown"&&t.key=="d"&&(o.cameraMove.left=1),t.type=="keyup"&&t.key=="d"&&(o.cameraMove.left=0)},onInit(n){o.cameraMove.direction=new n.THREE.Vector3},onUpdate(n){const t=n.clock.getDelta();n.pointerLock.instance.moveForward(o.cameraMove.front/20,t),n.pointerLock.instance.moveRight(o.cameraMove.left/20,t)}});return(n,t)=>{const r=y;return j(),R(r,{name:"main"},{default:T(()=>[d("div",{ref:"canvasRef",id:"app-index",style:{width:"100%",height:"400px"},onClick:t[0]||(t[0]=()=>{p(o).pointerLock.lock()})},null,512),t[1]||(t[1]=d("a",{href:""},"refresh",-1)),d("pre",null,"motor.loadingManager: "+h(p(o).loadingManager),1),d("pre",null,"motor.cameraMove: "+h(p(o).cameraMove),1),d("pre",null,"motor.size: "+h(p(o).size),1)]),_:1})}}};export{q as default};
