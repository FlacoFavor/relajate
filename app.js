const text = document.getElementById('text');
const circle = document.getElementById('circle');
const actionBtn = document.getElementById('actionBtn');
const soundSelect = document.getElementById('soundSelect');
const timeSelect = document.getElementById('timeSelect');
const timerDisplay = document.getElementById('timerDisplay');

let isRunning = false;
let intervalId = null;
let countdownId = null;
let wakeLock = null;

let audioCtx = null;
let activeNodes = [];
let timeLeft = 60;
let pasoRespiracion = 0;
let segundosFase = 4;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

timeSelect.addEventListener('change', () => {
  timeLeft = parseInt(timeSelect.value);
  actualizarInterfazReloj();
});

function actualizarInterfazReloj() {
  const minutos = Math.floor(timeLeft / 60);
  const segundos = timeLeft % 60;
  timerDisplay.innerText = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}

function reproducirLluvia() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filtro = audioCtx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.setValueAtTime(400, audioCtx.currentTime);

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.setValueAtTime(0.1, audioCtx.currentTime);
  lfoGain.gain.setValueAtTime(150, audioCtx.currentTime);

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 1);

  lfo.connect(lfoGain);
  lfoGain.connect(filtro.frequency);
  source.connect(filtro);
  filtro.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  lfo.start();
  source.start();
  activeNodes.push(source, lfo);
}

function reproducirCuenco() {
  // CORREGIDO: Añadidas las frecuencias originales restauradas
  const frecuencias = [110, 220, 440];
  
  frecuencias.forEach((freq, index) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    if (index > 0) {
      const vibrato = audioCtx.createOscillator();
      const vibratoGain = audioCtx.createGain();
      vibrato.frequency.setValueAtTime(0.5 + (index * 0.2), audioCtx.currentTime);
      vibratoGain.gain.setValueAtTime(2, audioCtx.currentTime);
      
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      vibrato.start();
      activeNodes.push(vibrato);
    }

    const vol = index === 0 ? 0.25 : 0.08;
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 2);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    activeNodes.push(osc);
  });
}

function reproducirRuidoBlanco() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filtro = audioCtx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.setValueAtTime(800, audioCtx.currentTime);

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 1.5);

  source.connect(filtro);
  filtro.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  source.start();
  activeNodes.push(source);
}

function reproducirOndasAlfa() {
  const oscIzquierdo = audioCtx.createOscillator();
  const oscDerecho = audioCtx.createOscillator();
  const pannerIzquierdo = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  const pannerDerecho = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  const gainNode = audioCtx.createGain();

  oscIzquierdo.frequency.setValueAtTime(432, audioCtx.currentTime);
  oscDerecho.frequency.setValueAtTime(442, audioCtx.currentTime);

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 2);

  if (pannerIzquierdo && pannerDerecho) {
    pannerIzquierdo.pan.setValueAtTime(-1, audioCtx.currentTime);
    pannerDerecho.pan.setValueAtTime(1, audioCtx.currentTime);
    oscIzquierdo.connect(pannerIzquierdo);
    pannerIzquierdo.connect(gainNode);
    oscDerecho.connect(pannerDerecho);
    pannerDerecho.connect(gainNode);
  } else {
    oscIzquierdo.connect(gainNode);
    oscDerecho.connect(gainNode);
  }

  gainNode.connect(audioCtx.destination);
  oscIzquierdo.start();
  oscDerecho.start();
  activeNodes.push(oscIzquierdo, oscDerecho);
}

function reproducirRuidoMarron() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Filtro matemático para acumular energía en frecuencias bajas
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; 
  }

  const source = audioCtx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 1.5);

  source.connect(gainNode).connect(audioCtx.destination);
  source.start();
  activeNodes.push(source);
}

function reproducirOndasTheta() {
  const oscIzquierdo = audioCtx.createOscillator();
  const oscDerecho = audioCtx.createOscillator();
  const pannerIzquierdo = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  const pannerDerecho = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  const gainNode = audioCtx.createGain();

  // Frecuencias base con diferencia exacta de 4Hz para inducir estado Theta
  oscIzquierdo.frequency.setValueAtTime(200, audioCtx.currentTime);
  oscDerecho.frequency.setValueAtTime(204, audioCtx.currentTime);

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 2);

  if (pannerIzquierdo && pannerDerecho) {
    pannerIzquierdo.pan.setValueAtTime(-1, audioCtx.currentTime);
    pannerDerecho.pan.setValueAtTime(1, audioCtx.currentTime);
    oscIzquierdo.connect(pannerIzquierdo).connect(gainNode);
    oscDerecho.connect(pannerDerecho).connect(gainNode);
  } else {
    oscIzquierdo.connect(gainNode);
    oscDerecho.connect(gainNode);
  }

  gainNode.connect(audioCtx.destination);
  oscIzquierdo.start();
  oscDerecho.start();
  activeNodes.push(oscIzquierdo, oscDerecho);
}

