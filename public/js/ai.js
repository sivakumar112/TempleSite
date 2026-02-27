const AI_API = '/api';

const messagesEl = document.getElementById('ai-messages');
const inputEl = document.getElementById('ai-input');
const sendBtn = document.getElementById('ai-send');

// ─── Chat message helpers ───────────────────────────────────────────────────

function addMessage(role, html, isRaw) {
  if (!messagesEl) return;
  const div = document.createElement('div');
  div.className = 'ai-message ' + role;
  const formatted = isRaw ? html : (role === 'bot' ? formatAIResponse(html) : escapeHtmlAI(html));
  div.innerHTML = `<div class="role">${role === 'user' ? '<i class="fas fa-user"></i> You' : '<i class="fas fa-robot"></i> AI Guide'}</div><div class="ai-body">${formatted}</div>`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function addBotWithOptions(text, options, onSelect) {
  if (!messagesEl) return;
  const div = document.createElement('div');
  div.className = 'ai-message bot';
  div.innerHTML = `<div class="role"><i class="fas fa-robot"></i> AI Guide</div><div class="ai-body">${formatAIResponse(text)}</div>`;

  const optWrap = document.createElement('div');
  optWrap.className = 'chat-options';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'chat-option-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      optWrap.querySelectorAll('.chat-option-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      optWrap.querySelectorAll('.chat-option-btn').forEach(b => { b.disabled = true; });
      addMessage('user', opt);
      onSelect(opt);
    });
    optWrap.appendChild(btn);
  });

  div.querySelector('.ai-body').appendChild(optWrap);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtmlAI(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function formatAIResponse(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^## (.*$)/gm, '<h3>$1</h3>')
    .replace(/^(\d+)\.\s(.*$)/gm, '<div class="ai-list-item"><strong>$1.</strong> $2</div>')
    .replace(/^[-•]\s(.*$)/gm, '<div class="ai-list-item">&bull; $1</div>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function setLoading(loading) {
  if (sendBtn) sendBtn.disabled = loading;
  if (inputEl) inputEl.disabled = loading;
  if (loading) {
    addMessage('bot', '<i class="fas fa-spinner fa-spin"></i> Thinking...');
  }
}

function removeLoading() {
  if (!messagesEl) return;
  const msgs = messagesEl.querySelectorAll('.ai-message.bot');
  const last = msgs[msgs.length - 1];
  if (last && last.innerHTML.includes('fa-spinner')) last.remove();
}

// ─── Normal AI chat ─────────────────────────────────────────────────────────

async function sendToAI(text) {
  if (quizActive) return;
  if (tripPlannerActive) {
    handleTripInput(text || inputEl?.value?.trim());
    if (inputEl) inputEl.value = '';
    return;
  }

  const msg = text || inputEl?.value?.trim();
  if (!msg) return;
  addMessage('user', msg);
  if (inputEl) inputEl.value = '';
  setLoading(true);
  try {
    const res = await fetch(AI_API + '/ai/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, religion: typeof getGlobalReligion === 'function' ? getGlobalReligion() : '' })
    });
    const data = await res.json();
    removeLoading();
    if (data.reply) {
      addMessage('bot', data.reply);
    } else {
      addMessage('bot', 'Sorry, I could not get a response. ' + (data.error || ''));
    }
  } catch {
    removeLoading();
    addMessage('bot', 'Network error. Please try again.');
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    if (inputEl) inputEl.disabled = false;
  }
}

sendBtn?.addEventListener('click', () => sendToAI());
inputEl?.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendToAI();
  }
});

document.querySelectorAll('.ai-quick').forEach(btn => {
  btn.addEventListener('click', function () {
    const q = this.dataset.q;
    if (q) sendToAI(q);
    showSection('ai-guide');
  });
});

// ─── Interactive Trip Planner Agent ─────────────────────────────────────────

let tripPlannerActive = false;
let tripStep = 0;
let tripData = {};

