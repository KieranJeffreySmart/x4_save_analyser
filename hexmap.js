function hexmap(parent, plots) {
    
    let scale = 1, a1 = 0, a2 = 0, p, w, h;
    var points = []
    

    //The number of columns and rows of the heatmap
    var MapColumns = 40,
        MapRows = 20;
    
    var callWidth = 50, borderWidth = 2,
        width = MapColumns * callWidth,
        height = MapRows * callWidth;

    //The maximum radius the hexagons can have to still fit the screen
    var hexRadius = d3.min([
        width/((MapColumns + 0.5) * Math.sqrt(3)), 
        height/((MapRows + 1/3) * 1.5)
      ]);

    //Calculate the center position of each hexagon
    
    
    for(i = 0; i < plots.length; i++){
        let radius = hexRadius + borderWidth
        let scaledradius = hexRadius;
        let plot = plots[i]
        let x = (radius) * (20 + plot.x) * 1.5
        let y = (radius) * (10 + plot.y) * Math.sqrt(3)
        if ((20 + plot.x)%2===1) y += (radius * Math.sqrt(3))/2
        
        if (plot.clusterPos > 1)
        {
            radius = radius/2
            scaledradius = scaledradius/2
            switch(plot.clusterPos) {
                case 2:
                    x += (radius)/2
                    y -= (radius * Math.sqrt(3))/2
                break;
                case 3:
                    x += radius
                break;
                case 4:
                    x += (radius)/2
                    y += (radius * Math.sqrt(3))/2
                break;
                case 5:
                    x -= (radius)/2
                    y += (radius * Math.sqrt(3))/2
                break;
                case 6:
                    x -= radius
                break;
                case 7:
                    x -= (radius)/2
                    y -= (radius * Math.sqrt(3))/2
                break;
            }
        }
        points.push({ x: x, y: y, title: plot.title, radius: scaledradius, color: plot.color})
    }

    var svg = parent

    //Set the hexagon radius
    var hexbin = d3.hexbin().radius(hexRadius);

    function render() {
        svg.select("g").remove()
        svg.attr("transform", "translate("+(a1)+", "+(a2)+") ")
        g = svg.append("g").attr("idx", (d, i) => i)
        .selectAll(".hexagon")
        .data(points)
        .enter()
        

        g.append("path")
        .attr("class", "hexagon")
        .attr("d", function (d, i) {
            return "M" + d.x + "," + d.y + hexbin.hexagon(d.radius);
        })
        .attr("stroke", function (d, i) { 
            return "white";
         })
        .attr("stroke-width", borderWidth + "px")
        .style("fill", function (d, i) { 
            return d.color;
         })

        tg = g.append("g")
        .filter(function(d) {return (!d.image)})

        tg.append("text")
        .attr('font-size', "2px")
        .attr("font-weight", "bold")
        .attr('dominant-baseline', "middle")
        .attr('text-anchor', "middle")
        .attr('x', function (d) { return d.x })
        .attr('y', function (d) { return d.y })
        .text(function (d, i) { return d.title; })
        .call(getBB);   

        tg.insert("rect","text")
            .attr('x', function (d) { return d.bbox.x })
            .attr('y', function (d) { return d.bbox.y })
            .attr("width", function(d){return d.bbox.width})
            .attr("height", function(d){return d.bbox.height})
            .style("fill", "white");
        
        function getBB(selection) {
            selection.each(function(d){d.bbox = this.getBBox();})
        };
    }


    let evt = (t, f) => addEventListener(t, e => {f(e); p && render()});
    evt('mouseup', e => p = null);
    evt('mousedown', e => {if (e.target.getAttribute("id") == "universeSvg") p = {x: e.x, y: e.y, a1, a2}});
    evt('mousemove', e => {p  
                           && (a1 = p.a1 +
                                    ((e.x-p.x) >= 0 ? 
                                    ((e.x-p.x) <= width/4 ? (e.x-p.x) : width/4) 
                                    : ((e.x-p.x) >= -width/4 ? (e.x-p.x) : -width/4)))
                           + (a2 = p.a2 +
                                    ((e.y-p.y) >= 0 ? 
                                    ((e.y-p.y) <= height/4 ? (e.y-p.y) : height/4) 
                                    : ((e.y-p.y) >= -height/4 ? (e.y-p.y) : -height/4)))});      
    evt('resize', e=> {
        document.getElementById("universeSvg").setAttribute('viewBox',`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`)
        document.getElementById("sectorsGroup").setAttribute('transform',`translate(${a1}, ${a2})`)
    });

    viewBox = { x: 0, y: 0, width: width, height: height };
    evt('wheel', e => {
        if (e.target.getAttribute("id") == "universeSvg" && e.shiftKey) {
            var delta = e.wheelDelta;
          
            if (delta) {
              normalized = (delta % 120) == 0 ? delta / 120 : delta / 12;
            } else {
              delta = e.deltaY || e.detail || 0;
              normalized = -(delta % 3 ? delta * 10 : delta / 3);
            }

            let point = document.getElementById("universeSvg").createSVGPoint()
            point.x = e.clientX;
            point.y = e.clientY;
            var startPoint = point.matrixTransform(document.getElementById("universeSvg").getScreenCTM().inverse());
            let scaleDelta = normalized > 0 ? 1 / 1.5 : 1.5
            scale = scaleDelta;

                viewBox.x -= (startPoint.x - viewBox.x) * (scaleDelta - 1);
                viewBox.y -= (startPoint.y - viewBox.y) * (scaleDelta - 1);
                viewBox.width *= scaleDelta;
                viewBox.height *= scaleDelta;
                console.log("zooming... " + scaleDelta)
                document.getElementById("universeSvg").setAttribute('viewBox',`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`)
        }});
    render()
    dispatchEvent(new Event('resize'));


}