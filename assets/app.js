// Pagination variables (global scope)
let currentPage = 0;
let totalPages = 0;
let categoryPages = [];

(function() {
  // YAML data storage
  let questionsData = null;

  // Load YAML data
  async function loadQuestionsData() {
    // Determine language from URL path, query parameter, or default to English
    let langCode = 'en';
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // Check for language parameter in URL
    if (params.get('lang') === 'zh') {
      langCode = 'zh';
    } else if (params.get('lang') === 'es') {
      langCode = 'es';
    }
    // Check for Chinese path (legacy support)
    else if (path.includes('/zh/') || path.endsWith('/zh')) {
      langCode = 'zh';
    }
    // Check for language parameter in hash
    else if (window.location.hash.includes('lang=zh')) {
      langCode = 'zh';
    } else if (window.location.hash.includes('lang=es')) {
      langCode = 'es';
    }

    // Try different path patterns for GitHub Pages vs local development
    let yamlFileName;
    switch(langCode) {
      case 'zh':
        yamlFileName = 'questions-zh.yaml';
        break;
      case 'es':
        yamlFileName = 'questions-es.yaml';
        break;
      default:
        yamlFileName = 'questions-en.yaml';
    }

    const yamlPaths = [
      `/pemm-assessment/data/${yamlFileName}`,
      `./data/${yamlFileName}`,
      `../data/${yamlFileName}`,
      `data/${yamlFileName}`
    ];

    for (const yamlPath of yamlPaths) {
      try {
        console.log('Attempting to load YAML file:', yamlPath);
        const response = await fetch(yamlPath);
        if (response.ok) {
          const yamlText = await response.text();
          questionsData = jsyaml.load(yamlText);
          console.log('Successfully loaded questions data from:', yamlPath);

          // Update page language attribute
          document.documentElement.lang = langCode;

          return questionsData;
        }
      } catch (error) {
        console.log('Failed to load from:', yamlPath, error.message);
      }
    }

    console.error('Could not load YAML data from any path');
    console.log('Falling back to static HTML structure');
    return null;
  }    // Generate form HTML from YAML data with pagination
  function generateFormFromData(data) {
    if (!data) return;

    const form = document.getElementById('maturity-form');
    if (!form) return;

    // Update page metadata using the new IDs
    const titleElement = document.getElementById('app-title');
    const mainTitleElement = document.getElementById('app-main-title');
    const introElement = document.getElementById('app-intro');
    const resultsTitleElement = document.getElementById('app-results-title');
    const feedbackMessageElement = document.getElementById('app-feedback-message');
    const copyLinkElement = document.getElementById('app-copy-link');
    const shareFeedbackElement = document.getElementById('app-share-feedback');
    const languageDropdownElement = document.getElementById('language-dropdown');

    if (titleElement) titleElement.textContent = data.metadata.title;
    if (mainTitleElement) mainTitleElement.textContent = data.metadata.title;
    if (introElement) introElement.innerHTML = data.metadata.intro;
    if (resultsTitleElement) resultsTitleElement.textContent = data.metadata.results_title;
    if (feedbackMessageElement) feedbackMessageElement.textContent = data.metadata.feedback_message;
    if (copyLinkElement) copyLinkElement.textContent = data.metadata.copy_link_text;
    if (shareFeedbackElement) shareFeedbackElement.textContent = data.metadata.share_feedback_text;

    // Update language selector (dropdown only, no label)
    if (languageDropdownElement) {
      languageDropdownElement.innerHTML = `
        <option value="en">${data.metadata.language_english}</option>
        <option value="zh">${data.metadata.language_chinese}</option>
        <option value="es">${data.metadata.language_spanish}</option>
      `;
      languageDropdownElement.value = data.metadata.language;
    }

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

    // Calculate maxValue from all inputs across all pages
    inputs.forEach((input) => {
      const value = parseInt(input.value);
      if (!isNaN(value)) {
        maxValue = Math.max(maxValue, value);
      }
    });

    // Also check YAML data for maxValue to ensure we get all possible values
    if (categoryPages && categoryPages.length > 0) {
      categoryPages.forEach((categoryData) => {
        if (categoryData.questions) {
          categoryData.questions.forEach((question) => {
            if (question.options) {
              question.options.forEach((option) => {
                const value = parseInt(option.value);
                if (!isNaN(value)) {
                  maxValue = Math.max(maxValue, value);
                }
              });
            }
          });
        }
      });
    }

    // Re-add event listeners for new radio buttons
    document.addEventListener("change", handleRadioChange);

    // Load state from URL and draw charts
    loadStateFromURL();
  }

  // Handle radio button changes
  function handleRadioChange(e) {
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
  }

  // Languages
  const languages = [
    {
      code: "en",
      name: "English",
      url: "/pemm-assessment/",
      copySuccess: "📋 Copied!",
      copyFail: "Failed! Please copy from address bar."
    },
    {
      code: "zh",
      name: "中文(Chinese)",
      url: "/pemm-assessment/zh/",
      copySuccess: "📋 已复制！",
      copyFail: "复制失败！请尝试从地址栏复制。"
    }
  ];

  // Chart setup
  const canvas = document.getElementById("maturity-spider");
  const ctx = canvas.getContext("2d");

  // Elements
  const maturityForm = document.getElementById("maturity-form");
  const legends = maturityForm ? maturityForm.querySelectorAll("legend[data-category]") : [];
  const inputs = maturityForm ? maturityForm.querySelectorAll("input") : [];
  const matrix = document.getElementById("maturity-matrix");
  const scoreList = document.getElementById("maturity-scores");

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

  function drawLanguageSwitcher() {
    const options = languages
      .map((lang) =>`<li><a href="${lang.url}">${lang.name}</option></li>`).join("");
    document.body.insertAdjacentHTML('afterbegin', `
      <nav class="languages">
      <ul>
      ${options}
      </ul>
      </nav>`);
  }

  function getLanguage() {
    const path = window.location.pathname;
    for (let lang of languages) {
      if (lang.url === path) {
        console.log("Detected language:", lang.code);
        return lang;
      }
    }

    return null;
  }

  const lang = getLanguage();

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
        elem.innerText = lang.copySuccess;
        console.log('copied');
        window.setTimeout(() => revert(elem, originalText), 2000);
      })
      .catch(function (err) {
        elem.innerText = lang.copySuccess;
        window.setTimeout(() => revert(elem, originalText), 2000);
      });
  }

  // Radio button clicks (removed - now handled in handleRadioChange)

  document.addEventListener("DOMContentLoaded", async function () {
    // Try to load YAML data first
    const yamlData = await loadQuestionsData();

    if (yamlData) {
      // Generate form from YAML data
      generateFormFromData(yamlData);
    } else {
      // Fallback to existing HTML structure
      loadStateFromURL();
    }

    // drawLanguageSwitcher(); // Now using static HTML nav instead
    draw();
  });

  // Initial chart draw
  draw();
})(); // End of IIFE

