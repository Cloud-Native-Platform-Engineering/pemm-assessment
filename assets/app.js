// Pagination variables (global scope)
let currentPage = 0;
let totalPages = 0;
let categoryPages = [];

{
  // YAML data storage
  let questionsData = null;

  function getLanguageCode() {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    return urlLang || 'en';
  }

  // Load YAML data
  async function loadQuestionsData() {
    langCode = getLanguageCode();
    let loadSuccess = false;

    // Build filename dynamically
    const yamlPath = `./data/questions-${langCode}.yaml`;

    try {
      const response = await fetch(yamlPath);

      if (response.ok) {
        const yamlText = await response.text();
        questionsData = jsyaml.load(yamlText);

        // Only update document language once language successfully loaded
        document.documentElement.lang = langCode;
        loadSuccess = true;

        return questionsData;
      }
    } catch { }

    if (!loadSuccess) {
      console.warn('Failed to load from:', yamlPath);
    }
  }

  // Update pagination button states (global scope)
  function updatePaginationControls() {
    const previous = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    const submit = document.getElementById('submit-btn');
    const backToAssessment = document.getElementById('app-return-button');

    if (previous) {
      previous.innerText = questionsData?.metadata?.previous_button_text || 'Previous';
      previous.disabled = currentPage === 0;
    }

    if (next) {
      next.innerText = questionsData?.metadata?.next_button_text || 'Next';

      if (currentPage === totalPages - 1) {
        next.style.display = 'none';
      } else {
        next.style.display = 'inline-block';
      }
    }

    if (submit) {
      submit.innerText = questionsData?.metadata?.submit_button_text || 'Submit assessment';

      if (currentPage === totalPages - 1) {
        submit.style.display = "inline-block";
      } else {
        submit.style.display = "none";
      }
    }

    if (backToAssessment) {
      backToAssessment.innerText = questionsData?.metadata?.back_to_assessment || 'Return to Assessment';
    }
  }
  
  // Generate form HTML from YAML data with pagination
  async function generateFormFromData(data) {
    if (!data) {
      console.warn('No data provided for form generation');
      return;
    }

    const form = document.getElementById('maturity-form');
    if (!form) {
      console.warn('Form element with id "maturity-form" not found');
      return;
    }

    document.querySelectorAll('[data-text]').forEach(elem => {
      const key = elem.getAttribute('data-text');
      if (data.metadata[key]) {
        elem.innerHTML = data.metadata[key];
      }
    });

    // Store categories for pagination
    categoryPages = data.categories.sort((a, b) => a.order - b.order);
    totalPages = categoryPages.length;
    currentPage = 0;

    // Initialize pagination
    renderCurrentPage();
    updatePaginationControls();

    // Reinitialize after form generation
    initializeAfterFormGeneration();
  }

  // Reinitialize form listeners and data after dynamic generation
  function initializeAfterFormGeneration() {
    // Update categories object from YAML data instead of DOM
    // This ensures all categories are included, not just the current page
    const inputs = document.querySelectorAll("input");

    // Clear existing data
    Object.keys(categories).forEach(key => delete categories[key]);
    Object.keys(scores).forEach(key => delete scores[key]);
    Object.keys(counts).forEach(key => delete counts[key]);

    maxValue = 0;

    // Rebuild categories from YAML data (categoryPages contains all categories)
    if (categoryPages && categoryPages.length > 0) {
      categoryPages.forEach((categoryData) => {
        const categoryId = categoryData.id;
        const categoryName = categoryData.name;

        categories[categoryId] = categoryName;
        scores[categoryId] = 0;
        counts[categoryId] = 0;
      });
    }

    // Check YAML data for maxValue to ensure we get all possible values
    categoryPages?.flatMap(cat => cat.questions ?? [])
      .flatMap(q => q.options ?? [])
      .forEach(opt => {
        const value = parseInt(opt.value);
        if (!isNaN(value)) maxValue = Math.max(maxValue, value);
      });

    // Re-add event listeners for new radio buttons
    document.addEventListener('change', handleRadioChange);

    // Load state from URL and draw charts
    loadStateFromURL();
  }

  // Handle radio button changes
  function handleRadioChange(e) {
    if (e.target.type === 'radio') {
      // Update scores and chart
      updateScores();
      saveStateToURL();
    }
  }

  // Get copy messages from current language dynamically
  async function getCurrentLanguageCopyMessages() {
    const defaultCopyText = {
      copySuccess: '📋 Copied!',
      copyFail: 'Failed! Please copy from address bar.'
    };

    if (questionsData && questionsData.metadata) {
      return {
        copySuccess: questionsData.metadata.copy_success || questionsData.metadata.copy_link_text || defaultCopyText.copySuccess,
        copyFail: questionsData.metadata.copy_fail || defaultCopyText.copyFail
      };
    }

    // Fallback messages
    return defaultCopyText;
  }

  // Chart setup
  const canvas = document.getElementById('maturity-spider');
  const ctx = canvas.getContext('2d');

  // Elements
  const maturityForm = document.getElementById('maturity-form');
  const legends = maturityForm ? maturityForm.querySelectorAll('legend[data-category]') : [];
  const inputs = maturityForm ? maturityForm.querySelectorAll('input') : [];
  const matrix = document.getElementById('maturity-matrix');
  const scoreList = document.getElementById('maturity-scores');

  // Categories are used to drive the app
  const categories = {};
  const scores = {};
  const counts = {};
  let maxValue = 0;

  // Initialize categories from existing HTML (fallback)
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
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 4) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw grid lines and labels
    ctx.strokeStyle = '#e2e8f0';
    ctx.fillStyle = '#4a5568';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    const displayNames = Object.values(categories);
    const entries = Object.entries(categories);


    for (let i = 0; i < entries.length; i++) {
      const [categoryId, categoryName] = entries[i];
      const angle = (i * 2 * Math.PI) / entries.length - Math.PI / 2;
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
      ctx.fillText(categoryName, labelX, labelY + 5);
    }

    // Draw level numbers
    ctx.fillStyle = '#718096';
    ctx.font = '10px Arial';
    for (let i = 1; i <= 4; i++) {
      ctx.fillText(i.toString(), centerX + 5, centerY - (radius / 4) * i + 3);
    }

    // Draw data polygon
    if (Object.values(scores).some((score) => score > 0)) {
      ctx.strokeStyle = '#667eea';
      ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
      ctx.lineWidth = 3;

      ctx.beginPath();
      for (let i = 0; i < entries.length; i++) {
        const [categoryId, categoryName] = entries[i];
        const score = scores[categoryId] || 0;
        const angle = (i * 2 * Math.PI) / entries.length - Math.PI / 2;
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
      for (let i = 0; i < entries.length; i++) {
        const [categoryId, categoryName] = entries[i];
        const score = scores[categoryId] || 0;
        const angle = (i * 2 * Math.PI) / entries.length - Math.PI / 2;
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
    // Read answers from localStorage to include all pages
    const answeredQuestions = [];
    let total = 0;

    // Check localStorage for all questions in this category
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${category}_`)) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          answeredQuestions.push(key);
          total += parseInt(value);
        }
      }
    }

    if (answeredQuestions.length === 0) return 0;
    return (total / answeredQuestions.length).toFixed(2);
  }

  function calculateCategoryCount(category) {
    // Read answers from localStorage to include all pages
    const count = {};

    // Initialize count object
    for (let i = 1; i <= maxValue; i++) {
      count[i] = 0;
    }

    // Check localStorage for all questions in this category
    let hasAnswers = false;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${category}_`)) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          hasAnswers = true;
          const intValue = parseInt(value ?? 0).toString();
          if (count[intValue] !== undefined) {
            count[intValue]++;
          }
        }
      }
    }

    return hasAnswers ? count : 0;
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

  async function copyURLToClipboard(elem) {
    const copyMessages = await getCurrentLanguageCopyMessages();
    const originalText = elem.innerText;

    // Build URL with all answers from localStorage
    const params = new URLSearchParams(window.location.search);

    // Remove existing answer parameters but keep language parameter
    const answersToRemove = [];
    for (const [key] of params.entries()) {
      if (key !== 'lang') {
        answersToRemove.push(key);
      }
    }
    answersToRemove.forEach(key => params.delete(key));

    // Add all answers from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('_')) { // Answer keys follow pattern "category_questionId"
        const value = localStorage.getItem(key);
        if (value !== null) {
          params.set(key, value);
        }
      }
    }

    const shareableURL = window.location.origin + window.location.pathname + '?' + params.toString();

    navigator.clipboard
      .writeText(shareableURL)
      .then(function () {
        elem.innerText = copyMessages.copySuccess;
        console.log('copied');
        window.setTimeout(() => revert(elem, originalText), 2000);
      })
      .catch(function (err) {
        elem.innerText = copyMessages.copyFail;
        console.log('copy failed:', err);
        window.setTimeout(() => revert(elem, originalText), 2000);
      });
  }

  // Make copyURLToClipboard globally accessible
  window.copyURLToClipboard = copyURLToClipboard;

  // Radio button clicks (removed - now handled in handleRadioChange)

  document.addEventListener("DOMContentLoaded", async function () {
    // Try to load YAML data first
    const yamlData = await loadQuestionsData();

    if (yamlData) {
      // Generate form from YAML data
      await generateFormFromData(yamlData);
    } else {
      // Fallback to existing HTML structure
      loadStateFromURL();
    }

    draw();
  });

  // Initial chart draw
  draw();
}

