const interfaceLabels = document.documentElement.lang.startsWith('zh') ? {
  'Open menu': '打开菜单', 'Close menu': '关闭菜单', 'Play': '播放', 'Pause': '暂停',
  'Start automatic publication rotation': '开始论文自动轮播',
  'Pause automatic publication rotation': '暂停论文自动轮播',
  'Start automatic photograph rotation': '开始照片自动轮播',
  'Pause automatic photograph rotation': '暂停照片自动轮播'
} : {};
const ui = text => interfaceLabels[text] || text;

document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#hamburger');
  const menu = document.querySelector('#mobile-nav');
  if (!button || !menu) return;
  const setOpen = (open, focus = false) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', ui(open ? 'Close menu' : 'Open menu'));
    if (focus) button.focus();
  };
  button.addEventListener('click', () => setOpen(menu.hidden));
  document.addEventListener('click', event => {
    if (!menu.hidden && !menu.contains(event.target) && !button.contains(event.target)) setOpen(false);
  });
  menu.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) setOpen(false, true); });
  const desktop = window.matchMedia('(min-width: 1301px)');
  desktop.addEventListener('change', event => { if (event.matches) setOpen(false); });
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-publication-carousel]').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('.research-paper')];
    const controls = carousel.querySelector('.paper-controls');
    const toggle = carousel.querySelector('[data-paper-toggle]');
    const count = carousel.querySelector('.paper-count');
    let index = 0;
    let paused = false;
    let visible = false;
    let timer;
    const schedule = () => {
      clearTimeout(timer);
      toggle.textContent = ui(paused ? 'Play' : 'Pause');
      toggle.setAttribute('aria-label', ui(paused ? 'Start automatic publication rotation' : 'Pause automatic publication rotation'));
      if (!paused && visible && !document.hidden) {
        timer = setTimeout(() => show(index + 1), 4000);
      }
    };
    const show = next => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
        slide.setAttribute('aria-hidden', String(i !== index));
        slide.inert = i !== index;
      });
      count.textContent = `${index + 1} / ${slides.length}`;
      schedule();
    };
    carousel.classList.add('is-enhanced');
    controls.hidden = false;
    carousel.querySelector('[data-paper-prev]').addEventListener('click', () => show(index - 1));
    carousel.querySelector('[data-paper-next]').addEventListener('click', () => show(index + 1));
    toggle.addEventListener('click', () => { paused = !paused; schedule(); });
    document.addEventListener('visibilitychange', schedule);
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      schedule();
    }, {threshold:0.25}).observe(carousel);
    show(0);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  // Discourage direct saving without interfering with carousel gestures.
  // Visible web images remain accessible through screenshots and browser tools.
  document.querySelectorAll('.gallery-photos').forEach(stage => {
    stage.addEventListener('contextmenu', event => {
      if (event.target.closest('.gallery-photo')) event.preventDefault();
    });
    stage.addEventListener('dragstart', event => {
      if (event.target.closest('.gallery-photo img')) event.preventDefault();
    });
  });
  document.querySelectorAll('[data-gallery-carousel]').forEach(carousel => {
    const stage = carousel.querySelector('.gallery-photos');
    const slides = [...stage.querySelectorAll('.gallery-photo')];
    if (slides.length < 2) return;
    const controls = carousel.querySelector('.gallery-controls');
    const toggle = carousel.querySelector('[data-gallery-toggle]');
    const count = carousel.querySelector('.gallery-count');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Matching end slides let both directions wrap without a visible rewind.
    const makeLoopSlide = slide => {
      const copy = slide.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      copy.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      return copy;
    };
    stage.prepend(makeLoopSlide(slides[slides.length - 1]));
    stage.append(makeLoopSlide(slides[0]));
    let index = 0, paused = false, timer;
    const schedule = () => {
      clearTimeout(timer);
      toggle.textContent = ui(paused ? 'Play' : 'Pause');
      toggle.setAttribute('aria-label', ui(paused ? 'Start automatic photograph rotation' : 'Pause automatic photograph rotation'));
      if (!paused && !document.hidden) {
        timer = setTimeout(() => show(index + 1), 4000);
      }
    };
    const update = () => {
      if (!stage.clientWidth) return;
      index = Math.round(stage.scrollLeft / stage.clientWidth) - 1;
      if (index < 0 || index >= slides.length) {
        index = (index + slides.length) % slides.length;
        stage.scrollTo({left: (index + 1) * stage.clientWidth, behavior: 'instant'});
      }
      count.textContent = `${index + 1} / ${slides.length}`;
    };
    const show = next => {
      index = Math.max(-1, Math.min(slides.length, next));
      stage.scrollTo({left: (index + 1) * stage.clientWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
      count.textContent = `${(index + slides.length) % slides.length + 1} / ${slides.length}`;
      schedule();
    };
    carousel.classList.add('is-enhanced');
    controls.hidden = false;
    toggle.addEventListener('click', () => { paused = !paused; schedule(); });
    carousel.querySelector('[data-gallery-prev]').addEventListener('click', () => show(index - 1));
    carousel.querySelector('[data-gallery-next]').addEventListener('click', () => show(index + 1));
    let activePointer = null;
    stage.addEventListener('pointerdown', event => {
      activePointer = event.pointerId;
      clearTimeout(timer);
    });
    // A drag can finish outside the photograph; resume there as well.
    const finishPointer = event => {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
      schedule();
    };
    document.addEventListener('pointerup', finishPointer);
    document.addEventListener('pointercancel', finishPointer);
    stage.addEventListener('scrollend', () => { update(); schedule(); });
    carousel.addEventListener('focusin', schedule);
    carousel.addEventListener('focusout', schedule);
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', schedule);
    new ResizeObserver(() => { stage.scrollTo({left: (index + 1) * stage.clientWidth, behavior: 'instant'}); update(); }).observe(stage);
    stage.scrollTo({left: stage.clientWidth, behavior: 'instant'});
    update();
    schedule();
  });
});

