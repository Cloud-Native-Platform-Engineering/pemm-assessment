// Pagination variables (global scope)
let currentPage = 0;
let totalPages = 0;
let categoryPages = [];

// Global state to track all answers
let answerState = {};

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

  // Query-string key holding the content version a shareable link was built against.
  const VERSION_PARAM = 'v';

  // Query-string key holding which page of the assessment is open.
  const PAGE_PARAM = 'page';

  // Params that are not answers. Anything else in the query string is treated as one,
  // so every non-answer param must be listed here.
  const RESERVED_PARAMS = new Set(['lang', 'view', VERSION_PARAM, PAGE_PARAM]);

  // Page position is 1-based in the URL so it matches the "Page 3 of 5" indicator.
  // Switching language is a full navigation, so without this the reader is sent back
  // to the first page every time.
  function readPageFromURL(pageCount) {
    const page = Number.parseInt(
      new URLSearchParams(window.location.search).get(PAGE_PARAM),
      10
    );

    if (!Number.isInteger(page) || pageCount < 1) return 0;

    // Clamp rather than reject: a link shared before a category was added or removed
    // should still land somewhere sensible.
    return Math.min(Math.max(page - 1, 0), pageCount - 1);
  }

  // Version of the question set currently loaded, or null if data failed to load.
  function getContentVersion() {
    return questionsData?.metadata?.content_version || null;
  }

  function parseVersion(version) {
    const match = String(version ?? '').trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
    return match
      ? { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) }
      : null;
  }

  // A link is stale when the question set has gained, lost or renamed questions since it
  // was shared -- major and minor bumps. Patch bumps are wording-only, so the answers
  // still mean the same thing and there is nothing worth interrupting the user about.
  // Unparseable versions are ignored rather than guessed at.
  function isVersionMismatch(linkVersion, currentVersion) {
    const link = parseVersion(linkVersion);
    const current = parseVersion(currentVersion);

    if (!link || !current) return false;

    return link.major !== current.major || link.minor !== current.minor;
  }

  // The user-facing notice element lands in a follow-up PR. Toggling it here already, so
  // that PR only has to add the markup and its styling -- no JavaScript change needed.
  // No-ops until #version-notice exists.
  function setVersionNoticeVisible(visible) {
    const notice = document.getElementById('version-notice');
    if (notice) {
      notice.hidden = !visible;
    }
  }

  // Placeholder until the notice element ships: keeps a stale link observable, and lets
  // the detection path be verified before any UI exists.
  function reportVersionMismatch(linkVersion, currentVersion) {
    console.warn(
      `[pemm-assessment] This link was created with assessment version ${linkVersion}, ` +
      `but the current question set is ${currentVersion}. ` +
      `Results may not reflect the current model.`
    );
  }

  // Show which question set and upstream model the page is running, so a screenshot or a
  // shared result can be traced back to the content it was produced from.
  function renderVersionFooter() {
    const footer = document.getElementById('version-footer');
    if (!footer) return;

    const contentVersion = getContentVersion();
    const modelVersion = questionsData?.metadata?.model_version || null;
    const modelUrl = questionsData?.metadata?.model_url || null;

    const contentValue = document.getElementById('content-version-value');
    const modelValue = document.getElementById('model-version-value');
    const modelGroup = document.getElementById('model-version-group');
    const modelLink = document.getElementById('model-version-link');

    if (contentValue) contentValue.textContent = contentVersion ?? '';
    if (modelValue) modelValue.textContent = modelVersion ?? '';

    // Without an href the anchor renders as plain text, so a content file that omits
    // model_url still shows the model name -- it just is not clickable.
    if (modelLink) {
      if (modelUrl) {
        modelLink.href = modelUrl;
      } else {
        modelLink.removeAttribute('href');
      }
    }

    // Drop the model half rather than leaving a dangling label behind
    if (modelGroup) modelGroup.hidden = !modelVersion;

    // Nothing worth showing if the content file declares no version at all
    footer.hidden = !contentVersion;
  }

  // Update pagination button states (global scope)
  function updatePaginationControls() {
    const previous = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    const submit = document.getElementById('submit-btn');
    const backToAssessment = document.getElementById('app-return-button');
    const pageIndicator = document.getElementById('page-indicator');

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

    // Update page indicator text with translation support
    if (pageIndicator) {
      const template = questionsData?.metadata?.page_indicator_text || 'Page {current} of {total}';
      pageIndicator.textContent = template
        .replace('{current}', String(currentPage + 1))
        .replace('{total}', String(totalPages));
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

    // Runs after the data-text pass so the labels are localized before values fill in
    renderVersionFooter();

    // Store categories for pagination
    categoryPages = data.categories.sort((a, b) => a.order - b.order);
    totalPages = categoryPages.length;
    currentPage = readPageFromURL(totalPages);

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
      // Save answer to state
      answerState[e.target.name] = e.target.value;
      
      // Update scores and chart
      window.updateScores();
      window.saveStateToURL();
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

  // Helper: draw label with simple two-line wrap if text exceeds maxWidth
  function drawWrappedText(ctx, text, x, y, maxWidth) {
    const fullWidth = ctx.measureText(text).width;
    if (fullWidth <= maxWidth) {
      ctx.fillText(text, x, y + 5);
      return;
    }

    const words = String(text).split(' ');
    let line1 = '';
    let line2 = '';

    if (words.length > 1) {
      for (let i = 0; i < words.length; i++) {
        const candidate = line1 ? line1 + ' ' + words[i] : words[i];
        if (ctx.measureText(candidate).width <= maxWidth) {
          line1 = candidate;
        } else {
          line2 = words.slice(i).join(' ');
          break;
        }
      }
      if (!line1) {
        // Edge case: first word already exceeds; split word in half
        const w0 = words[0];
        const mid = Math.floor(w0.length / 2);
        line1 = w0.slice(0, mid);
        line2 = w0.slice(mid) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
      }
    } else {
      // No spaces, split approximately in half
      const mid = Math.max(1, Math.floor(String(text).length / 2));
      line1 = String(text).slice(0, mid);
      line2 = String(text).slice(mid);
    }

    // Draw the two lines centered near the intended label point
    ctx.fillText(line1, x, y - 2);
    ctx.fillText(line2, x, y + 10);
  }

  function drawSpiderChart() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;

    // Draw grid circles
    ctx.strokeStyle = '#c4c4c4';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 4) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw grid lines and labels
    ctx.strokeStyle = '#c4c4c4';
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

      // Draw label with simple two-line wrap for long text
      const labelX = centerX + Math.cos(angle) * (radius + 20);
      const labelY = centerY + Math.sin(angle) * (radius + 20);
      drawWrappedText(ctx, categoryName, labelX, labelY, 90);
    }

    // Draw level numbers
    ctx.fillStyle = '#c4c4c4';
    ctx.font = '10px Arial';
    for (let i = 1; i <= 4; i++) {
      ctx.fillText(i.toString(), centerX + 5, centerY - (radius / 4) * i + 3);
    }

    // Draw data polygon
    if (Object.values(scores).some((score) => score > 0)) {
      ctx.strokeStyle = '#d62293';
      ctx.fillStyle = 'rgba(120, 120, 120, 0.2)';
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
      ctx.fillStyle = "#d62293";
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
    // Read answers from answerState
    const answeredQuestions = [];
    let total = 0;

    // Check answerState for all questions in this category
    for (const key in answerState) {
      if (key.startsWith(`${category}_`)) {
        const value = answerState[key];
        if (value !== null && value !== undefined) {
          answeredQuestions.push(key);
          total += parseInt(value);
        }
      }
    }

    if (answeredQuestions.length === 0) return 0;
    return (total / answeredQuestions.length).toFixed(2);
  }

  function calculateCategoryCount(category) {
    // Read answers from answerState
    const count = {};

    // Initialize count object
    for (let i = 1; i <= maxValue; i++) {
      count[i] = 0;
    }

    // Check answerState for all questions in this category
    let hasAnswers = false;
    for (const key in answerState) {
      if (key.startsWith(`${category}_`)) {
        const value = answerState[key];
        if (value !== null && value !== undefined) {
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

  function updateLanguageSwitcher() {
    // Update all language switcher links to include current answer state
    const languageLinks = document.querySelectorAll('.languages a');
    
    if (!languageLinks.length) return; // No language switcher found
    
    languageLinks.forEach(link => {
      const linkURL = new URL(link.href, window.location.origin);
      const linkParams = new URLSearchParams(linkURL.search);
      const targetLang = linkParams.get('lang'); // Get the target language from the link
      
      // Build new params with all answers
      const newParams = new URLSearchParams();
      
      // Set language (or omit if it's the default/English)
      if (targetLang) {
        newParams.set('lang', targetLang);
      }
      
      // Add all current answers
      for (const key in answerState) {
        newParams.set(key, answerState[key]);
      }

      // These links are rebuilt from scratch, so the version stamp and page position have
      // to be re-applied or they would be dropped every time the user switches language.
      const contentVersion = getContentVersion();
      if (contentVersion && Object.keys(answerState).length) {
        newParams.set(VERSION_PARAM, contentVersion);
      }

      if (currentPage > 0) {
        newParams.set(PAGE_PARAM, String(currentPage + 1));
      }

      // Preserve current view if results are visible (so switching language stays on results)
      const resultsSection = document.getElementById('results-section');
      const isResultsVisible = resultsSection && resultsSection.style.display === 'block';
      // Also check URL param as a fallback
      const currentParams = new URLSearchParams(window.location.search);
      const urlView = currentParams.get('view');
      if (isResultsVisible || urlView === 'results') {
        newParams.set('view', 'results');
      }
      
      // Update the link
      const queryString = newParams.toString();
      link.href = window.location.pathname + (queryString ? '?' + queryString : '');
    });
  }

  function saveStateToURL() {
    const params = new URLSearchParams();

    // Preserve language parameter
    const currentParams = new URLSearchParams(window.location.search);
    const langParam = currentParams.get('lang');
    if (langParam) {
      params.set('lang', langParam);
    }

    // Add all answers from answerState
    for (const key in answerState) {
      params.set(key, answerState[key]);
    }

    // Stamp the question-set version, but only once there are answers to qualify.
    // A visitor who has not answered anything yet keeps a clean, unversioned URL.
    const contentVersion = getContentVersion();
    if (contentVersion && Object.keys(answerState).length) {
      params.set(VERSION_PARAM, contentVersion);
    }

    // Only past the first page, so the entry URL stays clean
    if (currentPage > 0) {
      params.set(PAGE_PARAM, String(currentPage + 1));
    }

    // Preserve current view state (results vs assessment)
    const resultsSection = document.getElementById('results-section');
    const isResultsVisible = resultsSection && resultsSection.style.display === 'block';
    if (isResultsVisible) {
      params.set('view', 'results');
    }

    const newURL = window.location.pathname + "?" + params.toString();
    window.history.replaceState({}, "", newURL);

    updateLanguageSwitcher();
  }

  function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    const linkVersion = params.get(VERSION_PARAM);

    // Clear existing state
    answerState = {};

    // Every param that is not reserved is treated as an answer
    for (const [key, value] of params.entries()) {
      if (!RESERVED_PARAMS.has(key)) {
        answerState[key] = value;
      }
    }

    // Apply loaded state to visible form elements
    for (const [key, value] of Object.entries(answerState)) {
      const radio = maturityForm.querySelector(
        `input[name="${key}"][value="${value}"]`
      );

      if (radio) {
        radio.checked = true;
      }
    }

    // Warn only when a shared link carried both answers and a version that no longer
    // matches the current question set. Answers are never discarded.
    const currentVersion = getContentVersion();
    const mismatched =
      Boolean(linkVersion) &&
      Object.keys(answerState).length > 0 &&
      isVersionMismatch(linkVersion, currentVersion);

    if (mismatched) {
      reportVersionMismatch(linkVersion, currentVersion);
    }

    setVersionNoticeVisible(mismatched);

    updateScores();
  }

  // Make these functions globally accessible for pagination
  window.saveStateToURL = saveStateToURL;
  window.updateScores = updateScores;
  window.draw = draw;
  window.updatePaginationControls = updatePaginationControls;

  function getShareableURL() {
    return window.location.href;
  }

  function revert(elem, text) {
    elem.innerText = text;
  }

  async function copyURLToClipboard(elem) {
    const copyMessages = await getCurrentLanguageCopyMessages();
    const originalText = elem.innerText;

    const shareableURL = getShareableURL();;

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

    // If URL indicates results view, show results immediately
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'results') {
      showResults();
      // Ensure URL reflects current state (including view)
      saveStateToURL();
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
}

// Save answers for current page to answerState
function saveCurrentPageAnswers() {
  const form = document.getElementById("maturity-form");
  if (!form) return;

  const inputs = form.querySelectorAll('input[type="radio"]:checked');
  inputs.forEach((input) => {
    answerState[input.name] = input.value;
  });
  
  // Update URL with all state
  window.saveStateToURL();
}

// Restore answers for current page from answerState
function restoreCurrentPageAnswers() {
  const form = document.getElementById("maturity-form");
  if (!form) return;

  const inputs = form.querySelectorAll('input[type="radio"]');
  inputs.forEach((input) => {
    const savedValue = answerState[input.name];
    if (savedValue && input.value === savedValue) {
      input.checked = true;
    }
  });
}

// Global pagination functions (accessible from HTML)
window.nextPage = function () {
  if (currentPage < totalPages - 1) {
    // Answers first: this reads the radios that are about to be replaced
    saveCurrentPageAnswers();
    currentPage++;
    renderCurrentPage();
    window.updatePaginationControls();
    // Re-sync the URL now that currentPage has moved, since saveCurrentPageAnswers()
    // wrote it using the page we just left
    window.saveStateToURL();
    // Scroll to top of page for better UX
    window.scrollTo(0, 0);
  }
};

window.previousPage = function () {
  if (currentPage > 0) {
    // Answers first: this reads the radios that are about to be replaced
    saveCurrentPageAnswers();
    currentPage--;
    renderCurrentPage();
    window.updatePaginationControls();
    // Re-sync the URL now that currentPage has moved, since saveCurrentPageAnswers()
    // wrote it using the page we just left
    window.saveStateToURL();
    // Scroll to top of page for better UX
    window.scrollTo(0, 0);
  }
};

window.submitAssessment = function () {
  saveCurrentPageAnswers();
  showResults();
  // Persist results view in the URL so it can be restored or preserved when changing language
  window.saveStateToURL();
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
    window.updatePaginationControls();
    restoreCurrentPageAnswers();
  }
  // Remove results view from the URL
  window.saveStateToURL();
};

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
  window.draw();
  window.updateScores();
}