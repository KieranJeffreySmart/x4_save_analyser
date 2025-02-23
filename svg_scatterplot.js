function scatterPlot3d(data) {
    console.log("draw scatter for componens: " + data.length)
    let f = (x, z) => Math.cos(z/20)*20 + Math.sin(x/10)*10 + x/3*Math.atan2(z,x);

    let cos = Math.cos, sin = Math.sin, xyz = 'xyz'.split(''),
        k = 3000, a1 = 0, a2 = 0, far = 50000, p, w, h, a,
        lines = [], s = 2;


    for (var i = 0; i < 6; i++) lines.push([
    {x:0, y:0, z:0, color:`hsl(${i*120},100%,50%)`, state:{}},
    {x:i%3==0?s:0, y:i%3==1?s:0, z:i%3==2?s:0, state:{}}
    ]);

    pointsGroup = document.getElementById("pointsGroup")
    linesGroup = document.getElementById("linesGroup")

    data.forEach(d=>d.state={fill: d.color});
    pointsGroup.innerHTML=data.map((d,i)=>`<circle ind="${i}"></circle>`).join('');
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

    data.forEach(project);	
    data.sort((a, b) => a.state.r - b.state.r);
    lines.forEach(line => line.forEach(project));	
    data.forEach((d, i) => Object.entries(d.state)
        .forEach(e => circles[i].setAttribute(...e)));
    lines.forEach((l, i) => paths[i].setAttribute('d', 
        `M${l[0].state.cx} ${l[0].state.cy} L${l[1].state.cx} ${l[1].state.cy}`));
    }

    let evt = (t, f) => addEventListener(t, e => render(f(e)));
    evt('click', e => a = data[e.target.getAttribute('ind')])
    evt('mouseup', e => p = null);
    evt('mousedown', e => { if (e.target.getAttribute("id") == "sectorSvg") p = {x: e.x, y: e.y, a1, a2}});
    evt('mousemove', e => p && (a1 = p.a1-(e.x-p.x)/100) + (a2 = p.a2-(e.y-p.y)/100));
    evt('wheel', e => {if (e.target.getAttribute("id") == "sectorSvg" && event.shiftKey) {k *= 1 - Math.sign(e.deltaY)*0.1;}});
    evt('resize', e=>sectorSvg.setAttribute('viewBox',`0 0 ${w=innerWidth} ${h=innerHeight/2}`));
    dispatchEvent(new Event('resize'));
}