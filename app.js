{
  // Chart setup
  const canvas = document.getElementById("maturity-spider");
  const ctx = canvas.getContext("2d");
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 120;

  // Elements
  const maturityForm = document.getElementById("maturity-form");
  const legends = maturityForm.querySelectorAll("legend[data-category]");
  const inputs = maturityForm.querySelectorAll("input");
  const matrix = document.getElementById("maturity-matrix");
  const scoreList = document.getElementById("maturity-scores");

  // Categories are used to drive the app
  const categories = {};
  const scores = {};
  const counts = {};
  let maxValue = 0;

  // Legends are used to obtain the list of categories
  // Use: <legend data-category="name">Name</legend>
  legends.forEach((legend) => {
    const category = legend.dataset.category;
    const text = legend.innerText;

    categories[category] = text;
    scores[category] = 0;
    counts[category] = 0;
  });

  inputs.forEach((input) => {
    const value = parseInt(input.value);

    if (!isNaN(value)) {
      maxValue = Math.max(maxValue, value);
    }
  });

  // Set canvas size
  canvas.width = 350;
  canvas.height = 350;

  function drawSpiderChart() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;

    // Draw grid circles
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 4) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw grid lines and labels
    ctx.strokeStyle = "#e2e8f0";
    ctx.fillStyle = "#4a5568";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    const displayNames = Object.values(categories);

    for (let i = 0; i < displayNames.length; i++) {
      const angle = (i * 2 * Math.PI) / displayNames.length - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Draw grid line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw label
      const labelX = centerX + Math.cos(angle) * (radius + 20);
      const labelY = centerY + Math.sin(angle) * (radius + 20);
      ctx.fillText(displayNames[i], labelX, labelY + 5);
    }

    // Draw level numbers
    ctx.fillStyle = "#718096";
    ctx.font = "10px Arial";
    for (let i = 1; i <= 4; i++) {
      ctx.fillText(i.toString(), centerX + 5, centerY - (radius / 4) * i + 3);
    }

    // Draw data polygon
    if (Object.values(scores).some((score) => score > 0)) {
      ctx.strokeStyle = "#667eea";
      ctx.fillStyle = "rgba(102, 126, 234, 0.2)";
      ctx.lineWidth = 3;

      ctx.beginPath();
      for (let i = 0; i < displayNames.length; i++) {
        const categoryKey = displayNames[i].toLowerCase();
        const score = scores[categoryKey] || 0;
        const angle = (i * 2 * Math.PI) / displayNames.length - Math.PI / 2;
        const distance = (score / 4) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw data points
      ctx.fillStyle = "#667eea";
      for (let i = 0; i < displayNames.length; i++) {
        const categoryKey = displayNames[i].toLowerCase();
        const score = scores[categoryKey] || 0;
        const angle = (i * 2 * Math.PI) / displayNames.length - Math.PI / 2;
        const distance = (score / 4) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  function drawRow(category, values) {
    let row = `<tr><td>${category}</td>`;

    for (let i = 1; i <= maxValue; i++) {
      row += `<td class="heat_${values[i.toString()]}"> </td>`;
    }

    row += "</td>";

    return row;
  }

  function drawMatrix() {
    let table = `<thead><th></th>`;

    for (let i = 1; i <= maxValue; i++) {
      table += `<th width="40">${i}</th>`;
    }

    table += `</thead><tbody>`;

    for (let category in categories) {
      table += drawRow(categories[category], counts[category]);
    }

    table += `</tbody>`;

    matrix.innerHTML = table;
  }

  function drawScores() {
    let html = "";

    for (var category in categories) {
      html += `<div class="score-item"><span class="score-label">${categories[category]}:</span><span class="score-value" id="investmentScore">${scores[category]}</span></div>`;
    }

    scoreList.innerHTML = html;
  }

  function draw() {
    drawSpiderChart();
    drawMatrix();
    drawScores();
  }

  function calculateCategoryScore(category) {
    const inputs = maturityForm.querySelectorAll(
      `input[name^="${category}_"]:checked`
    );
    if (inputs.length === 0) return 0;

    let total = 0;
    inputs.forEach((input) => {
      total += parseInt(input.value);
    });

    return total / inputs.length;
  }

  function calculateCategoryCount(category) {
    const inputs = maturityForm.querySelectorAll(
      `input[name^="${category}_"]:checked`
    );
    if (inputs.length === 0) return 0;

    const count = {};

    for (let i = 1; i <= maxValue; i++) {
      count[i] = 0;
    }

    inputs.forEach((input) => {
      const value = parseInt(input.value ?? 0).toString();
      count[value]++;
    });

    return count;
  }

  function updateScores() {
    for (var name in categories) {
      scores[name] = calculateCategoryScore(name);
      counts[name] = calculateCategoryCount(name);
    }

    // Redraw charts
    draw();
  }

  function saveStateToURL() {
    const formData = new FormData(maturityForm);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      params.set(key, value);
    }

    const newURL = window.location.pathname + "?" + params.toString();
    window.history.replaceState({}, "", newURL);
  }

  function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);

    for (const [key, value] of params.entries()) {
      const radio = maturityForm.querySelector(
        `input[name="${key}"][value="${value}"]`
      );

      if (radio) {
        radio.checked = true;

        // Add selected class to the option
        radio.closest(".option").classList.add("selected");
      }
    }

    updateScores();
  }

  function getShareableURL() {
    return window.location.href;
  }

  function revert(elem, text) {
    elem.innerText = text;
  }

  function copyURLToClipboard(elem) {
    const originalText = elem.innerText;
    navigator.clipboard
      .writeText(window.location.href)
      .then(function () {
        elem.innerText = '📋 Copied!';
        console.log('copied');
        window.setTimeout(() => revert(elem, originalText), 2000);
      })
      .catch(function (err) {
        elem.innerText = 'Failed! Please copy from address bar.';
        window.setTimeout(() => revert(elem, originalText), 2000);
      });
  }

  // Radio button clicks
  document.addEventListener("change", function (e) {
    if (e.target.type === "radio") {
      // Remove selected class from all options in the same question group
      const questionGroup = e.target.closest(".question-group");
      questionGroup
        .querySelectorAll(".option")
        .forEach((opt) => opt.classList.remove("selected"));

      // Add selected class to chosen option
      e.target.closest(".option").classList.add("selected");

      // Update scores and chart
      updateScores();
      saveStateToURL();
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    loadStateFromURL();
  });

  // Initial chart draw
  draw();
}
