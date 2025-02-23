let f = (x, z) => Math.cos(z/20)*20 + Math.sin(x/10)*10 + x/3*Math.atan2(z,x);

let cos = Math.cos, sin = Math.sin, xyz = 'xyz'.split(''),
    k = 500, a1 = 0, a2 = 0, far = 300, p, w, h, a,
    points = [], lines = [], s = 100;
    
for (var x = -s; x < s; x += 5) 
for (var z = -s; z < s; z += 5) 
  points.push({x, z, r:2});

for (var i = 0; i < 6; i++) lines.push([
  {x:-s, y:-s, z:-s, color:`hsl(${i*120},55%,55%)`, state:{}},
  {x:i%3==0?s:-s, y:i%3==1?s:-s, z:i%3==2?s:-s, state:{}}
]);

points.forEach(d=>d.state={fill:`rgb(${d.x+s},${(d.y=f(d.x,d.z))+s},${d.z+s})`});
pointsGroup.innerHTML=points.map((d,i)=>`<circle ind="${i}"></circle>`).join('');
linesGroup.innerHTML=lines.map(d=>`<path stroke="${d[0].color}"></path>`).join('');
let circles = pointsGroup.querySelectorAll('circle');
let paths = linesGroup.querySelectorAll('path');

function project(p) {
  let x = p.x*cos(a1) + p.z*sin(a1);
  let z = p.z*cos(a1) - p.x*sin(a1);
  let y = p.y*cos(a2) +   z*sin(a2);
  let d =   z*cos(a2) - p.y*sin(a2) + far;
  p.state.cx = (k/d)*x + w/2;
  p.state.cy = (k/d)*y + h/2;
  p.state.r = far/d*p.r;
}

function render() {
  if (a) for (var i=0; i<3; i++) 
    xyz.forEach((c, j) => lines[i][0][c] = i==j ? -s : (lines[i][1]=a)[c]);
  points.forEach(project);	
  points.sort((a, b) => a.state.r - b.state.r);
  lines.forEach(line => line.forEach(project));	
  points.forEach((d, i) => Object.entries(d.state)
      .forEach(e => circles[i].setAttribute(...e)));
  lines.forEach((l, i) => paths[i].setAttribute('d', 
     `M${l[0].state.cx} ${l[0].state.cy} L${l[1].state.cx} ${l[1].state.cy}`));
}

let evt = (t, f) => addEventListener(t, e => render(f(e)));
evt('click', e => a = points[e.target.getAttribute('ind')])
evt('wheel', e => k *= 1 - Math.sign(e.deltaY)*0.1);
evt('mouseup', e => p = null);
evt('mousedown', e => p = {x: e.x, y: e.y, a1, a2});
evt('mousemove', e => p && (a1 = p.a1-(e.x-p.x)/100) + (a2 = p.a2-(e.y-p.y)/100));
evt('resize', e=>svg.setAttribute('viewBox',`0 0 ${w=innerWidth} ${h=innerHeight}`));
dispatchEvent(new Event('resize'));