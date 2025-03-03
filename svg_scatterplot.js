function scatterPlot3d(data) {
    var SVGexactTip = d3.select("g.tooltip.exact");
    console.log("draw scatter for components: " + data.length)
    let f = (x, z) => Math.cos(z/20)*20 + Math.sin(x/10)*10 + x/3*Math.atan2(z,x);

    let cos = Math.cos, sin = Math.sin, xyz = 'xyz'.split(''),
        k = 700, a1 = 0, a2 = 1.5, far = 1000000, p, w, h, a,
        lines = [], s = 2;

    for (var i = 0; i < 6; i++) lines.push([
    {x:0, y:0, z:0, color:`hsl(${i*120},100%,50%)`, state:{}},
    {x:i%3==0?s:0, y:i%3==1?s:0, z:i%3==2?s:0, state:{}}
    ]);

    pointsGroup = document.getElementById("pointsGroup")
    linesGroup = document.getElementById("linesGroup")

    data.forEach(d=>d.state={fill: d.color});
    pointsGroup.innerHTML=data.map((d,i)=>`
    <circle id="comp_${i}" class="plot" ind="${i}"></circle>
    <g id="name_comp_${i}" class="tooltip css"></g>
    `).join(' ');
   

    linesGroup.innerHTML=lines.map(d=>`<path stroke="${d[0].color}"></path>`).join('');
    let circles = pointsGroup.querySelectorAll('circle');
    let names = pointsGroup.querySelectorAll('g.tooltip');
    let paths = linesGroup.querySelectorAll('path');

    function project(p) {
    let x = p.x*cos(a1) + (p.z * -1)*sin(a1);
    let z = (p.z * -1)*cos(a1) - p.x*sin(a1);
    let y = p.y*cos(a2) +   z*sin(a2);
    let d =   z*cos(a2) - p.y*sin(a2) + far;
    p.state.cx = (k/d)*x + w/2;
    p.state.cy = (k/d)*y + h/2;
    p.state.r = far/d*p.r;
    }

    function render() {
    g = d3.select("#componentDetails");
    g.selectAll("text").remove()
    if (a) for (var i=0; i<3; i++) {
        
        g.append("text")
        .attr("fill", "white")
        .attr('font-size', "20px")
        .attr("y", "1em")
        .text(a.displayName)
        g.append("text")
        .attr("fill", "white")
        .attr('font-size', "20px")
        .attr("y", "2em")
        .text(a.owner)
        g.append("text")
        .attr("fill", "white")
        .attr('font-size', "20px")
        .attr("y", "3em")
        .text(a.stationType)
        
        g.append("text")
        .attr("fill", "white")
        .attr('font-size', "10px")
        .attr("y", "8em")
        .text(`[x: ${a.x} y: ${a.y} z: ${a.z}]`)
    }

    data.forEach(project);	
    data.sort((a, b) => a.state.r - b.state.r);
    lines.forEach(line => line.forEach(project));	
    data.forEach((d, i) => Object.entries(d.state)
        .forEach(p => {
            circles[i].setAttribute(...p); 
            if (d.isSelected) {
                circles[i].setAttribute("stroke", "white");
                circles[i].setAttribute("stroke-width", "1");
            }
            else {
                circles[i].setAttribute("stroke", "");
                circles[i].setAttribute("stroke-width", "0");
            }
        })); 
    data.forEach((d, i) => { 
            names[i].setAttribute("transform", "translate("+d.state.cx +","+d.state.cy+")")
            names[i].innerHTML = `
                <rect  x="-3em" y="-14" width="6em" height=".75em" />
                <text y="-15" dy="1em" font-size="10px" text-anchor="middle">${d.displayName}</text>
                `
        }); 
    lines.forEach((l, i) => paths[i].setAttribute('d',
        `M${l[0].state.cx} ${l[0].state.cy} L${l[1].state.cx} ${l[1].state.cy}`));
    }

    let ignoreClick = false;

    let evt = (t, f) => addEventListener(t, e => f(e) && render());
    evt('click', e => { 
        if (!ignoreClick) {
            if (a) a.isSelected = false;
            a = data[e.target.getAttribute('ind')];
            if (a) a.isSelected = true;
        }

        ignoreClick = false;
        return true;
    }) 
    evt('mouseup', e => 
        {
            p = null;
            return true;
        });
    evt('mousedown', e => { 
        if (e.target.getAttribute("id") == "sectorSvg") {
            p = {x: e.x, y: e.y, a1, a2}
            return true;
        }

        return false;
    });
    evt('mousemove', e => {
        if (p) {
            a1 = p.a1-(e.x-p.x)/100;
            a2 = p.a2-(e.y-p.y)/100

            ignoreClick = true;
            return true;
        }

        return false;
    });
    
    evt('wheel', e => {
        if (e.target.getAttribute("id") == "sectorSvg" && e.shiftKey) {
            k *= 1 - Math.sign(e.deltaY)*0.1;
            return true;
        }
        
        return false;
    });
    evt('resize', e => {
        sectorSvg.setAttribute('viewBox',`0 0 ${w=innerWidth} ${h=innerHeight/2}`)
        return true;
    });
    dispatchEvent(new Event('resize'));
}