const TRIP_QUESTIONS = [
  {
    key: 'startCity',
    question: "Great! Let's plan your perfect temple pilgrimage! \n\nFirst, **where would you like to start your journey from?** (your home city or the nearest major city)",
    type: 'text',
    placeholder: 'e.g. Chennai, Delhi, Mumbai, Hyderabad...'
  },
  {
    key: 'region',
    question: "Which **region of India** interests you for this pilgrimage?",
    type: 'options',
    options: ['South India', 'North India', 'East India', 'West India', 'Central India', 'All India (flexible)']
  },
  {
    key: 'days',
    question: "How many **days** do you have for this trip?",
    type: 'options',
    options: ['2 days', '3 days', '5 days', '7 days', '10 days', '14 days']
  },
  {
    key: 'religion',
    question: "Which **religion or faith** are you interested in for this pilgrimage?",
    type: 'options',
    options: ['Hindu temples', 'Mosques (Islam)', 'Churches (Christian)', 'Gurudwaras (Sikh)', 'Buddhist sites', 'Jain temples', 'Multi-faith (all religions)']
  },
  {
    key: 'deity',
    question: "Any **specific deity, saint, or focus** for the places you'd like to visit?",
    type: 'options',
    options: ['Lord Shiva', 'Lord Vishnu', 'Goddess Devi', 'Prophet Muhammad (PBUH)', 'Jesus Christ', 'Guru Nanak', 'Lord Buddha', 'Lord Mahavira', 'No preference (surprise me!)']
  },
  {
    key: 'budget',
    question: "What's your **budget range** for this trip?",
    type: 'options',
    options: ['Budget (under ₹5,000)', 'Moderate (₹5,000-15,000)', 'Comfortable (₹15,000-30,000)', 'Luxury (₹30,000+)']
  },
  {
    key: 'group',
    question: "Who will be **traveling with you**?",
    type: 'options',
    options: ['Solo', 'Couple', 'Family with kids', 'Family with elders', 'Group of friends', 'Large group (10+)']
  },
  {
    key: 'travelStyle',
    question: "What's your **preferred travel style**?",
    type: 'options',
    options: ['Public transport (bus/train)', 'Self-drive car', 'Hired cab/taxi', 'Mix of everything', 'Flight + local cab']
  },
  {
    key: 'interests',
    question: "Any **special interests** you'd like included in the trip?",
    type: 'options',
    options: ['Ancient architecture', 'Spiritual rituals', 'Local food & cuisine', 'Nature & scenic views', 'Photography', 'History & mythology', 'All of the above']
  },
  {
    key: 'food',
    question: "What's your **food preference**?",
    type: 'options',
    options: ['Pure vegetarian', 'Vegetarian (with eggs)', 'Non-vegetarian', 'Jain food', 'No preference']
  },
  {
    key: 'health',
    question: "Any **health or mobility concerns** to consider? (helps us plan accessible temples)",
    type: 'options',
    options: ['No concerns, fully fit', 'Mild knee/joint issues', 'Using wheelchair/walker', 'Traveling with elderly', 'Traveling with small children', 'Prefer minimal walking']
  }
];

function startTripPlanner() {
  tripPlannerActive = true;
  tripStep = 0;
  tripData = {};

  addMessage('bot',
    '<div style="text-align:center;margin-bottom:0.5rem"><i class="fas fa-route" style="font-size:2rem;color:var(--accent)"></i></div>' +
    '<strong style="font-size:1.05rem">Temple Trip Planner</strong><br>' +
    'I\'ll ask you a few questions to understand your preferences, then create a <strong>personalized pilgrimage itinerary</strong> with day-by-day plans, temple timings, food suggestions, budget breakdown, and travel tips!<br><br>' +
    '<em>Answer the questions below — you can click the options or type your own answer.</em>', true
  );

  setTimeout(() => askNextQuestion(), 600);
}

