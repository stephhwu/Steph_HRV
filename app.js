// set the dimensions and margins of the graph
const margin = { top: 50, right: 200, bottom: 100, left: 160 },
  width = 1300,
  height = 400;

// Append the SVG container to the body
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

// Read the "garmin-hrv.csv" data
d3.csv("garmin-hrv.csv").then(function (data) {

  // Convert date strings to Date objects
  const parseDate = d3.timeParse("%Y-%m-%d");
  data.forEach(function (d) {
    d.date_ = parseDate(d.date_);
    d.highest_5_min_avg_hrv = +d.highest_5_min_avg_hrv;
    d.calories_burned = +d.calories_burned;
  });

  // Add X axis
  // Add X axis with formatted date
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date_))
    .range([0, width]);

  const xAxis = d3.axisBottom(x)
    .tickFormat(d3.timeFormat("%m/%d")) // Format the date as MM/DD
    .tickSize(5) // Optional: Adjust the tick size
    .tickPadding(10) // Optional: Adjust the tick padding
    .tickValues(data.map(d => d.date_)) // Use specific tick values if needed
  
    // Append a vertical dotted line for the breathing exercise
const breathingLine = svgContainer.append("line")
  .attr("x1", x(parseDate("2024-01-29")))
  .attr("y1", 0)  // Starting from the top of the graph
  .attr("x2", x(parseDate("2024-01-29")))
  .attr("y2", height)  // Ending at the bottom of the graph
  .style("stroke", "black")
  .style("stroke-dasharray", "4")  // Set the line to be dotted
  .style("stroke-width", 1);

// Add a yellow box to indicate the region of resonant coherence breathing
const boxWidth = width - x(parseDate("2024-01-29")); // Width extends to the end of the graph
svgContainer.append("rect")
  .attr("x", x(parseDate("2024-01-29"))) // Starts at the right edge of the dotted line
  .attr("y", 0) // Starting from the top of the graph
  .attr("width", boxWidth)
  .attr("height", height)
  .style("fill", "#FDE67E")
  .style("opacity", 0.2); // Adjust the opacity as needed


  svgContainer.append("text")
  .attr("x", x(parseDate("2024-01-29")) + 110) // Adjust the position as needed
  .attr("y", 300) // Adjust the position as needed
  .text("Start of Resonant Coherence Breathing")
  .style("font-size", "14px")
  .style("fill", "#333");

  svgContainer.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-45)") // Rotate the tick labels
    .style("text-anchor", "end"); // Align to the end of the tick

  // Add Y axis
  const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.highest_5_min_avg_hrv)])
  .range([height, 0]);
  svgContainer.append("g")
    .call(d3.axisLeft(y));

  // Add X-axis label
  svgContainer.append("text")
    .attr("transform", `translate(${width / 2},${height + margin.top + 15})`)
    .style("text-anchor", "middle")
    .text("Date");

  // Add Y-axis label
  svgContainer.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "7em")
    .style("text-anchor", "middle")
    // .attr("dy", "0em")  // Adjust this value to move the label more to the left
    .text("Heart Rate Variability (HRV)");

///////************ */

  // Add a scale for bubble size
  const z = d3.scaleLinear()
    .domain([d3.min(data, d => d.calories_burned), d3.max(data, d => d.calories_burned)])
    .range([4, 40]);

  const minColor = "#92DBEF";
  const maxColor = "#145691";

  // Add a scale for bubble color
  const myColor = d3.scaleSequential()
    .interpolator(d3.interpolate(minColor, maxColor))
    .domain([1734, 2505]);

  const detailsDisplay = d3.select("div#app")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // -2- Create 3 functions to show / update (when mouse move but stay on the same circle) / hide the tooltip
  // ... (existing code)

// 3. Set the tooltip content


const tooltipOffset = 250; // Adjust this value to move the tooltip down

const formatVariableName = (variable) => {
  return variable
    .split('_')  // Split the string by underscores
    .map(word => {
      if (word.toLowerCase() === 'hrv') {
        return word.toUpperCase();  // Ensure HRV is fully capitalized
      }
      return word.charAt(0).toUpperCase() + word.slice(1);  // Capitalize the first letter of each word
    })
    .join(' ');  // Join the words with spaces
};

