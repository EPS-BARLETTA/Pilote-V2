const views = {
  cocon: document.getElementById('cocon-view'),
  autonomie: document.getElementById('autonomie-view'),
  inviter: document.getElementById('inviter-view')
};

const panel = document.getElementById('completion-panel');
const panelText = document.getElementById('completion-text');
const messageTemplate = document.getElementById('messages-template');

const BREATH_DURATION = 105000; // ~6 cycles (4s inhale + 6s exhale)
const AUTONOMY_DEFAULT = 60;

let breathTimeoutId = null;
let breathCompletionHandler = null;
let autonomyIntervalId = null;
let autonomyRemaining = AUTONOMY_DEFAULT;
let autonomyRunning = false;
let currentView = 'cocon';
let currentInviterStage = 'breath';

const inviterStages = {
  breath: document.getElementById('inviter-breath'),
  ritual: document.getElementById('inviter-ritual')
};

const ritualForm = document.getElementById('ritual-form');

function selectRandomMessage() {
  const options = messageTemplate.content.querySelectorAll('option');
  return options[Math.floor(Math.random() * options.length)].textContent;
}

function showCompletionPanel() {
  panelText.textContent = selectRandomMessage();
  panel.hidden = false;
}

function hideCompletionPanel() {
  panel.hidden = true;
}

function switchView(target) {
  currentView = target;
  Object.values(views).forEach((section) => {
    section.hidden = section.dataset.view !== target;
  });

  if (target === 'cocon') {
    hideCompletionPanel();
    startBreathingSequence(showCompletionPanel);
  } else {
    stopBreathingSequence();
  }
}

function startBreathingSequence(onComplete = showCompletionPanel) {
  stopBreathingSequence();
  breathCompletionHandler = onComplete;
  breathTimeoutId = window.setTimeout(() => {
    breathTimeoutId = null;
    if (typeof breathCompletionHandler === 'function') {
      breathCompletionHandler();
    }
  }, BREATH_DURATION);
}

function stopBreathingSequence() {
  if (breathTimeoutId) {
    window.clearTimeout(breathTimeoutId);
    breathTimeoutId = null;
  }
  breathCompletionHandler = null;
}

function setInviterStage(stage) {
  currentInviterStage = stage;
  Object.entries(inviterStages).forEach(([name, node]) => {
    node.hidden = name !== stage;
  });
}

const handleInviterBreathComplete = () => {
  setInviterStage('ritual');
};

function startInviterFlow() {
  setInviterStage('breath');
  startBreathingSequence(handleInviterBreathComplete);
}

function resetInviterFlow() {
  setInviterStage('breath');
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function updateAutonomyDisplay() {
  document.getElementById('autonomy-time').textContent = formatTime(autonomyRemaining);
}

function showAutonomyOutcome() {
  document.getElementById('autonomy-outcome').hidden = false;
}

function hideAutonomyOutcome() {
  document.getElementById('autonomy-outcome').hidden = true;
}

function startAutonomyTimer() {
  if (autonomyIntervalId) {
    window.clearInterval(autonomyIntervalId);
  }
  autonomyRunning = true;
  autonomyIntervalId = window.setInterval(() => {
    autonomyRemaining -= 1;
    updateAutonomyDisplay();
    if (autonomyRemaining <= 0) {
      stopAutonomyTimer();
      showAutonomyOutcome();
    }
  }, 1000);
  document.querySelector('[data-action="autonomy-toggle"]').textContent = 'Pause';
}

function stopAutonomyTimer() {
  autonomyRunning = false;
  if (autonomyIntervalId) {
    window.clearInterval(autonomyIntervalId);
    autonomyIntervalId = null;
  }
  document.querySelector('[data-action="autonomy-toggle"]').textContent = 'Démarrer';
}

function resetAutonomyTimer() {
  stopAutonomyTimer();
  autonomyRemaining = AUTONOMY_DEFAULT;
  updateAutonomyDisplay();
  hideAutonomyOutcome();
}

function toggleAutonomyTimer() {
  if (autonomyRunning) {
    stopAutonomyTimer();
  } else {
    startAutonomyTimer();
  }
}

function persistRitual(data) {
  const payload = {
    happened: data.get('happened') || '',
    helped: data.get('helped') || '',
    next: data.get('next') || ''
  };
  if (!payload.happened && !payload.helped && !payload.next) {
    return; // nothing to store
  }
  try {
    localStorage.setItem('piloteV2.ritual', JSON.stringify(payload));
  } catch (error) {
    // Optional storage; ignore failures
  }
}

function handleAction(action) {
  switch (action) {
    case 'restart':
      hideCompletionPanel();
      startBreathingSequence(showCompletionPanel);
      break;
    case 'inviter':
      hideCompletionPanel();
      switchView('inviter');
      startInviterFlow();
      break;
    case 'autonomie':
      hideCompletionPanel();
      switchView('autonomie');
      resetAutonomyTimer();
      break;
    case 'autonomy-toggle':
      toggleAutonomyTimer();
      break;
    case 'autonomy-reset':
      resetAutonomyTimer();
      break;
    case 'back-to-cocon':
      hideCompletionPanel();
      resetAutonomyTimer();
      resetInviterFlow();
      switchView('cocon');
      break;
    case 'close-panel':
      hideCompletionPanel();
      break;
    case 'ritual-skip':
      ritualForm.reset();
      switchView('cocon');
      resetInviterFlow();
      break;
    default:
      break;
  }
}

function wireButtons() {
  document.querySelectorAll('button[data-action]').forEach((button) => {
    button.addEventListener('click', () => handleAction(button.dataset.action));
  });
}

function setupRitualForm() {
  ritualForm.addEventListener('submit', (event) => {
    event.preventDefault();
    persistRitual(new FormData(ritualForm));
    ritualForm.reset();
    switchView('cocon');
    resetInviterFlow();
  });
}

function resumeSequencesAfterVisibilityChange() {
  if (currentView === 'cocon') {
    startBreathingSequence(showCompletionPanel);
  } else if (currentView === 'inviter' && currentInviterStage === 'breath') {
    startBreathingSequence(handleInviterBreathComplete);
  }
}

function initBreathingAssist() {
  startBreathingSequence(showCompletionPanel);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopBreathingSequence();
      stopAutonomyTimer();
    } else if (currentView === 'autonomie') {
      // stay paused in autonomy mode
    } else if (currentView === 'inviter' && currentInviterStage === 'ritual') {
      // no guided breath in ritual stage
    } else {
      resumeSequencesAfterVisibilityChange();
    }
  });
}

function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {
        /* offline optional */
      });
    });
  }
}

function init() {
  wireButtons();
  setupRitualForm();
  updateAutonomyDisplay();
  hideAutonomyOutcome();
  initBreathingAssist();
  initServiceWorker();
}

init();
