const margin = { top: 50, right: 200, bottom: 100, left: 160 },
  width = 1300,
  height = 400;

const svgContainer = d3
.select("div#app")
  .append("div")
  .attr("id", "app")
  .append("svg")
  .style("margin", "0 auto")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left - 70},${margin.top})`);

  const WIDTH = 2000,
  HEIGHT = 900,
  MARGIN = {
    TOP: 10,
    RIGHT: 250,
    BOTTOM: 20,
    LEFT: 30,
  };

d3.csv("garmin-hrv.csv").then(function (data) {

  const parseDate = d3.timeParse("%Y-%m-%d");
  data.forEach(function (d) {
    d.date_ = parseDate(d.date_);
    d.highest_5_min_avg_hrv = +d.highest_5_min_avg_hrv;
    d.calories_burned = +d.calories_burned;
  });


  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date_))
    .range([0, width]);

  const xAxis = d3.axisBottom(x)
    .tickFormat(d3.timeFormat("%m/%d")) 
    .tickSize(5) 
    .tickPadding(10) 
    .tickValues(data.map(d => d.date_)) 
  
const breathingLine = svgContainer.append("line")
  .attr("x1", x(parseDate("2024-01-29")))
  .attr("y1", 0)  
  .attr("x2", x(parseDate("2024-01-29")))
  .attr("y2", height) 
  .style("stroke", "black")
  .style("stroke-dasharray", "4")  
  .style("stroke-width", 1);

const boxWidth = width - x(parseDate("2024-01-29")); 
svgContainer.append("rect")
  .attr("x", x(parseDate("2024-01-29"))) 
  .attr("y", 0) 
  .attr("width", boxWidth)
  .attr("height", height)
  .style("fill", "#FDE67E")
  .style("opacity", 0.2); 


  svgContainer.append("text")
  .attr("x", x(parseDate("2024-01-29")) + 110) 
  .attr("y", 300) 
  .text("Start of Resonant Coherence Breathing")
  .style("font-size", "14px")
  .style("fill", "#333");

  svgContainer.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-45)") 
    .style("text-anchor", "end"); 

  const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.highest_5_min_avg_hrv)])
  .range([height, 0]);
  svgContainer.append("g")
    .call(d3.axisLeft(y));

  svgContainer.append("text")
    .attr("transform", `translate(${width / 2},${height + margin.top + 15})`)
    .style("text-anchor", "middle")
    .text("Date");

  svgContainer.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "7em")
    .style("text-anchor", "middle")
    // .attr("dy", "0em")  
    .text("Heart Rate Variability (HRV)");


  const z = d3.scaleLinear()
    .domain([d3.min(data, d => d.calories_burned), d3.max(data, d => d.calories_burned)])
    .range([4, 40]);

  const minColor = "#92DBEF";
  const maxColor = "#145691";

  const myColor = d3.scaleSequential()
    .interpolator(d3.interpolate(minColor, maxColor))
    .domain([1734, 2505]);

  const detailsDisplay = d3.select("div#app")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


const tooltipOffset = 250; // Adjust this value to move the tooltip down

const formatVariableName = (variable) => {
  return variable
    .split('_')  
    .map(word => {
      if (word.toLowerCase() === 'hrv') {
        return word.toUpperCase();  
      }
      return word.charAt(0).toUpperCase() + word.slice(1);  
    })
    .join(' ');  
};

const convertMinutesToHoursAndMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const showDetails = function (event, d, activeVariable) {
  const selectedVariable = (activeVariable == "average_overnight_hrv") ? "average_overnight_hrv" : "highest_5_min_avg_hrv";
  const formattedVariableName = formatVariableName(selectedVariable);  
  const [x, y] = d3.pointer(event, svgContainer.node());

  // Convert sleep duration to hours and minutes
  const sleepDuration = convertMinutesToHoursAndMinutes(d.min_of_sleep);

  detailsDisplay
    .style("opacity", 1)
    .html(`
    <span style="color: grey;">${formattedVariableName}:</span> ${d[selectedVariable]}<br>
    <span style="color: grey;">Calories Burned:</span> ${d.calories_burned}<br>
    <span style="color: grey;">Sleep Duration:</span> ${sleepDuration}
  `)
    .style("left", `${x + margin.left}px`)
    .style("top", `${y + margin.top + tooltipOffset}px`);
}

const moveDetails = function (event, d) {
  const [x, y] = d3.pointer(event, svgContainer.node());

  detailsDisplay
    .style("left", `${x + margin.left}px`)
    .style("top", `${y + margin.top + tooltipOffset}px`);
}

const hideDetails = function () {
  detailsDisplay
    .transition()
    .duration(200)
    .style("opacity", 0);
}


  svgContainer.append('g')
  .selectAll("dot")
  .data(data)
  .join("circle")
  .attr("class", "bubbles")
  .attr("cx", d => x(d.date_))
  .attr("cy", d => y(d.highest_5_min_avg_hrv))
  .attr("r", 13) // Set a constant radius, such as 15
  .style("fill", d => myColor(d.calories_burned))
  .on("mouseover", function (event, d) {
    showDetails(event, d);
  })
  .on("mousemove", function (event, d) {
    moveDetails(event, d);
  })
  .on("mouseout", function () {
    hideDetails();
  });

  // Create an SVG element for the legend
  const legendSvg = svgContainer.append("g")
  .attr("transform", `translate(${width + 95}, ${margin.top - 35})`);

  legendSvg.append("ellipse")
  .attr("cx", 20)
  .attr("cy", -80)
  .attr("rx", 20)
  .attr("ry", 10)
  .style("fill", "gray");

// Add text above the ellipse
legendSvg.append("text")
  .attr("x", 20)
  .attr("y", -100)
  .attr("fill", "#333")
  .attr("font-size", "12px")
  .attr("text-anchor", "middle")
  .text("Ellipse Text");

legendSvg.append("text")
  .attr("x", 20)
  .attr("y", -70)
  .attr("fill", "#333")
  .attr("font-size", "12px")
  .attr("text-anchor", "middle")
  .text("Line Text");


const y2 = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.min_of_sleep)])  // Set the domain to start from 0
  .range([height, 0]);

svgContainer.append("text")
.attr("transform", "rotate(-90)")
.attr("y", width + margin.right)
.attr("x", 0 - height / 2)
.attr("dy", "-9em") // Adjust the vertical position of the label
.style("text-anchor", "middle")
.text("Sleep Duration (min)");

svgContainer.append("g")
  .attr("transform", `translate(${width}, 0)`)
  .call(d3.axisRight(y2))
  .style("color", "#333");  // Adjust color as needed

  
  const line = d3.line()
    .x(d => x(d.date_))
    .y(d => y2(d.min_of_sleep))
    .curve(d3.curveCatmullRom.alpha(0.5));

  
  svgContainer.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line)
    .style("stroke", "#76CAE7")
    .style("stroke-width", 1.5)     
    .style("fill", "none");       


  const defs = legendSvg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");

  linearGradient.append("stop")
    .attr("offset", "0%")
    .style("stop-color", minColor);

  linearGradient.append("stop")
    .attr("offset", "100%")
    .style("stop-color", maxColor);

  legendSvg.append("rect")
    .attr("x", 50) 
    .attr("y", 200) 
    .attr("width", 20)
    .attr("height", 150)
    .style("fill", "url(#linear-gradient)");

  const legendAxis = d3.axisRight()
    .scale(d3.scaleLinear().domain([2505, 1734]).range([150, 0])) 
    .ticks(5)
    .tickFormat(d3.format(".0f"));

  legendSvg.append("g")
    .attr("transform", "translate(70, 200)")
    .call(legendAxis)
    .selectAll(".tick text")
    .attr("fill", "#333")
    .attr("font-size", "10px");

    legendSvg.append("text")
    .attr("x", 70)
    .attr("y", 10)
    .attr("fill", "#333")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .text("Legend");

    legendSvg.append("text")
    .attr("x", 55)
    .attr("y", 60)
    .attr("fill", "#333")
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .text("HRV");
  
  legendSvg.append("ellipse")
    .attr("cx", 55)
    .attr("cy", 90)
    .attr("rx", 15)
    .attr("ry", 15)
    .style("fill", "#76CAE7");
  
  legendSvg.append("text")
    .attr("x", 100)
    .attr("y", 130)
    .attr("fill", "#333")
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .text("Sleep Duration (min)");
  
  legendSvg.append("line")
    .attr("x1", 40)
    .attr("y1", 150)
    .attr("x2", 120)
    .attr("y2", 150)
    .style("stroke", "#76CAE7")
    .style("stroke-width", 3);

  legendSvg.append("text")
    .attr("x", 40)
    .attr("y", 180)
    .attr("fill", "#333")
    .attr("font-size", "12px")
    .text("Calories Burned");

const highest5MinButton = d3.select("#app")
  .append("button")
  .attr("id", "highest5MinButton")  
  .text("Highest 5 Min Avg HRV")
  .classed("active", true) 
  .on("click", function () {
    updateData("highest_5_min_avg_hrv");
    updateTooltipHighest5Min();
  });

const overnightAvgButton = d3.select("#app")
  .append("button")
  .attr("id", "overnightAvgButton")  
  .text("Overnight Avg HRV")
  .on("click", function () {
    updateData("average_overnight_hrv");
    updateTooltipOvernightAvg();
  });


  function updateData(newVariable) {
    // Modify the code to use the new variable
    data.forEach(function (d) {
      d.date_ = parseDate(d.date_);
      d.hrv_variable = +d[newVariable];
      d.calories_burned = +d.calories_burned;
    });
  
    svgContainer.selectAll(".bubbles")
      .data(data)
      .attr("cy", d => y(d.hrv_variable));
  
  }
  
  function updateTooltipHighest5Min() {
    svgContainer.selectAll(".bubbles")
      .on("mouseover", function (event, d) {
        showDetails(event, d, "highest_5_min_avg_hrv");
      })
      .on("mousemove", function (event, d) {
        moveDetails(event, d);
      })
      .on("mouseout", function () {
        hideDetails();
      });
  }
  
  function updateTooltipOvernightAvg() {
    svgContainer.selectAll(".bubbles")
      .on("mouseover", function (event, d) {
        showDetails(event, d, "average_overnight_hrv");
      })
      .on("mousemove", function (event, d) {
        moveDetails(event, d);
      })
      .on("mouseout", function () {
        hideDetails();
      });
  }

});