function askNextQuestion() {
  if (tripStep >= TRIP_QUESTIONS.length) {
    generateTripPlan();
    return;
  }

  const q = TRIP_QUESTIONS[tripStep];

  if (q.type === 'options') {
    addBotWithOptions(q.question, q.options, (answer) => {
      tripData[q.key] = answer;
      tripStep++;
      setTimeout(() => askNextQuestion(), 400);
    });
  } else {
    addMessage('bot', q.question);
    if (inputEl) inputEl.placeholder = q.placeholder || 'Type your answer...';
    inputEl?.focus();
  }
}

function handleTripInput(text) {
  if (!text || !tripPlannerActive) return;
  const q = TRIP_QUESTIONS[tripStep];
  if (!q || q.type !== 'text') return;

  addMessage('user', text);
  tripData[q.key] = text;
  tripStep++;

  if (inputEl) inputEl.placeholder = 'Ask about temples, rituals, recommendations...';
  setTimeout(() => askNextQuestion(), 400);
}

async function generateTripPlan() {
  addMessage('bot',
    '<i class="fas fa-spinner fa-spin"></i> <strong>Generating your personalized pilgrimage plan...</strong><br>' +
    'Our AI is crafting a detailed itinerary based on your preferences. This may take a moment...', true
  );

  if (inputEl) inputEl.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  try {
    const globalRel = typeof getGlobalReligion === 'function' ? getGlobalReligion() : '';
    if (globalRel && !tripData.religion) tripData.religion = globalRel + ' temples';
    const res = await fetch(AI_API + '/ai/plan-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData)
    });
    const plan = await res.json();

    removeLoading();

    if (!plan.days || !plan.days.length) {
      addMessage('bot', 'Sorry, I couldn\'t generate a plan with those preferences. Try different options or ask me in the chat!');
      tripPlannerActive = false;
      return;
    }

    renderTripPlan(plan);
  } catch {
    removeLoading();
    addMessage('bot', 'Network error generating the plan. Please try again.');
  } finally {
    tripPlannerActive = false;
    if (inputEl) { inputEl.disabled = false; inputEl.placeholder = 'Ask about temples, rituals, recommendations...'; }
    if (sendBtn) sendBtn.disabled = false;
  }
}