// Original conceptual neural network with a single synthetic extracellular spike trace.
// This is decorative, not a visualization of experimental recordings.
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('#neural-background');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const spikeCanvas = document.querySelector('#hero-spike');
  const spikeCtx = spikeCanvas?.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, nodes = [], paths = [], trace, stars = [];
  let spikeWidth=0,spikeHeight=0;
  let frame = 0, elapsed = 0, previous = 0;
  let motionReduced = reducedMotion.matches;
  let editing = document.body.classList.contains('is-editing');
  const TAU = Math.PI * 2;
  // Stable layout, regenerated only when the viewport changes.
  function randomGenerator(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function curve(a, b, bend) {
    return {a, b, c: {x:(a.x+b.x)/2 + (b.y-a.y)*bend,
                     y:(a.y+b.y)/2 - (b.x-a.x)*bend}};
  }
  function strokePath(path) {
    ctx.beginPath(); ctx.moveTo(path.a.x,path.a.y);
    ctx.quadraticCurveTo(path.c.x,path.c.y,path.b.x,path.b.y); ctx.stroke();
  }
  function layout() {
    width = window.innerWidth; height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const random = randomGenerator(4108);
    const count = Math.min(90, Math.max(36,Math.round(width*height/14000)));
    stars = Array.from({length:Math.min(100,count*2)}, () => ({
      x:random()*width, y:random()*height, radius:random()*1.1+.25, phase:random()*TAU
    }));
    nodes = Array.from({length:count}, (_,i) => ({
      // Extend the tissue behind the glass bar so its transparency is visible.
      x:(.035+random()*.93)*width, y:(.02+random()*.9)*height,
      phase:random()*TAU, radius:1.6+random()*1.8, index:i,
      branches:Array.from({length:3+Math.floor(random()*3)}, () => ({
        angle:random()*TAU,length:18+random()*32,bend:random()-.5
      }))
    }));
    paths = [];
    const maxDistance = Math.min(310,Math.max(155,width*.23));
    nodes.forEach((node,i) => {
      const nearest = nodes.filter(other=>other.index>i)
        .map(other=>({other,distance:Math.hypot(other.x-node.x,other.y-node.y)}))
        .filter(pair=>pair.distance<maxDistance)
        .sort((a,b)=>a.distance-b.distance).slice(0,2);
      nearest.forEach(({other})=>paths.push({
        ...curve(node,other,(random()-.5)*.5),phase:random()*9,duration:7+random()*6
      }));
    });
    // One shared event clock drives the trace and the network discharges.
    // The visual clock is deliberately slowed and is not calibrated lab data.
    trace = {events:[],cycle:48,span:6,head:.84,stretch:.16};
    const eventRandom=randomGenerator(7121);
    let flashPaths=paths.filter((path,i)=>i%3===0 &&
      (Math.abs((path.a.x+path.b.x)/2/width-.5)>.22 ||
       (path.a.y+path.b.y)/2/height>.65));
    if(!flashPaths.length)flashPaths=paths;
    let time=.12+eventRandom()*.25;
    while(time<trace.cycle) {
      const path=flashPaths[Math.floor(eventRandom()*flashPaths.length)];
      const event={time,amplitude:.65+eventRandom()*.55,
        width:.105+eventRandom()*.055,paths:path?[path]:[]};
      trace.events.push(event);
      // Every individual connection flash creates exactly one waveform spike.
      time += .18+eventRandom()*.24;
    }
    if(spikeCtx) {
      const rect=spikeCanvas.getBoundingClientRect();
      spikeWidth=rect.width;spikeHeight=rect.height;
      spikeCanvas.width=Math.round(spikeWidth*dpr);
      spikeCanvas.height=Math.round(spikeHeight*dpr);
      spikeCtx.setTransform(dpr,0,0,dpr,0,0);
    }
    paint(elapsed);
  }
  function glow(x,y,radius,alpha,color='118,175,255') {
    const halo = ctx.createRadialGradient(x,y,0,x,y,radius);
    halo.addColorStop(0,`rgba(${color},${alpha})`);
    halo.addColorStop(1,`rgba(${color},0)`);
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x,y,radius,0,TAU); ctx.fill();
  }
  function eventAge(t,event) {
    return ((t-event.time)%trace.cycle+trace.cycle)%trace.cycle;
  }
  function pulse(path,age,color='180,218,255') {
    // Brief local discharge: the connection lights immediately, then fades
    // within 100 ms, exactly when its corresponding spike enters the trace.
    if(age>=.1)return;
    const strength=Math.exp(-Math.max(0,age-.028)/.028);
    ctx.save();
    ctx.strokeStyle=`rgba(${color},${strength*.88})`;
    ctx.lineWidth=1.25;
    ctx.shadowColor=`rgba(${color},${strength*.6})`;
    ctx.shadowBlur=6;
    strokePath(path);
    ctx.restore();
    glow(path.a.x,path.a.y,12,strength*.3,color);
  }
  function recording(t) {
    if(!spikeCtx||!spikeWidth)return;
    const length=spikeWidth,baseline=spikeHeight*.42;
    // Keep the narrowest trough wider than one CSS pixel on small screens.
    // Subpixel troughs change apparent height as they cross the pixel grid.
    const waveformStretch=Math.max(trace.stretch,1.25*trace.span/(length*.105));
    const amplitude=Math.min(spikeHeight*.32,36);
    spikeCtx.clearRect(0,0,spikeWidth,spikeHeight);
    const ink=spikeCtx.createLinearGradient(0,0,length,0);
    ink.addColorStop(0,'rgba(149,207,255,0)');
    ink.addColorStop(.09,'rgba(149,207,255,.54)');
    ink.addColorStop(.5,'rgba(196,231,255,.7)');
    ink.addColorStop(.91,'rgba(149,207,255,.54)');
    ink.addColorStop(1,'rgba(149,207,255,0)');
    spikeCtx.strokeStyle=ink;spikeCtx.lineWidth=1.6;
    spikeCtx.shadowColor='rgba(139,204,255,.15)';spikeCtx.shadowBlur=5;
    const visibleEvents=trace.events.map(event=>({event,age:eventAge(t,event)}))
      .filter(({age})=>age<trace.span*trace.head+.5);
    // Sample each narrow spike in its own moving coordinates, including its
    // trough. A fixed screen grid otherwise misses the trough between frames.
    const samplePositions=new Set([0,length]);
    for(let x=0;x<length;x+=.4)samplePositions.add(x);
    visibleEvents.forEach(({age})=>{
      const center=(trace.head-age/trace.span)*length;
      for(let step=-60;step<=60;step++) {
        const x=center+step*.025*waveformStretch/trace.span*length;
        if(x>0&&x<length)samplePositions.add(x);
      }
    });
    spikeCtx.beginPath();
    for(const i of [...samplePositions].sort((a,b)=>a-b)) {
      let voltage=0;
      visibleEvents.forEach(({event,age})=>{
        // New peaks enter at the visible playhead while their network paths flash.
        // Earlier events move left; the space to the right stays at baseline.
        const lag=(age+(i/length-trace.head)*trace.span)/waveformStretch;
        if(Math.abs(lag)>1.5)return;
        voltage+=event.amplitude*(
          .1*Math.exp(-Math.pow((lag+.2)/.12,2))
          -Math.exp(-Math.pow(lag/event.width,2))
          +.32*Math.exp(-Math.pow((lag-.38)/.24,2)));
      });
      const y=baseline-voltage*amplitude;
      if(i===0)spikeCtx.moveTo(0,y);else spikeCtx.lineTo(i,y);
    }
    spikeCtx.stroke();spikeCtx.shadowBlur=0;
  }
  function paint(t) {
    ctx.clearRect(0,0,width,height);
    stars.forEach(s=>{
      ctx.fillStyle='rgba(162,191,235,.2)';
      ctx.beginPath();ctx.arc(s.x,s.y,s.radius,0,TAU);ctx.fill();
    });
    ctx.lineWidth=.75;ctx.strokeStyle='rgba(130,180,240,.25)';
    paths.forEach(path=>strokePath(path));
    nodes.forEach(node=>{
      // Ambient nodes stay steady so only actual shared spike events look like firing.
      const brightness=.55;
      ctx.strokeStyle='rgba(145,193,245,.32)';ctx.lineWidth=.75;
      node.branches.forEach(branch=>{
        const dx=Math.cos(branch.angle)*branch.length,dy=Math.sin(branch.angle)*branch.length;
        const end={x:node.x+dx,y:node.y+dy};
        strokePath(curve(node,end,branch.bend*.3));
        const fork={x:end.x+Math.cos(branch.angle+.65)*branch.length*.33,
                    y:end.y+Math.sin(branch.angle+.65)*branch.length*.33};
        strokePath(curve(end,fork,.15));
      });
      glow(node.x,node.y,12+brightness*5,.17+brightness*.12);
      ctx.fillStyle=`rgba(182,218,255,${.48+brightness*.3})`;
      ctx.beginPath();ctx.arc(node.x,node.y,node.radius,0,TAU);ctx.fill();
    });
    trace.events.forEach(event=>{
      const age=eventAge(t,event);
      if(age<.1)event.paths.forEach(path=>pulse(path,age));
    });

    // Fade the area behind the main reading column so headings stay crisp.
    const veil=ctx.createRadialGradient(width*.5,height*.35,30,width*.5,height*.35,width*.58);
    veil.addColorStop(0,'rgba(12,28,50,.45)');veil.addColorStop(.7,'rgba(12,28,50,.1)');veil.addColorStop(1,'rgba(12,28,50,0)');
    ctx.fillStyle=veil;ctx.fillRect(0,0,width,height);
    recording(t);
  }
  function animate(timestamp) {
    frame=0;
    if(motionReduced||editing||document.hidden)return;
    const delta=previous?Math.min(timestamp-previous,80):0;
    // Cap painting at roughly 30 fps, including on high-refresh-rate screens.
    if(!previous||delta>=32){elapsed+=delta/1000;paint(elapsed);previous=timestamp;}
    frame=requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(frame);frame=0;previous=0;
    canvas.dataset.motion=motionReduced||editing||document.hidden?'paused':'playing';
    if(!motionReduced&&!editing&&!document.hidden)frame=requestAnimationFrame(animate);
    else paint(elapsed);
  }
  reducedMotion.addEventListener('change',event=>{motionReduced=event.matches;sync();});
  document.addEventListener('visibilitychange',sync);
  new MutationObserver(()=>{
    const next=document.body.classList.contains('is-editing');
    if(next!==editing){editing=next;sync();}
  }).observe(document.body,{attributes:true,attributeFilter:['class']});
  let resizeFrame=0;
  window.addEventListener('resize',()=>{
    cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(()=>{layout();sync();});
  },{passive:true});
  layout();sync();
});