function reproducirSonidoCosmico() {
  // Tres frecuencias armónicas bajas en base a una nota musical (Do/C)
  const frecuencias = [65.41, 130.81, 196.22];

  frecuencias.forEach((freq, index) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filtro = audioCtx.createBiquadFilter();

    // Ondas triangulares para un sonido más suave y armónico que las senoidales
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(300, audioCtx.currentTime);

    // Oscilador de baja frecuencia (LFO) para hacer que el sonido se mueva como el espacio
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.setValueAtTime(0.05 + (index * 0.02), audioCtx.currentTime);
    lfoGain.gain.setValueAtTime(100, audioCtx.currentTime);

    lfo.connect(lfoGain).connect(filtro.frequency);

    const vol = index === 0 ? 0.15 : 0.06;
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 3);

    osc.connect(filtro).connect(gainNode).connect(audioCtx.destination);
    
    lfo.start();
    osc.start();
    activeNodes.push(osc, lfo);
  });
}


function detenerSonidos() {
  activeNodes.forEach(node => {
    try { node.stop(); node.disconnect(); } catch(e) {}
  });
  activeNodes = [];
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
  } catch (err) { console.log(err.message); }
}

/*
function breatheAnimation() {
  if (pasoRespiracion === 0) {
    text.innerText = 'Inhala profundamente...';
    pasoRespiracion = 1;
  } else if (pasoRespiracion === 1) {
    text.innerText = 'Retén el aire';
    pasoRespiracion = 2;
  } else if (pasoRespiracion === 2) {
    text.innerText = 'Exhala despacio...';
    pasoRespiracion = 0;
  }
}
*/

function iniciarTemporizador() {
  // Mostramos el estado inicial de inmediato al arrancar
  actualizarTextoRespiracion();

  countdownId = setInterval(() => {
    timeLeft--;
    segundosFase--; // Restamos un segundo a la fase de respiración
    
    actualizarInterfazReloj();

    // Si la fase llegó a 0, avanzamos a la siguiente fase y reiniciamos a 4 segundos
    if (segundosFase <= 0) {
      pasoRespiracion = (pasoRespiracion + 1) % 3; // Pasa de 0->1->2 y vuelve a 0
      segundosFase = 4;
    }

    // Actualizamos el texto con los segundos restantes de la fase actual
    actualizarTextoRespiracion();

    if (timeLeft <= 0) {
      concluirSesion();
    }
  }, 1000);
}

function actualizarTextoRespiracion() {
  if (pasoRespiracion === 0) {
    text.innerText = `Inhala profundamente... (${segundosFase}s)`;
  } else if (pasoRespiracion === 1) {
    text.innerText = `Retén el aire... (${segundosFase}s)`;
  } else if (pasoRespiracion === 2) {
    text.innerText = `Exhala despacio... (${segundosFase}s)`;
  }
}

function concluirSesion() {
  detenerTodoEfectos();
  text.innerText = '¡Sesión completada Namasté!';
  actionBtn.innerText = 'Volver a empezar';
  timeLeft = parseInt(timeSelect.value);
  actualizarInterfazReloj();
}

function detenerTodoEfectos() {
  isRunning = false;
  actionBtn.style.backgroundColor = 'white';
  actionBtn.style.color = '#1a2a6c';
  soundSelect.disabled = false;
  timeSelect.disabled = false;
  
  clearInterval(intervalId);
  clearInterval(countdownId);
  pasoRespiracion = 0;
  segundosFase = 4;
  
  circle.className = 'circle';
  detenerSonidos();

  if (wakeLock !== null) {
    wakeLock.release();
    wakeLock = null;
  }
}

actionBtn.addEventListener('click', async () => {
  initAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  if (!isRunning) {
    isRunning = true;
    actionBtn.innerText = 'Pausar';
    actionBtn.style.backgroundColor = '#e74c3c';
    actionBtn.style.color = 'white';
    
    soundSelect.disabled = true;
    timeSelect.disabled = true;
    
    await requestWakeLock();
    
    const seleccion = soundSelect.value;
    if (seleccion === 'lluvia') reproducirLluvia();
    if (seleccion === 'cuenco') reproducirCuenco();
    if (seleccion === 'blanco') reproducirRuidoBlanco();
    if (seleccion === 'marron') reproducirRuidoMarron(); // Añadido
    if (seleccion === 'alfa') reproducirOndasAlfa();
    if (seleccion === 'theta') reproducirOndasTheta();   // Añadido
    if (seleccion === 'cosmico') reproducirSonidoCosmico(); // Añadido

    circle.className = 'circle circle-animado'; 
    //breatheAnimation(); 
    //intervalId = setInterval(breatheAnimation, 4000); 
    iniciarTemporizador();
  } else {
    detenerTodoEfectos();
    text.innerText = 'Sesión en pausa';
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
  });
}
