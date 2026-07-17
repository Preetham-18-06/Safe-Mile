
let contactsData = null;


async function loadContacts() {
  try {
    const response = await fetch('data/contacts.json');
    contactsData = await response.json();

    renderNationalNumbers();
    renderHighwayMap();
    renderQuickShortcuts();
    populateManualSelects();
    initLocationDetection();
    initCollapsibleSections();
  } catch (error) {
    console.error('Failed to load contacts.json:', error);
    document.getElementById('nationalNumbersList').innerHTML =
      '<p>Could not load emergency numbers. Please refresh the page.</p>';
  }
}


function renderNationalNumbers() {
  const container = document.getElementById('nationalNumbersList');
  container.innerHTML = ''; 

  contactsData.nationalNumbers.forEach(contact => {
    container.innerHTML += createContactCardHTML(contact.name, contact.number, contact.description, contact.icon);
  });
}


function renderQuickShortcuts() {
  const container = document.getElementById('quickShortcuts');
  container.innerHTML = '';

  contactsData.highwayContacts.forEach(contact => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'shortcut-chip';
    chip.textContent = contact.highway;
    chip.addEventListener('click', () => {
      document.getElementById('searchInput').value = contact.highway;
      handleSearch();
      document.getElementById('searchInput').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    container.appendChild(chip);
  });
}






function findNationalNumber(nameContains) {
  return contactsData.nationalNumbers.find(n =>
    n.name.toLowerCase().includes(nameContains.toLowerCase())
  );
}


function renderStateNumbers(stateName) {
  const container = document.getElementById('stateNumbersList');
  const section = document.getElementById('state-section');
  container.innerHTML = '';

  const police = findNationalNumber('Police');
  const fire = findNationalNumber('Fire');
  const disaster = findNationalNumber('State Disaster');
  const ambulance = findNationalNumber('Ambulance');

  container.innerHTML += `<p class="fallback-note">State-specific numbers for ${stateName} are not verified in this sample dataset - showing national numbers as a reliable fallback.</p>`;
  container.innerHTML += createContactCardHTML(`${stateName} Police Control Room`, police.number, 'Fallback: national police number', '👮');
  container.innerHTML += createContactCardHTML(`${stateName} Disaster Management`, disaster.number, 'Fallback: national disaster helpline', '🌪️');
  container.innerHTML += createContactCardHTML(`${stateName} Fire Department`, fire.number, 'Fallback: national fire number', '🔥');
  container.innerHTML += createContactCardHTML(`${stateName} Ambulance Services`, ambulance.number, 'Fallback: national ambulance number', '🚑');

  section.style.display = 'block';
}


function renderDistrictNumbers(districtName, stateName) {
  const container = document.getElementById('districtNumbersList');
  const section = document.getElementById('district-section');
  container.innerHTML = '';

  const matchedDistrict = contactsData.highwayContacts.find(c =>
    c.district.toLowerCase() === districtName.toLowerCase()
  );

  const police = findNationalNumber('Police');
  const fire = findNationalNumber('Fire');
  const hospital = findNationalNumber('Medical Emergency');
  const ambulance = findNationalNumber('Ambulance');

  if (matchedDistrict) {
    container.innerHTML += createContactCardHTML(
      `${districtName} Control Room (${matchedDistrict.highway})`,
      matchedDistrict.controlRoom,
      matchedDistrict.note,
      '🛣️'
    );
  } else {
    container.innerHTML += `<p class="fallback-note">No highway control room on file for ${districtName} - showing national helpline instead.</p>`;
    container.innerHTML += createContactCardHTML(`${districtName} Control Room`, '1033', 'Fallback: national highway helpline', '🛣️');
  }

  container.innerHTML += `<p class="fallback-note">Police, Fire, Hospital and Ambulance numbers below are national fallbacks - district-specific numbers are not verified in this sample dataset.</p>`;
  container.innerHTML += createContactCardHTML(`${districtName} Police Control Room`, police.number, 'Fallback: national police number', '👮');
  container.innerHTML += createContactCardHTML(`${districtName} Fire Department`, fire.number, 'Fallback: national fire number', '🔥');
  container.innerHTML += createContactCardHTML(`${districtName} Government Hospital`, hospital.number, 'Fallback: national medical emergency number', '⚕️');
  container.innerHTML += createContactCardHTML(`${districtName} Ambulance Services`, ambulance.number, 'Fallback: national ambulance number', '🚑');

  section.style.display = 'block';
}


function populateManualSelects() {
  const stateSelect = document.getElementById('manualStateSelect');
  const districtSelect = document.getElementById('manualDistrictSelect');

  const uniqueStates = [...new Set(contactsData.highwayContacts.map(c => c.state))].sort();
  const uniqueDistricts = [...new Set(contactsData.highwayContacts.map(c => c.district))].sort();

  uniqueStates.forEach(state => {
    const opt = document.createElement('option');
    opt.value = state;
    opt.textContent = state;
    stateSelect.appendChild(opt);
  });

  uniqueDistricts.forEach(district => {
    const opt = document.createElement('option');
    opt.value = district;
    opt.textContent = district;
    districtSelect.appendChild(opt);
  });

  stateSelect.addEventListener('change', () => {
    if (stateSelect.value) {
      renderStateNumbers(stateSelect.value);
      document.getElementById('state-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  districtSelect.addEventListener('change', () => {
    if (districtSelect.value) {
      const matched = contactsData.highwayContacts.find(c => c.district === districtSelect.value);
      renderDistrictNumbers(districtSelect.value, matched ? matched.state : '');
      document.getElementById('district-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}



function renderCurrentLocationDisplay(city, district, state, pin) {
  const display = document.getElementById('currentLocationDisplay');
  const parts = [city, district, state].filter(Boolean);
  display.innerHTML = `
    <div class="location-detected-row">
      <span class="loc-icon">📍</span>
      <div class="loc-text">
        <strong>${parts.join(', ') || 'Location detected'}</strong>
        <span>${pin ? 'PIN: ' + pin : 'PIN code not available'}</span>
      </div>
    </div>
  `;
}


async function reverseGeocode(lat, lng) {
  
  const cacheKey = `geocode_${lat.toFixed(3)}_${lng.toFixed(3)}`;
  const cached = sessionStorage.getItem(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    { headers: { 'Accept-Language': 'en' } }
  );

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with status ${response.status}`);
  }

  const data = await response.json();
  sessionStorage.setItem(cacheKey, JSON.stringify(data));
  return data;
}


function getCurrentPositionPromise(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}


async function detectLocation(attempt = 1) {
  const detectButton = document.getElementById('detectLocationButton');
  const statusBox = document.getElementById('locationStatus');
  const maxAttempts = 2;

  if (!navigator.geolocation) {
    statusBox.textContent = 'Location detection is not supported on this browser. Please select manually below.';
    return;
  }

  detectButton.disabled = true;
  detectButton.textContent = attempt > 1 ? 'Retrying...' : 'Detecting...';
  statusBox.textContent = '';
  statusBox.classList.remove('detected');

  try {
    const position = await getCurrentPositionPromise({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    const data = await reverseGeocode(lat, lng);
    const address = data.address || {};

    const state = address.state || '';
    const district = address.state_district || address.county || address.city_district || '';
    const city = address.city || address.town || address.village || '';
    const pin = address.postcode || '';

    if (!state && !district && !city) {
      throw new Error('No usable address data returned');
    }

    renderCurrentLocationDisplay(city, district, state, pin);

    if (state) renderStateNumbers(state);
    if (district) renderDistrictNumbers(district, state);

    statusBox.textContent = 'Location detected successfully.';
    statusBox.classList.add('detected');

  } catch (error) {
    console.error('Location detection error:', error);

    
    if (attempt < maxAttempts && (error.code === 3 || error.message)) {
      detectButton.disabled = false;
      return detectLocation(attempt + 1);
    }

    
    if (error.code === 1) {
      statusBox.textContent = 'Location permission denied. Showing national numbers only - please select your state/district manually below.';
    } else if (error.code === 2) {
      statusBox.textContent = 'Your location could not be determined (position unavailable). Please select manually below.';
    } else if (error.code === 3) {
      statusBox.textContent = 'Location request timed out. Please try again or select manually below.';
    } else {
      statusBox.textContent = 'Could not determine your location. Please select manually below.';
    }

    document.getElementById('currentLocationDisplay').innerHTML =
      '<p class="location-placeholder">Location not detected. Use manual selection below.</p>';
  }

  detectButton.disabled = false;
  detectButton.textContent = '📍 Detect / Refresh Location';
}

function initLocationDetection() {
  const detectButton = document.getElementById('detectLocationButton');

  detectButton.addEventListener('click', () => detectLocation());

  
  
  setTimeout(() => {
    if (navigator.geolocation) {
      detectLocation();
    }
  }, 800);
}


function initCollapsibleSections() {
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      const targetId = header.getAttribute('data-target');
      const content = document.getElementById(targetId);
      header.classList.toggle('collapsed');
      content.classList.toggle('collapsed');
    });
  });
}



const districtCoordinates = {
  'Nagpur': [21.1458, 79.0882],
  'Bengaluru Rural': [13.2846, 77.5946],
  'Visakhapatnam': [17.6868, 83.2185],
  'Kanpur': [26.4499, 80.3319],
  'Ahmedabad': [23.0225, 72.5714],
  'New Delhi': [28.6139, 77.2090],
  'Mangalore': [12.9141, 74.8560],
  'Jaipur': [26.9124, 75.7873],
  'Kolkata': [22.5726, 88.3639],
  'Hyderabad': [17.3850, 78.4867],
  'Lucknow': [26.8467, 80.9462],
  'Vadodara': [22.3072, 73.1812],
  'Varanasi': [25.3176, 82.9739],
  'Bhubaneswar': [20.2961, 85.8245],
  'Kochi': [9.9312, 76.2673],
  'Pune': [18.5204, 73.8567],
  'Chandigarh': [30.7333, 76.7794],
  'Guwahati': [26.1445, 91.7362],
  'Chennai': [13.0827, 80.2707],
  'Siliguri': [26.7271, 88.3953]
};

function renderHighwayMap() {
  const map = L.map('highwayMap').setView([20.5937, 78.9629], 5); 

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  contactsData.highwayContacts.forEach(contact => {
    const coords = districtCoordinates[contact.district];
    if (!coords) return; 

    L.marker(coords)
      .addTo(map)
      .bindPopup(`<strong>${contact.highway}</strong><br>${contact.district}, ${contact.state}<br>Call: ${contact.controlRoom}`);
  });
}


function createContactCardHTML(title, number, description, icon) {
  const iconHtml = icon ? `<span class="card-icon">${icon}</span>` : '';
  
  const safeTitle = title.replace(/'/g, "\\'");

  return `
    <div class="contact-card">
      ${iconHtml}
      <div class="info">
        <strong>${title}</strong>
        <span>${description}</span>
      </div>
      <div class="card-actions">
        <a class="call-btn" href="tel:${number}">Call ${number}</a>
        <button type="button" class="icon-btn" title="Copy number" onclick="copyContactNumber('${number}', this)">📋</button>
        <button type="button" class="icon-btn" title="Share" onclick="shareContact('${safeTitle}', '${number}')">↗️</button>
      </div>
    </div>
  `;
}

// ---------- Copy / Share helpers for contact cards ----------
function copyContactNumber(number, buttonEl) {
  navigator.clipboard.writeText(number).then(() => {
    const original = buttonEl.textContent;
    buttonEl.textContent = '✅';
    setTimeout(() => { buttonEl.textContent = original; }, 1200);
  });
}

function shareContact(title, number) {
  const message = `${title}: ${number}`;

  if (navigator.share) {
    navigator.share({ text: message }).catch(() => {
      // user cancelled share - no action needed
    });
  } else {
    navigator.clipboard.writeText(message);
    alert('Copied to clipboard: ' + message);
  }
}

// ---------- Fuzzy matching helper (Levenshtein distance) ----------
// Measures how many single-character edits separate two strings.
// A small distance relative to word length means "close enough" - handles typos.
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Checks if the query reasonably matches a field - either as a direct substring,
// or as a "close enough" typo (small edit distance relative to word length).
function fuzzyIncludes(field, query) {
  const fieldLower = field.toLowerCase();
  const queryLower = query.toLowerCase();

  if (fieldLower.includes(queryLower)) {
    return true;
  }

  // Compare query against each word in the field for typo tolerance
  const words = fieldLower.split(/\s+/);
  const maxAllowedDistance = queryLower.length <= 4 ? 1 : 2; // stricter for short queries

  return words.some(word => levenshteinDistance(word, queryLower) <= maxAllowedDistance);
}

// ---------- Search logic (fuzzy, typo-tolerant) ----------
function handleSearch() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const resultsContainer = document.getElementById('searchResults');

  resultsContainer.innerHTML = '';

  // If search box is empty, show nothing extra (national numbers are always visible separately)
  if (query === '') {
    return;
  }

  // Match against district/highway/state data
  const districtMatches = contactsData.highwayContacts.filter(contact => {
    return (
      fuzzyIncludes(contact.highway, query) ||
      fuzzyIncludes(contact.state, query) ||
      fuzzyIncludes(contact.district, query)
    );
  });

  // Also match against national service names (e.g. searching "ambulance" or "cyber")
  const serviceMatches = contactsData.nationalNumbers.filter(contact =>
    fuzzyIncludes(contact.name, query)
  );

  if (districtMatches.length === 0 && serviceMatches.length === 0) {
    resultsContainer.innerHTML = '<p>No specific match found. Use the national numbers above.</p>';
    return;
  }

  serviceMatches.forEach(contact => {
    resultsContainer.innerHTML += createContactCardHTML(contact.name, contact.number, contact.description, contact.icon);
  });

  districtMatches.forEach(contact => {
    const title = `${contact.highway} - ${contact.district}, ${contact.state}`;
    const description = contact.note;
    resultsContainer.innerHTML += createContactCardHTML(title, contact.controlRoom, description, '🛣️');
  });
}

// ---------- Autocomplete suggestions ----------
function renderAutocomplete() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const listContainer = document.getElementById('autocompleteList');

  if (query === '') {
    listContainer.style.display = 'none';
    listContainer.innerHTML = '';
    return;
  }

  const districtMatches = contactsData.highwayContacts.filter(contact => {
    return (
      fuzzyIncludes(contact.highway, query) ||
      fuzzyIncludes(contact.state, query) ||
      fuzzyIncludes(contact.district, query)
    );
  }).map(c => ({ label: c.highway, sub: `${c.district}, ${c.state}` }));

  const serviceMatches = contactsData.nationalNumbers.filter(contact =>
    fuzzyIncludes(contact.name, query)
  ).map(c => ({ label: c.name, sub: `National service - ${c.number}` }));

  const combined = [...serviceMatches, ...districtMatches].slice(0, 6); // limit to 6 suggestions

  if (combined.length === 0) {
    listContainer.style.display = 'none';
    listContainer.innerHTML = '';
    return;
  }

  listContainer.innerHTML = combined.map(item => `
    <div class="autocomplete-item" data-fill="${item.label}">
      <span class="match-highway">${item.label}</span>
      <span class="match-location"> - ${item.sub}</span>
    </div>
  `).join('');

  listContainer.style.display = 'block';

  // Attach click handlers to each suggestion
  listContainer.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      const searchInput = document.getElementById('searchInput');
      searchInput.value = item.getAttribute('data-fill');
      listContainer.style.display = 'none';
      handleSearch();
    });
  });
}

// ---------- Small debounce helper (avoids re-running search on every keystroke) ----------
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ---------- Attach event listeners to search input (debounced for performance) ----------
const debouncedSearch = debounce(() => {
  handleSearch();
  renderAutocomplete();
}, 150);

document.getElementById('searchInput').addEventListener('input', debouncedSearch);

// Hide autocomplete dropdown when clicking outside it
document.addEventListener('click', (event) => {
  const searchInput = document.getElementById('searchInput');
  const listContainer = document.getElementById('autocompleteList');
  if (event.target !== searchInput && !listContainer.contains(event.target)) {
    listContainer.style.display = 'none';
  }
});

// =====================================================
// STEP 3A: Rule-based emergency classification (safety net)
// This ALWAYS decides the number to call - never left to the AI's guess.
// =====================================================
function classifyEmergency(text) {
  const lowerText = text.toLowerCase();

  const rules = [
    {
      type: 'Fire',
      keywords: ['fire', 'smoke', 'burning', 'explosion'],
      number: '101',
      numberLabel: 'Fire Department (101)'
    },
    {
      type: 'Medical Emergency',
      keywords: ['heart attack', 'unconscious', 'not breathing', 'bleeding heavily', 'medical', 'health'],
      number: '108',
      numberLabel: 'Ambulance (108)'
    },
    {
      type: 'Crime / Safety Threat',
      keywords: ['robbery', 'attacked', 'theft', 'assault', 'threat'],
      number: '100',
      numberLabel: 'Police (100)'
    },
    {
      type: 'Road Accident',
      keywords: ['accident', 'crash', 'collision', 'hit', 'overturned', 'injured'],
      number: '1033',
      numberLabel: 'National Highway Helpline (1033)'
    },
    {
      type: 'Vehicle Breakdown',
      keywords: ['breakdown', 'flat tyre', 'flat tire', 'stuck', 'stalled', 'engine failure'],
      number: '1033',
      numberLabel: 'National Highway Helpline (1033)'
    }
  ];

  for (const rule of rules) {
    if (rule.keywords.some(keyword => lowerText.includes(keyword))) {
      return rule;
    }
  }

  // Default fallback if no keyword matches
  return {
    type: 'General Emergency',
    keywords: [],
    number: '112',
    numberLabel: 'National Emergency Number (112)'
  };
}

// ---------- Start everything when the page loads ----------
loadContacts();

// =====================================================
// Feature: Voice Input (Web Speech API)
// =====================================================
function initVoiceInput() {
  const micButton = document.getElementById('voiceButton');
  const situationInput = document.getElementById('situationInput');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    micButton.style.display = 'none'; // hide mic button if browser doesn't support it
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;

  let isListening = false;

  micButton.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
      return;
    }
    recognition.start();
  });

  recognition.addEventListener('start', () => {
    isListening = true;
    micButton.classList.add('listening');
  });

  recognition.addEventListener('end', () => {
    isListening = false;
    micButton.classList.remove('listening');
  });

  recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript;
    situationInput.value = transcript;
  });

  recognition.addEventListener('error', () => {
    isListening = false;
    micButton.classList.remove('listening');
  });
}

initVoiceInput();

// =====================================================
// Feature: Share Live Location
// =====================================================
document.getElementById('shareLocationButton').addEventListener('click', handleShareLocation);

function handleShareLocation() {
  const resultBox = document.getElementById('locationResult');
  const button = document.getElementById('shareLocationButton');

  if (!navigator.geolocation) {
    resultBox.style.display = 'block';
    resultBox.innerHTML = '<p>Location access is not supported on this browser.</p>';
    return;
  }

  button.disabled = true;
  button.textContent = 'Getting location...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(5);
      const lng = position.coords.longitude.toFixed(5);
      const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

      const message = `Emergency! I need help. My live location: ${mapsLink}`;

      resultBox.style.display = 'block';
      resultBox.innerHTML = `
        <p><strong>Your location:</strong> ${lat}, ${lng}</p>
        <p><a href="${mapsLink}" target="_blank" rel="noopener">Open in Google Maps</a></p>
        <p style="margin-top: 8px;">"${message}"</p>
        <button type="button" class="copy-btn" id="copyLocationBtn">Copy Message</button>
      `;

      document.getElementById('copyLocationBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(message);
        document.getElementById('copyLocationBtn').textContent = 'Copied!';
      });

      button.disabled = false;
      button.textContent = '📍 Share My Live Location';
    },
    (error) => {
      resultBox.style.display = 'block';
      resultBox.innerHTML = '<p>Could not get your location. Please check location permissions and try again.</p>';
      button.disabled = false;
      button.textContent = '📍 Share My Live Location';
    }
  );
}

// =====================================================
// Dark mode toggle
// =====================================================
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const toggleButton = document.getElementById('themeToggle');

  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleButton.textContent = '☀️';
  }

  toggleButton.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      toggleButton.textContent = '🌙';
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      toggleButton.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    }
  });
}

initTheme();

// =====================================================
// STEP 3C: Connect "Get Help" button to the AI assistant
// =====================================================
document.getElementById('askAIButton').addEventListener('click', handleAskAI);

async function handleAskAI() {
  const situationText = document.getElementById('situationInput').value.trim();
  const responseBox = document.getElementById('aiResponse');
  const button = document.getElementById('askAIButton');

  if (situationText === '') {
    responseBox.style.display = 'block';
    responseBox.innerHTML = '<p>Please describe the situation first.</p>';
    return;
  }

  // Step 1: Use OUR rule-based logic to decide the number (safety net - always reliable)
  const classification = classifyEmergency(situationText);

  // Show a loading state immediately, and show the number right away
  // (never make the user wait for AI just to see WHICH number to call)
  button.disabled = true;
  button.textContent = 'Getting guidance...';
  responseBox.style.display = 'block';
  responseBox.innerHTML = `
    <p><strong>Situation type:</strong> ${classification.type}</p>
    ${createContactCardHTML(classification.type, classification.number, 'Recommended number based on your description')}
    <div class="spinner-wrap"><div class="spinner"></div> Getting action steps and message...</div>
  `;

  // Step 2: Ask Gemini (via our serverless function) for action steps + shareable message
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        situation: situationText,
        emergencyType: classification.type,
        numberLabel: classification.numberLabel
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }

    // Build the action steps list
    const stepsHTML = data.actionSteps
      .map(step => `<li>${step}</li>`)
      .join('');

    responseBox.innerHTML = `
      <p><strong>Situation type:</strong> ${classification.type}</p>
      ${createContactCardHTML(classification.type, classification.number, 'Recommended number based on your description')}
      <p><strong>What to do now:</strong></p>
      <ol>${stepsHTML}</ol>
      <p><strong>Message you can read aloud or send:</strong></p>
      <p style="font-style: italic;">"${data.shareableMessage}"</p>
    `;

  } catch (error) {
    console.error('AI assistant error:', error);
    responseBox.innerHTML += `
      <p>Could not load additional guidance right now. Please call the number above directly - this is the most important step.</p>
    `;
  } finally {
    button.disabled = false;
    button.textContent = 'Get Help';
  }
}