// Function to convert minutes to hours and minutes
const convertMinutesToHoursAndMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const showDetails = function (event, d, activeVariable) {
  const selectedVariable = (activeVariable == "average_overnight_hrv") ? "average_overnight_hrv" : "highest_5_min_avg_hrv";
  const formattedVariableName = formatVariableName(selectedVariable);  // Format the variable name
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


  // Add dots
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

// Add text above the line
legendSvg.append("text")
  .attr("x", 20)
  .attr("y", -70)
  .attr("fill", "#333")
  .attr("font-size", "12px")
  .attr("text-anchor", "middle")
  .text("Line Text");


// Add a scale for sleep_score
const y2 = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.min_of_sleep)])  // Set the domain to start from 0
  .range([height, 0]);

  // Add Y2-axis label
svgContainer.append("text")
.attr("transform", "rotate(-90)")
.attr("y", width + margin.right)
.attr("x", 0 - height / 2)
.attr("dy", "-9em") // Adjust the vertical position of the label
.style("text-anchor", "middle")
.text("Sleep Duration (min)");

// Add the second Y-axis
svgContainer.append("g")
  .attr("transform", `translate(${width}, 0)`)
  .call(d3.axisRight(y2))
  .style("color", "#333");  // Adjust color as needed

  
  // Line generator for sleep_score
  const line = d3.line()
    .x(d => x(d.date_))
    .y(d => y2(d.min_of_sleep))
    .curve(d3.curveCatmullRom.alpha(0.5));

  
  // Append the line graph
  svgContainer.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line)
    .style("stroke", "#76CAE7")
    .style("stroke-width", 1.5)      // Line thickness
    .style("fill", "none");        // No fill;  // Adjust color as needed


  // Create a gradient legend
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

  // Draw the color rectangle for the legend
  legendSvg.append("rect")
    .attr("x", 50) // Adjust the x position if needed
    .attr("y", 200) // Adjust the y position to move it down
    .attr("width", 20)
    .attr("height", 150)
    .style("fill", "url(#linear-gradient)");

  // Add axis for the legend
  const legendAxis = d3.axisRight()
    .scale(d3.scaleLinear().domain([2505, 1734]).range([150, 0])) // Reverse range to have higher values at the top
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
  
  // Add ellipse
  legendSvg.append("ellipse")
    .attr("cx", 55)
    .attr("cy", 90)
    .attr("rx", 15)
    .attr("ry", 15)
    .style("fill", "#76CAE7");
  
  // Add text above the line
  legendSvg.append("text")
    .attr("x", 100)
    .attr("y", 130)
    .attr("fill", "#333")
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .text("Sleep Duration (min)");
  
  // Add a line
  legendSvg.append("line")
    .attr("x1", 40)
    .attr("y1", 150)
    .attr("x2", 120)
    .attr("y2", 150)
    .style("stroke", "#76CAE7")
    .style("stroke-width", 3);

  // Add legend title
  legendSvg.append("text")
    .attr("x", 40)
    .attr("y", 180)
    .attr("fill", "#333")
    .attr("font-size", "12px")
    .text("Calories Burned");

// Your button-related JavaScript code here
const highest5MinButton = d3.select("#app")
  .append("button")
  .attr("id", "highest5MinButton")  // Add this line to assign an ID to the button
  .text("Highest 5 Min Avg HRV")
  .classed("active", true) // Set the initial active state
  .on("click", function () {
    updateData("highest_5_min_avg_hrv");
    updateTooltipHighest5Min();
  });

const overnightAvgButton = d3.select("#app")
  .append("button")
  .attr("id", "overnightAvgButton")  // Add this line to assign an ID to the button
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
  
    // Update the circles
    svgContainer.selectAll(".bubbles")
      .data(data)
      .attr("cy", d => y(d.hrv_variable));
  
    // Update any other elements or calculations related to the data change
  }
  
  // Add a function to update the tooltip
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
  

  // Update any other elements or calculations related to the data change

  // Redraw the legend or any other elements affected by the data change



});