function renderTripPlan(plan) {
  let html = '<div class="chat-trip-plan">';

  html += `<div class="chat-plan-title"><i class="fas fa-route" style="margin-right:0.4rem"></i> ${escapeHtmlAI(plan.title || 'Your Pilgrimage Itinerary')}</div>`;

  if (plan.summary) {
    html += `<div class="chat-plan-summary">${escapeHtmlAI(plan.summary)}</div>`;
  }

  if (plan.days) {
    for (const day of plan.days) {
      html += '<div class="chat-plan-day">';
      html += '<div class="chat-plan-day-header">';
      html += `<span class="chat-plan-day-num">Day ${day.day}</span>`;
      html += `<span class="chat-plan-day-city">${escapeHtmlAI(day.city || '')}</span>`;
      if (day.theme) html += `<span class="chat-plan-day-theme">${escapeHtmlAI(day.theme)}</span>`;
      if (day.weather) html += `<span class="chat-plan-day-theme" style="background:rgba(88,166,255,0.1);color:#58a6ff"><i class="fas fa-cloud-sun"></i> ${escapeHtmlAI(day.weather)}</span>`;
      html += '</div>';

      if (day.travel) {
        html += `<div class="chat-plan-footer"><i class="fas fa-bus"></i> ${escapeHtmlAI(day.travel)}</div>`;
      }

      if (day.temples) {
        for (const t of day.temples) {
          html += '<div class="chat-plan-temple">';
          if (t.thumbnail) {
            html += `<div class="chat-plan-temple-img" style="background-image:url('${escapeHtmlAI(t.thumbnail)}')"></div>`;
          } else {
            html += '<div class="chat-plan-temple-img"><i class="fas fa-place-of-worship"></i></div>';
          }
          html += '<div class="chat-plan-temple-info">';
          html += `<div class="chat-plan-temple-name">${escapeHtmlAI(t.name || '')}</div>`;
          if (t.deity) html += `<div class="chat-plan-temple-detail"><i class="fas fa-om"></i> ${escapeHtmlAI(t.deity)}</div>`;
          if (t.time) html += `<div class="chat-plan-temple-detail"><i class="fas fa-clock"></i> ${escapeHtmlAI(t.time)}</div>`;
          if (t.specialDarshan) html += `<div class="chat-plan-temple-detail" style="color:#58a6ff"><i class="fas fa-star"></i> ${escapeHtmlAI(t.specialDarshan)}</div>`;
          if (t.mustDo) html += `<div class="chat-plan-temple-detail"><i class="fas fa-fire"></i> ${escapeHtmlAI(t.mustDo)}</div>`;
          if (t.dressCode) html += `<div class="chat-plan-temple-detail"><i class="fas fa-tshirt"></i> ${escapeHtmlAI(t.dressCode)}</div>`;
          if (t.dosDonts) html += `<div class="chat-plan-temple-detail" style="color:var(--warning)"><i class="fas fa-exclamation-triangle"></i> ${escapeHtmlAI(t.dosDonts)}</div>`;
          if (t.tip) html += `<div class="chat-plan-temple-detail"><i class="fas fa-lightbulb"></i> ${escapeHtmlAI(t.tip)}</div>`;
          html += '</div></div>';
        }
      }

      if (day.meals) {
        html += '<div class="chat-plan-meals">';
        if (day.meals.breakfast) html += `<span><i class="fas fa-coffee"></i> ${escapeHtmlAI(day.meals.breakfast)}</span>`;
        if (day.meals.lunch) html += `<span><i class="fas fa-utensils"></i> ${escapeHtmlAI(day.meals.lunch)}</span>`;
        if (day.meals.dinner) html += `<span><i class="fas fa-moon"></i> ${escapeHtmlAI(day.meals.dinner)}</span>`;
        html += '</div>';
      }

      if (day.nearbyAttractions && day.nearbyAttractions.length) {
        html += '<div class="chat-plan-footer" style="color:#58a6ff"><i class="fas fa-camera"></i> <strong>Nearby:</strong> ' + day.nearbyAttractions.map(a => escapeHtmlAI(a)).join(' &bull; ') + '</div>';
      }

      if (day.localPhrases && day.localPhrases.length) {
        html += '<div class="chat-plan-footer" style="color:#b392f0"><i class="fas fa-language"></i> <strong>Local phrases:</strong> ';
        day.localPhrases.forEach(p => {
          html += `<span style="margin-right:0.5rem"><em>"${escapeHtmlAI(p.phrase)}"</em> = ${escapeHtmlAI(p.meaning)} (${escapeHtmlAI(p.language || '')})</span>`;
        });
        html += '</div>';
      }

      if (day.accommodation) {
        html += `<div class="chat-plan-footer"><i class="fas fa-bed"></i> Stay: ${escapeHtmlAI(day.accommodation)}</div>`;
      }
      if (day.estimatedCost) {
        html += `<div class="chat-plan-footer"><i class="fas fa-rupee-sign"></i> Day cost: ${escapeHtmlAI(day.estimatedCost)}</div>`;
      }

      html += '</div>';
    }
  }

  html += '<div class="chat-plan-summary-box">';
  if (plan.totalBudget) {
    const b = typeof plan.totalBudget === 'object' ? plan.totalBudget : { min: plan.totalBudget, max: '' };
    html += `<div class="chat-plan-summary-item"><div class="sp-label">Total Budget</div><div class="sp-value">${escapeHtmlAI(b.min || '')}${b.max ? ' - ' + escapeHtmlAI(b.max) : ''}</div></div>`;
    if (b.breakdown) {
      for (const [k, v] of Object.entries(b.breakdown)) {
        html += `<div class="chat-plan-summary-item"><div class="sp-label">${escapeHtmlAI(k)}</div><div class="sp-value">${escapeHtmlAI(v)}</div></div>`;
      }
    }
  }
  if (plan.bestSeason) html += `<div class="chat-plan-summary-item"><div class="sp-label">Best Season</div><div class="sp-value">${escapeHtmlAI(plan.bestSeason)}</div></div>`;
  html += '</div>';

  if (plan.dosAndDonts) {
    html += '<div class="chat-plan-tips"><h5><i class="fas fa-check-circle" style="color:var(--success)"></i> Do\'s & Don\'ts</h5>';
    if (plan.dosAndDonts.dos && plan.dosAndDonts.dos.length) {
      html += '<ul>';
      plan.dosAndDonts.dos.forEach(d => { html += `<li style="color:var(--success)"><i class="fas fa-check" style="margin-right:0.3rem"></i> ${escapeHtmlAI(d)}</li>`; });
      html += '</ul>';
    }
    if (plan.dosAndDonts.donts && plan.dosAndDonts.donts.length) {
      html += '<ul>';
      plan.dosAndDonts.donts.forEach(d => { html += `<li style="color:var(--danger)"><i class="fas fa-times" style="margin-right:0.3rem"></i> ${escapeHtmlAI(d)}</li>`; });
      html += '</ul>';
    }
    html += '</div>';
  }

  if (plan.packingList && plan.packingList.length) {
    html += '<div class="chat-plan-tips"><h5><i class="fas fa-suitcase"></i> Packing List</h5><ul>';
    plan.packingList.forEach(item => { html += `<li>${escapeHtmlAI(item)}</li>`; });
    html += '</ul></div>';
  }

  if (plan.importantTips && plan.importantTips.length) {
    html += '<div class="chat-plan-tips"><h5><i class="fas fa-info-circle"></i> Important Tips</h5><ul>';
    plan.importantTips.forEach(tip => { html += `<li>${escapeHtmlAI(tip)}</li>`; });
    html += '</ul></div>';
  }

  if (plan.emergencyInfo) {
    html += '<div class="chat-plan-tips"><h5><i class="fas fa-phone-alt" style="color:var(--danger)"></i> Emergency Contacts</h5>';
    const e = plan.emergencyInfo;
    if (typeof e === 'string') {
      html += `<p>${escapeHtmlAI(e)}</p>`;
    } else {
      html += '<ul>';
      for (const [k, v] of Object.entries(e)) {
        html += `<li><strong>${escapeHtmlAI(k)}:</strong> ${escapeHtmlAI(v)}</li>`;
      }
      html += '</ul>';
    }
    html += '</div>';
  }

  if (plan.spiritualSignificance) {
    html += `<div class="chat-plan-spiritual"><i class="fas fa-pray" style="color:var(--accent);margin-right:0.4rem"></i> <strong>Spiritual Significance:</strong> ${escapeHtmlAI(plan.spiritualSignificance)}</div>`;
  }

  if (plan.routeMapQuery) {
    html += `<div style="text-align:center;margin-top:0.75rem"><a href="https://www.google.com/maps/search/${encodeURIComponent(plan.routeMapQuery)}" target="_blank" class="chat-option-btn" style="display:inline-block;text-decoration:none;background:rgba(88,166,255,0.12);border-color:#58a6ff;color:#58a6ff"><i class="fas fa-map-marked-alt"></i> Open Route in Google Maps</a></div>`;
  }

  html += '</div>';

  addMessage('bot', html, true);

  addMessage('bot',
    'Your personalized pilgrimage plan is ready! You can:\n' +
    '- Ask me to **modify** any part of this plan\n' +
    '- Ask for **more details** about any temple mentioned\n' +
    '- Click **"Plan My Temple Trip"** again to create a new plan\n' +
    '- Or ask me anything else about temples!'
  );
}

