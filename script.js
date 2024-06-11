// script.js
const audioContext   = new AudioContext();
const baseFrequency  = 261.63; // Reference frequency for C4 ("middle C")
const three          = Math.pow(2, 19/12) // A number that approximately equals 3; useful for ensuring that there's a circle of fifths
const semitones      = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const ji_ratios      = [1/1, 17/16, three*three/8, 19/16, 5/4, 4/three, 17/12, three/2, Math.sqrt((30/19)*(19/12)), 5/three, three*10/17, 15/8];
const ji_semitones   = ji_ratios.map((ratio) => 12*Math.log2(ratio));
half_comma = 0.5 * 12 * Math.log2(three*three*three*three/80);
half_comma = 0.5 * 12 * Math.log2(three*three*three*three/80) * 0.93;
const ji_corrections = ji_semitones.map((semitone) => semitone - Math.round(semitone) + half_comma);

var mod = (n, m) => {
    var remain = n % m;
    return Math.floor(remain >= 0 ? remain : remain + m);
};

function playSound(index) {
    console.log(index, semitones[index]);
    const fundamentalFrequency = baseFrequency * Math.pow(2, semitones[index] / 12);
    const gainNode = audioContext.createGain();
    const oscillators = [];

    // Create oscillators for fundamental and overtones with individual gains
    let overtoneGains = [0.4, 0.2, 0.1, 0.8, 0.6, 0.4, 0.2];
    let overtoneGainsTotal = overtoneGains.reduce((a,b) => a+b, 0);
    overtoneGains = overtoneGains.map((x) => x/overtoneGainsTotal);
    for (let overtone = 1; overtone <= overtoneGains.length; overtone++) {
        const oscillator = audioContext.createOscillator();
        const overtoneGainNode = audioContext.createGain();

        oscillator.frequency.value = fundamentalFrequency * overtone; // Overtone multiples
        oscillator.type = 'sine'; // Type of sound wave

        overtoneGainNode.gain.value = overtoneGains[overtone - 1]; // Set gain for each overtone
        oscillator.connect(overtoneGainNode); // Connect oscillator to its gain node
        overtoneGainNode.connect(gainNode); // Connect overtone gain to master gain

        oscillators.push(oscillator);
    }

    // Configure master gain for decay to avoid clipping
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // Start at lower volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8); // Decay over 0.8 seconds
    gainNode.connect(audioContext.destination);

    // Start all oscillators
    oscillators.forEach(osc => osc.start());

    // Stop all oscillators after the sound has decayed
    setTimeout(() => {
        oscillators.forEach(osc => osc.stop());
    }, 1500); // Stop after 1.5 seconds
}

keyboard      = document.getElementById("keyboard");
circle        = document.getElementById("circle");
circle_button = undefined

set_jimiboard_key_class = (i, modular_relative_offset) => {
    if (modular_relative_offset == 0 || modular_relative_offset == 4 || modular_relative_offset == 7) {
        keyboard.children[i].classList.add('btn-emphasized');
    } else {
        keyboard.children[i].classList.remove('btn-emphasized');
    }    
}

function setScale(index) {
    if (circle_button) {
        circle_button.classList.toggle('btn-emphasized');
    }
    circle_button = circle.children[index];
    circle_button.classList.toggle('btn-emphasized');
    if (index % 2 == 0) {
        // Major scale
        offset = (7*Math.round(index/2)) % 12;
        for (let i=0; i<semitones.length; i++) {
            let modular_relative_offset = mod(i - offset, 12);
            semitones[i] = i + ji_corrections[modular_relative_offset];
            set_jimiboard_key_class(i, modular_relative_offset);
        }
    } else {
        // Minor scale
        index -= 1;
        offset = (11 + (7*Math.round(index/2))) % 12;
        for (let i=0; i<semitones.length; i++) {
            let modular_relative_offset = mod(offset - i, 12);
            semitones[i] = i - ji_corrections[modular_relative_offset];
            set_jimiboard_key_class(i, modular_relative_offset);
        }
    }
}