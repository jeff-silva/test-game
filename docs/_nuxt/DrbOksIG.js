var x=Object.defineProperty;var v=(d,e,t)=>e in d?x(d,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):d[e]=t;var n=(d,e,t)=>v(d,typeof e!="symbol"?e+"":e,t);import{u as C}from"./DdYu8N3N.js";import{O as c}from"./D3Mqfikn.js";import{T as M,S as A,C as b,W as k,f as R,P as S,g as y,E as B,O as P,M as E,h as D,B as L,i as T,L as G,c as U,d as j,e as f}from"./OOJU6yUV.js";import{G as F}from"./D-qi7e-V.js";import{O as I}from"./BpBuCxSc.js";const _=class{constructor(e={}){n(this,"options",{el:null,debug:!1});n(this,"canvas",{el:null,width:0,height:0});n(this,"scene",null);n(this,"camera",null);n(this,"clock",null);n(this,"renderer",null);n(this,"debug",null);n(this,"world",null);n(this,"THREE",null);n(this,"RAPIER",null);n(this,"physics",null);n(this,"events",[]);n(this,"scripts",[]);n(this,"input",{mouse:{click:{x:0,y:0},movement:{x:0,y:0},offset:{x:0,y:0}},keyboard:{},joystick:{}});this.options={el:null,...e},this.THREE=M,this.RAPIER=c}init(){return new Promise((e,t)=>{setTimeout(async()=>{await c.init(),await this.initCanvas(),await this.initThreejs(),await this.initRapier(),await this.initPreload(),await this.initCanvas(),await this.initInputEvents(),await this.initUpdate(),e({})},10)})}destroy(){this.dispatch("destroy")}async initCanvas(){this.canvas.el||(this.canvas.el=document.querySelector(this.options.el),window.addEventListener("resize",async()=>{await this.initCanvas()})),this.canvas.el&&(this.canvas.width=this.canvas.el.offsetWidth,this.canvas.height=this.canvas.el.offsetHeight),this.camera&&(this.camera.aspect=this.canvas.width/this.canvas.height,this.camera.updateProjectionMatrix()),this.renderer&&this.renderer.setSize(this.canvas.width,this.canvas.height)}async initThreejs(){this.scene||(this.scene=new A,this.scene.name=this.scene.name||"Main Scene"),this.camera||(this.camera=this.cameraDefault()),this.clock||(this.clock=new b),this.renderer||(this.renderer=new k({antialias:!0}),this.canvas.el.innerHTML="",this.canvas.el.style.position="relative",this.canvas.el.style.minHeight="100px",this.canvas.el.appendChild(this.renderer.domElement),this.renderer.domElement.style.width="100%",this.renderer.domElement.style.height="100%")}async initRapier(){this.physics=new W({debug:this.options.debug,scene:this.scene})}initPreload(){return new Promise((e,t)=>{const i=C(),s=Object.assign(new R,{onProgress:(a,r,h)=>{const u=r/h*100;this.dispatch("loadProgress",{progress:u,url:a,itemsLoaded:r,itemsTotal:h})},onLoad:()=>{this.dispatch("loadSuccess"),e()}}),o={gltf:a=>new F(s).load(a.url,r=>{a.loaded=!0,a.model=r,a.onLoad(a)})};let l=this.preload();Object.entries(l).map(([a,r])=>{if(r={name:a,onLoad:()=>null,...r,ext:r.url.split("?").at(0).split(".").at(-1),loaded:!1,model:null},!r.url.startsWith("http")){const h=new URL(location.href),u=r.url;r.url=h.origin,i.app.baseURL&&(i.app.baseURL.startsWith("/")||(r.url+="/"),r.url+=i.app.baseURL,!i.app.baseURL.endsWith("/")&&!u.startsWith("/")&&(r.url+="/"),r.url+=u)}typeof o[r.ext]=="function"&&o[r.ext](r)})})}async initInputEvents(){let e=[{type:"mouse",name:"click"},{type:"mouse",name:"mouseenter"},{type:"mouse",name:"mouseleave"},{type:"mouse",name:"mousemove"},{type:"mouse",name:"pointermove"},{type:"mouse",name:"pointerdown"},{type:"mouse",name:"pointerout"},{type:"mouse",name:"pointerlockchange"},{type:"keyboard",name:"keyup"},{type:"keyboard",name:"keydown"}];const t=(s,o)=>{["input",`input.${o.type}`,`input.${s.type}`].map(a=>{if(this.dispatch(a,s),s.type=="keydown"&&(this.input.keyboard[s.key]=!0,this.input.keyboard[s.code]=!0,this.input.keyboard[s.keyCode]=!0),s.type=="keyup"&&(this.input.keyboard[s.key]=null,this.input.keyboard[s.code]=null,this.input.keyboard[s.keyCode]=null),s.type=="click"&&(this.input.mouse.click.x=s.offsetX,this.input.mouse.click.y=s.offsetY),["mousemove","pointermove"].includes(s.type))for(let r in this.input.mouse)typeof s[`${r}X`]>"u"||(this.input.mouse[r].x=s[`${r}X`],this.input.mouse[r].y=s[`${r}Y`])})};let i=[];e.map(s=>{const o=l=>t(l,s);i.push({...s,handler:o})}),i.map(s=>{document.addEventListener(s.name,s.handler)}),this.on("destroy",()=>{i.map(s=>{document.removeEventListener(s.name,s.handler)})})}async initUpdate(){this.onCreate(),this.dispatch("create");const e=()=>{this.onUpdate(),this.dispatch("update"),this.scripts.map(t=>{t.onUpdate()}),this.physics.update(),this.renderer.render(this.scene,this.camera),requestAnimationFrame(e)};requestAnimationFrame(e)}preload(){return{}}on(e,t){this.events.push({name:e,callback:t})}dispatch(...e){const t=e,i=t.shift();this.events.filter(s=>s.name==i).map(({name:s,callback:o})=>{o.apply(this,t)}),this.parent&&this.parent.dispatch(...e)}cameraDefault(){const{width:e,height:t}=this.canvas;return new S(50,e/t,1,1e3)}getOrbitControls(e=null,t=null){e=e||this.camera,t=t||this.renderer;const i=new I(e,t.domElement);return this.on("update",()=>{i.update()}),i}getPointerLockControls(e={}){const t=new Proxy({target:null,pointerSpeed:1,minPolarAngle:0,maxPolarAngle:Math.PI,updateAxisX:!0,updateAxisY:!0,...e,locked:!1,script:this,lock(){this.script.canvas.el.requestPointerLock()},moveForward(i){const s=t.target,o=new y;o.setFromMatrixColumn(s.matrix,0),o.crossVectors(s.up,o),s.position.addScaledVector(o,i)},moveRight(i){const s=t.target,o=new y;o.setFromMatrixColumn(s.matrix,0),s.position.addScaledVector(o,i)}},{get(i,s){return s=="locked"?!!document.pointerLockElement:i[s]}});return this.on("input.click",i=>{(this.canvas.el==i.target||this.canvas.el.contains(i.target))&&t.lock()}),this.on("input.pointermove",i=>{if(!t.locked||!t.target)return;const s=Math.PI/2,o=t.target,l=.002*t.pointerSpeed,a=new B(0,0,0,"YXZ");a.setFromQuaternion(o.quaternion),t.updateAxisY&&(a.y-=i.movementX*l),t.updateAxisX&&(a.x-=i.movementY*l,a.x=Math.max(s-t.maxPolarAngle,Math.min(s-t.minPolarAngle,a.x))),o.quaternion.setFromEuler(a)}),t}scriptAttach(e,t){t.object=e,t.scene=this,this.scripts.push(t),t.onCreate()}addPhysics(e){let t={};t.mesh=new P,t.body=void 0,t.shape=c.ColliderDesc.cuboid(.5,.5,.5).setMass(1).setRestitution(1.1),t=e(t),this.scene.add(t.mesh),this.physics.dynamicBodyAdd(t)}basicMeshPhysicsAdd(e={}){e={geometry:{},position:{x:0,y:0,z:0},material:{},body:{},...e},e.geometry=new g().optionsMerge(e.geometry||{});const t=new g(e.geometry).get();e.material=new w().optionsMerge(e.material||{});const i=new w(e.material).get();e.body=new p().optionsMerge(e.body||{});const s=new p(e.body).get(),o=new O(e.geometry).get();let l={};return l.mesh=new E(t,i),l.mesh.position.set(e.position.x,e.position.y,e.position.z),l.body=this.physics.world.createRigidBody(s.setCanSleep(e.body.canSleep).setTranslation(e.position.x,e.position.y,e.position.z)),l.shape=o.setMass(e.body.mass).setRestitution(e.body.restitution),this.scene.add(l.mesh),this.physics.dynamicBodyAdd(l),l}coplexPhysicsAttach(e,t={}){t.body=new p().optionsMerge(t.body||{});let i={mesh:e};console.log(JSON.stringify(t,null,2)),i.body=this.physics.world.createRigidBody(new p(t.body).get());let s=[],o=[];return e.traverse(l=>{if(!l.isMesh)return;const a=l.geometry.clone();a.applyMatrix4(l.matrixWorld),a.computeVertexNormals(),s=[...s,...a.attributes.position.array],o=[...o,...a.index.array]}),s=new Float32Array(s),o=new Uint32Array(o),i.shape=c.ColliderDesc.trimesh(new Float32Array(s),new Uint32Array(o)).setActiveEvents(c.ActiveEvents.COLLISION_EVENTS),this.physics.dynamicBodyAdd(i),i}onCreate(){}onUpdate(){}},N=class{constructor(){n(this,"object",null);n(this,"scene",null)}onCreate(){}onUpdate(){}};class m{constructor(e={}){n(this,"name","Format base");n(this,"options",{});this.options=this.optionsMerge(e)}optionsDefault(){return{type:null}}optionsMerge(e={}){return{...this.optionsDefault(),...e}}typesMethods(){return{default:()=>null}}typesArgs(){return{default:[]}}typeMethodGet(){const e=this.typesMethods();if(typeof e[this.options.type]>"u")throw new Error(`${this.name} "${this.options.type}" does not exists`);return e[this.options.type]}typeArgsGet(){const e=this.typesArgs();if(typeof e[this.options.type]>"u")throw new Error(`${this.name}: Argument "${this.options.type}" does not exists`);return e[this.options.type]}typeMethodCall(...e){return this.typeMethodGet()(...e)}get(){const e=this.typeMethodGet(),t=this.typeArgsGet();return e(...t)}}class g extends m{constructor(){super(...arguments);n(this,"name","Three Geometry")}optionsDefault(){return{type:null,radius:1,length:1,capSegments:4,radialSegments:8,width:1,height:1,depth:1}}typesMethods(){return{capsule:(...t)=>new D(...t),cube:(...t)=>new L(...t)}}typesArgs(){return{capsule:[this.options.radius,this.options.length,this.options.capSegments,this.options.radialSegments],cube:[this.options.width,this.options.height,this.options.depth]}}}class w extends m{constructor(){super(...arguments);n(this,"name","Three Material")}optionsDefault(){return{type:"basic",color:16777215}}typesMethods(){return{basic:(...t)=>new T(...t)}}typesArgs(){return{basic:[{...this.options,type:void 0}]}}}class O extends m{constructor(){super(...arguments);n(this,"name","Rapier Shape")}optionsDefault(){return new g().optionsDefault()}typesMethods(){return{capsule:(...t)=>c.ColliderDesc.capsule(...t),cube:(...t)=>c.ColliderDesc.cuboid(...t),trimesh:(...t)=>c.ColliderDesc.trimesh(...t)}}typesArgs(){return{capsule:[this.options.length/2,this.options.radius],cube:[this.options.width/2,this.options.height/2,this.options.depth/2],trimesh:[]}}}class p extends m{constructor(){super(...arguments);n(this,"name","Rapier Body")}optionsDefault(){return{type:"dynamic",mass:1,restitution:1,canSleep:!1}}typesMethods(){return{fixed:(...t)=>c.RigidBodyDesc.fixed(...t),dynamic:(...t)=>c.RigidBodyDesc.dynamic(...t)}}typesArgs(){return{fixed:[],dynamic:[]}}}const $=class{constructor(e,t){n(this,"mesh");n(this,"world");n(this,"enabled",!0);this.world=t,this.mesh=new G(new U,new j({color:16777215,vertexColors:!0})),this.mesh.frustumCulled=!1,e.add(this.mesh)}update(){if(this.enabled){const{vertices:e,colors:t}=this.world.debugRender();this.mesh.geometry.setAttribute("position",new f(e,3)),this.mesh.geometry.setAttribute("color",new f(t,4)),this.mesh.visible=!0}else this.mesh.visible=!1}};class W{constructor(e={}){n(this,"debug",!1);n(this,"clock",null);n(this,"scene",null);n(this,"world",null);n(this,"dynamicBodies",[]);e={debug:!1,scene:null,...e},this.clock=new b,this.scene=e.scene,this.world=new c.World({x:0,y:-9.81,z:0}),e.debug&&(this.debug=new $(e.scene,this.world))}update(){this.dynamicBodies.map(({mesh:t,body:i,shape:s})=>{i&&(typeof i.translation=="function"&&t.position.copy(i.translation()),typeof i.rotation=="function"&&t.quaternion.copy(i.rotation()))}),this.debug&&this.world&&this.debug.update();const e=this.clock.getDelta();this.world.timestep=Math.min(e,.1),this.world.step()}dynamicBodyAdd({mesh:e,body:t,shape:i}){const s=this.world.createCollider(i,t);this.dynamicBodies.push({collider:s,mesh:e,body:t,shape:i})}characterController(){return new class{constructor(e){n(this,"parent",null);n(this,"controller",null);n(this,"collider",null);this.parent=e,this.collider=(()=>{let t=new c.RigidBodyDesc(c.RigidBodyType.KinematicPositionBased),i=e.world.createRigidBody(t),s=new c.ColliderDesc(new c.Cuboid(.5,.5,.5));return e.world.createCollider(s,i)})(),this.controller=e.world.createCharacterController(.01),this.controller.setSlideEnabled(!0),this.controller.setMaxSlopeClimbAngle(45*Math.PI/180),this.controller.setMinSlopeSlideAngle(30*Math.PI/180),this.controller.enableAutostep(.5,.2,!0),this.controller.enableSnapToGround(.5),this.controller.setApplyImpulsesToDynamicBodies(!0),this.controller.setCharacterMass(1)}move(e){let t=parent.world.createRigidBody(new c.RigidBodyDesc(c.RigidBodyType.KinematicPositionBased));const i=parent.world.createCollider(new c.ColliderDesc(new c.Cuboid(.5,.5,.5)),t);let s=new y;s.x+=1,this.controller.computeColliderMovement(i,s);for(var o=0;o<controller.numComputedCollisions();o++)controller.computedCollision(o);movement.copy(controller.computedMovement()),nextTranslation.copy(t.translation()),nextTranslation.add(movement),t.setNextKinematicTranslation(nextTranslation)}}(this)}}export{_ as S,N as a};