// ─── Start Trip Planner button ──────────────────────────────────────────────

document.getElementById('start-trip-planner')?.addEventListener('click', () => {
  showSection('ai-guide');
  startTripPlanner();
});

// ─── Temple Quiz ────────────────────────────────────────────────────────────

let quizActive = false;
let quizQuestions = [];
let quizCurrent = 0;
let quizScore = 0;

async function startQuiz() {
  quizActive = true;
  quizCurrent = 0;
  quizScore = 0;
  quizQuestions = [];

  addMessage('bot',
    '<div style="text-align:center;margin-bottom:0.5rem"><i class="fas fa-brain" style="font-size:2rem;color:#58a6ff"></i></div>' +
    '<strong style="font-size:1.05rem">Sacred Places Knowledge Quiz</strong><br>' +
    'Test your knowledge about sacred places across all religions! 5 questions, from easy to hard.<br>' +
    '<i class="fas fa-spinner fa-spin"></i> Loading questions...', true
  );

  try {
    const quizRel = typeof getGlobalReligion === 'function' ? getGlobalReligion() : '';
    const res = await fetch(AI_API + '/ai/quiz' + (quizRel ? '?religion=' + encodeURIComponent(quizRel) : ''));
    quizQuestions = await res.json();
    if (!quizQuestions.length) {
      addMessage('bot', 'Could not load quiz questions. Try again later.');
      quizActive = false;
      return;
    }
    showQuizQuestion();
  } catch {
    addMessage('bot', 'Network error loading quiz. Try again.');
    quizActive = false;
  }
}

