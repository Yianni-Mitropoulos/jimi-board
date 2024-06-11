// script.js
const audioContext   = new AudioContext();
const baseFrequency  = 261.63; // Reference frequency for C4 ("middle C")
const three          = Math.pow(2, 19/12) // A number that approximately equals 3; useful for ensuring that there's a circle of fifths
const half_comma     = 0.5 * 12 * Math.log2(three*three*three*three/80) * 0.93;

// White keys
const semitones      = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
const ji_ratios      = [1/1, 17/16, three*three/8, 19/16, 5/4, 4/three, 17/12, three/2, Math.sqrt((30/19)*(19/12)), 5/three, three*10/17, 15/8];
const ji_semitones   = ji_ratios.map((ratio) => 12*Math.log2(ratio));
const ji_corrections = ji_semitones.map((semitone, index) => semitone - index + half_comma);

// Grey keys
const microtonal_semitones = [0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5,13.5,14.5,15.5,16.5,17.5,18.5,19.5,20.5,21.5,22.5,23.5];
const microtonal_ji_ratios = [NaN, 13/(4*three), 7/(2*three), NaN, NaN, 11/8, NaN, NaN, 13/8, 7/4, 11/(three*2), NaN];
const microtonal_ji_semitones = microtonal_ji_ratios.map((ratio) => 12*Math.log2(ratio));
const microtonal_ji_corrections = microtonal_ji_semitones.map((semitone, index) => {
    if (isNaN(semitone)) {
        return half_comma;
    } else {
        return semitone - (index + 0.5) + half_comma;
    }
});

var mod = (n, m) => {
    var remain = n % m;
    return Math.floor(remain >= 0 ? remain : remain + m);
};

syntheticSound = (semitone) => {
    const fundamentalFrequency = baseFrequency * Math.pow(2, semitone / 12);
    const gainNode = audioContext.createGain();
    const oscillators = [];

    // Create oscillators for fundamental and overtones with individual gains
    let overtoneGains = [0.4, 0.2, 0.1, 0.8, 0.6, 0.4, 0.2];
    let overtoneGainsTotal = overtoneGains.reduce((a,b) => a+b, 0);
    overtoneGains = overtoneGains.map((x) => 0.7*x/overtoneGainsTotal);
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
    }, 800); // Stop after 0.8 seconds
}

function playSound(index) {
    console.log(index, semitones[index]);
    syntheticSound(semitones[index]);
}

function playMicrotonalSound(index) {
    console.log(index, microtonal_semitones[index]);
    syntheticSound(microtonal_semitones[index]);
}

whiteboard    = document.getElementById("whiteboard");
greyboard     = document.getElementById("greyboard");
circle        = document.getElementById("circle");
circle_button = undefined

set_jimiboard_whitekey_class = (i, modular_relative_offset) => {
    if (modular_relative_offset == 0 || modular_relative_offset == 4 || modular_relative_offset == 7) {
        whiteboard.children[i].classList.add('btn-emphasized');
    } else {
        whiteboard.children[i].classList.remove('btn-emphasized');
    }    
}

set_jimiboard_greykey_class = (i, modular_relative_offset) => {
    if ( false 
        || modular_relative_offset == 1 || modular_relative_offset == 2 
        || modular_relative_offset == 5
        || modular_relative_offset == 8 || modular_relative_offset == 9 || modular_relative_offset == 10
    ) {
        greyboard.children[i].classList.add('btn-emphasized');
    } else {
        greyboard.children[i].classList.remove('btn-emphasized');
    }    
}

function setScale(index) {
    if (circle_button) {
        circle_button.classList.toggle('btn-emphasized');
    }
    circle_button = circle.children[index];
    circle_button.classList.toggle('btn-emphasized');
    if (index % 2 == 0) {
        offset = (7*Math.round(index/2)) % 12;
        // Major chromatic scale
        for (let i=0; i<semitones.length; i++) {
            let modular_relative_offset = mod(i - offset, 12);
            semitones[i] = i + ji_corrections[modular_relative_offset];
            set_jimiboard_whitekey_class(i, modular_relative_offset);
        }
        // Major microtonal notes
        for (let i=0; i<microtonal_semitones.length-1; i++) {
            let modular_relative_offset = mod(i - offset, 12);
            microtonal_semitones[i] = i + 0.5 + microtonal_ji_corrections[modular_relative_offset];
            set_jimiboard_greykey_class(i, modular_relative_offset);
        }
    } else {
        index -= 1;
        offset = (11 + (7*Math.round(index/2))) % 12;
        // Minor chromatic scale
        for (let i=0; i<semitones.length; i++) {
            let modular_relative_offset = mod(offset - i, 12);
            semitones[i] = i - ji_corrections[modular_relative_offset];
            set_jimiboard_whitekey_class(i, modular_relative_offset);
        }
        // Minor microtonal notes
        for (let i=0; i<microtonal_semitones.length-1; i++) {
            let modular_relative_offset = mod(offset - i, 12) - 1;
            microtonal_semitones[i] = i + 0.5 - microtonal_ji_corrections[modular_relative_offset];
            set_jimiboard_greykey_class(i, modular_relative_offset);
        }
    }
}