// Render the current page content (global scope for access from pagination functions)
function renderCurrentPage() {
  const form = document.getElementById('maturity-form');
  const pageIndicator = document.getElementById('page-indicator');
  const introSection = document.getElementById('intro-section');
  
  if (!form || !categoryPages.length) return;
  
  // Update page indicator
  if (pageIndicator) {
    pageIndicator.textContent = `Page ${currentPage + 1} of ${totalPages}`;
  }
  
  // Show/hide intro based on page
  if (introSection) {
    introSection.style.display = currentPage === 0 ? 'block' : 'none';
  }
  
  // Get current category
  const category = categoryPages[currentPage];
  
  // Generate HTML for current page
  let formHTML = `
    <fieldset>
      <legend data-category="${category.id}">${category.name}</legend>
  `;

  category.questions.forEach(question => {
    formHTML += `
      <div class="question-group">
        <div class="question">${question.text}</div>
        <div class="options">
    `;

    question.options.forEach(option => {
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
}

// Update pagination button states (global scope)
function updatePaginationControls() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');
  
  if (prevBtn) prevBtn.disabled = currentPage === 0;
  
  if (currentPage === totalPages - 1) {
    if (nextBtn) nextBtn.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'inline-block';
  } else {
    if (nextBtn) nextBtn.style.display = 'inline-block';
    if (submitBtn) submitBtn.style.display = 'none';
  }
}

// Save answers for current page (global scope)
function saveCurrentPageAnswers() {
  const form = document.getElementById('maturity-form');
  if (!form) return;
  
  const inputs = form.querySelectorAll('input[type="radio"]:checked');
  inputs.forEach(input => {
    localStorage.setItem(input.name, input.value);
  });
}

// Restore answers for current page (global scope)
function restoreCurrentPageAnswers() {
  const form = document.getElementById('maturity-form');
  if (!form) return;
  
  const inputs = form.querySelectorAll('input[type="radio"]');
  inputs.forEach(input => {
    const savedValue = localStorage.getItem(input.name);
    if (savedValue && input.value === savedValue) {
      input.checked = true;
    }
  });
}

// Global function for language switching (accessible from HTML onclick)
window.changeLanguage = function(langCode) {
  const currentUrl = new URL(window.location);

  // Update the language parameter
  if (langCode === 'zh' || langCode === 'es') {
    currentUrl.searchParams.set('lang', langCode);
  } else {
    currentUrl.searchParams.delete('lang');
  }

  // Navigate to the new URL
  window.location.href = currentUrl.toString();
};

// Function to set the dropdown to the current language
window.updateLanguageDropdown = function() {
  const dropdown = document.getElementById('language-dropdown');
  if (!dropdown) return;

  // Determine current language
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname;
  let currentLang = 'en';

  if (params.get('lang') === 'zh' || path.includes('/zh/') || path.endsWith('/zh')) {
    currentLang = 'zh';
  } else if (params.get('lang') === 'es') {
    currentLang = 'es';
  }

  // Set dropdown value
  dropdown.value = currentLang;
};

// Update dropdown when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Small delay to ensure dropdown is rendered
  setTimeout(window.updateLanguageDropdown, 100);
});

// Global pagination functions (accessible from HTML)
window.nextPage = function() {
  if (currentPage < totalPages - 1) {
    saveCurrentPageAnswers();
    currentPage++;
    renderCurrentPage();
    updatePaginationControls();
    restoreCurrentPageAnswers();
  }
};

window.previousPage = function() {
  if (currentPage > 0) {
    saveCurrentPageAnswers();
    currentPage--;
    renderCurrentPage();
    updatePaginationControls();
    restoreCurrentPageAnswers();
  }
};

window.submitAssessment = function() {
  saveCurrentPageAnswers();
  showResults();
};

window.returnToAssessment = function() {
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
  inputs.forEach(input => {
    localStorage.setItem(input.name, input.value);
  });
}

// Restore answers for current page
function restoreCurrentPageAnswers() {
  const form = document.getElementById('maturity-form');
  if (!form) return;

  const inputs = form.querySelectorAll('input[type="radio"]');
  inputs.forEach(input => {
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

  if (formSection) formSection.style.display = 'none';
  if (resultsSection) resultsSection.style.display = 'block';

  // Trigger the existing chart and scores calculation
  draw();
  updateScores();
}