function showQuizQuestion() {
  if (quizCurrent >= quizQuestions.length) {
    showQuizResult();
    return;
  }
  const q = quizQuestions[quizCurrent];
  const diffClass = (q.difficulty || 'medium').toLowerCase();

  let html = `<div class="quiz-question">
    <div class="quiz-question-text">Q${quizCurrent + 1}. ${escapeHtmlAI(q.question)} <span class="quiz-difficulty ${diffClass}">${diffClass}</span></div>
    <div class="quiz-options" id="quiz-opts-${quizCurrent}">`;
  q.options.forEach((opt, i) => {
    html += `<button class="quiz-opt" data-idx="${i}" data-qnum="${quizCurrent}">${escapeHtmlAI(opt)}</button>`;
  });
  html += '</div></div>';

  const msgDiv = addMessage('bot', html, true);

  msgDiv.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', function () {
      const idx = parseInt(this.dataset.idx);
      const qn = parseInt(this.dataset.qnum);
      handleQuizAnswer(qn, idx, msgDiv);
    });
  });
}

function handleQuizAnswer(qnum, ansIdx, msgDiv) {
  const q = quizQuestions[qnum];
  const correct = q.correct;
  const opts = msgDiv.querySelectorAll('.quiz-opt');

  opts.forEach((btn, i) => {
    btn.disabled = true;
    if (i === correct) btn.classList.add('correct');
    if (i === ansIdx && ansIdx !== correct) btn.classList.add('wrong');
  });

  if (ansIdx === correct) quizScore++;

  if (q.explanation) {
    const expDiv = document.createElement('div');
    expDiv.className = 'quiz-explanation';
    expDiv.innerHTML = `<i class="fas fa-lightbulb" style="color:var(--accent);margin-right:0.3rem"></i> ${escapeHtmlAI(q.explanation)}`;
    msgDiv.querySelector('.quiz-question').appendChild(expDiv);
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;

  quizCurrent++;
  setTimeout(() => showQuizQuestion(), 1200);
}

function showQuizResult() {
  const pct = Math.round((quizScore / quizQuestions.length) * 100);
  let emoji = '';
  if (pct === 100) emoji = 'Perfect! You are a temple guru!';
  else if (pct >= 80) emoji = 'Excellent! You know your temples well!';
  else if (pct >= 60) emoji = 'Good job! Keep exploring temples!';
  else if (pct >= 40) emoji = 'Not bad! Visit more temples to learn!';
  else emoji = 'Keep learning! Each temple has amazing stories!';

  addMessage('bot',
    `<div class="quiz-score">
      <div class="score-num">${quizScore}/${quizQuestions.length}</div>
      <div style="font-size:0.95rem;margin:0.5rem 0">${escapeHtmlAI(emoji)}</div>
      <div style="font-size:0.82rem;color:var(--text-muted)">Score: ${pct}%</div>
    </div>`, true
  );
  quizActive = false;
}

document.getElementById('start-quiz')?.addEventListener('click', () => {
  showSection('ai-guide');
  startQuiz();
});