// Render the current page content (global scope for access from pagination functions)
function renderCurrentPage() {
  const form = document.getElementById("maturity-form");
  const pageIndicator = document.getElementById("page-indicator");
  const introSection = document.getElementById("intro-section");

  if (!form || !categoryPages.length) return;

  // Update page indicator
  if (pageIndicator) {
    pageIndicator.textContent = `Page ${currentPage + 1} of ${totalPages}`;
  }

  // Show/hide intro based on page
  if (introSection) {
    introSection.style.display = currentPage === 0 ? "block" : "none";
  }

  // Get current category
  const category = categoryPages[currentPage];

  // Generate HTML for current page
  let formHTML = `
    <fieldset>
      <legend data-category="${category.id}">${category.name}</legend>
  `;

  category.questions.forEach((question) => {
    formHTML += `
      <div class="question-group">
        <div class="question">${question.text}</div>
        <div class="options">
    `;

    question.options.forEach((option) => {
      formHTML += `
        <label class="option">
          <input type="radio" name="${question.field_name}" value="${option.value}" />
          <div class="option-text">
            <span class="option-level">${option.level}</span><br />
            <span class="option-description">${option.description}</span>
          </div>
        </label>
      `;
    });

    formHTML += `
        </div>
      </div>
    `;
  });

  formHTML += `</fieldset>`;
  form.innerHTML = formHTML;

  // Restore answers for current page
  restoreCurrentPageAnswers();

  // Save answers for current page (global scope)
  function saveCurrentPageAnswers() {
    const form = document.getElementById("maturity-form");
    if (!form) return;

    const inputs = form.querySelectorAll('input[type="radio"]:checked');
    inputs.forEach((input) => {
      localStorage.setItem(input.name, input.value);
    });
  }

  // Restore answers for current page (global scope)
  function restoreCurrentPageAnswers() {
    const form = document.getElementById("maturity-form");
    if (!form) return;

    const inputs = form.querySelectorAll('input[type="radio"]');
    inputs.forEach((input) => {
      const savedValue = localStorage.getItem(input.name);
      if (savedValue && input.value === savedValue) {
        input.checked = true;
      }
    });
  }

  // Global pagination functions (accessible from HTML)
  window.nextPage = function () {
    if (currentPage < totalPages - 1) {
      saveCurrentPageAnswers();
      currentPage++;
      renderCurrentPage();
      updatePaginationControls();
      restoreCurrentPageAnswers();
      // Scroll to top of page for better UX
      window.scrollTo(0, 0);
    }
  };

  window.previousPage = function () {
    if (currentPage > 0) {
      saveCurrentPageAnswers();
      currentPage--;
      renderCurrentPage();
      updatePaginationControls();
      restoreCurrentPageAnswers();
      // Scroll to top of page for better UX
      window.scrollTo(0, 0);
    }
  };

  window.submitAssessment = function () {
    saveCurrentPageAnswers();
    showResults();
    // Scroll to top to show results section
    window.scrollTo(0, 0);
  };

  window.returnToAssessment = function () {
    const formSection = document.querySelector('.form-section');
    const resultsSection = document.getElementById('results-section');

    if (resultsSection) resultsSection.style.display = 'none';
    if (formSection) {
      formSection.style.display = 'block';
      // Restore the current page and answers
      renderCurrentPage();
      updatePaginationControls();
      restoreCurrentPageAnswers();
    }
  };

  // Save answers for current page
  function saveCurrentPageAnswers() {
    const form = document.getElementById('maturity-form');
    if (!form) return;

    const inputs = form.querySelectorAll('input[type="radio"]:checked');
    inputs.forEach((input) => {
      localStorage.setItem(input.name, input.value);
    });
  }

  // Restore answers for current page
  function restoreCurrentPageAnswers() {
    const form = document.getElementById('maturity-form');
    if (!form) return;

    const inputs = form.querySelectorAll('input[type="radio"]');
    inputs.forEach((input) => {
      const savedValue = localStorage.getItem(input.name);
      if (savedValue && input.value === savedValue) {
        input.checked = true;
      }
    });
  }

  // Show results section
  function showResults() {
    const formSection = document.querySelector('.form-section');
    const resultsSection = document.getElementById('results-section');

    if (formSection) {
      formSection.style.display = 'none';
    }

    if (resultsSection) {
      resultsSection.style.display = 'block';
    }

    // Trigger the existing chart and scores calculation
    draw();
    updateScores();
  }
}