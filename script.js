// script.js
const audioContext   = new AudioContext();
const baseFrequency  = 261.63; // Reference frequency for C4 ("middle C")
const three          = Math.pow(2, 19/12) // A number that approximately equals 3; useful for ensuring that there's a circle of fifths
const half_comma     = 0.5 * 12 * Math.log2(three*three*three*three/80) * 0.93;

// White keys
const ji_ratios      = [[1/1], [17/16], [three*three/8], [19/16], [5/4], [4/three], [17/12], [three/2], [30/19, 19/12], [5/three], [three*10/17], [15/8]];
const ji_semitones   = ji_ratios.map((ratiolist) => ratiolist.map((ratio) => 12*Math.log2(ratio)));
const ji_corrections = ji_semitones.map((semitonelist, index) => semitonelist.map((semitone) => semitone - index + half_comma));

// Grey keys
const microtonal_ji_ratios = [[], [5*three/14, 13/(4*three)], [5*three/13, 7/(2*three)], [], [], [5*three/11, 11/8], [], [], [13/8], [7/4], [11/(three*2)], []];
const microtonal_ji_semitones = microtonal_ji_ratios.map((ratiolist) => ratiolist.map((ratio) => 12*Math.log2(ratio)));
const microtonal_ji_corrections = microtonal_ji_semitones.map((semitonelist, index) => {
    if (semitonelist.length == 0) {
        return [half_comma];
    } else {
        return semitonelist.map((semitone) => semitone - (index + 0.5) + half_comma);
    }
});

avg = (L) => {
    if (L.length == 2) {
        let r = parseInt(slider.value, 10)/parseInt(slider.max, 10);
        return (1-r)*L[0] + r*L[1];
    } else {
        return L[0];
    }
}

var mod = (n, m) => {
    var remainder = n % m;
    return Math.floor(remainder >= 0 ? remainder : remainder + m);
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
    let semitone = index + scale_parity * avg(ji_corrections[modular_relative_offset(index)]);
    console.log(index, semitone);
    syntheticSound(semitone);
}

function playMicrotonalSound(index) {
    if (scale_parity === 0) {
        semitone = index + 0.5;
    } else {
        if (scale_parity === 1) {
            mro = modular_relative_offset(index);
        } else {
            mro = modular_relative_offset(index+1);
        }
        console.log(mro);
        semitone = index + 0.5 + scale_parity * avg(microtonal_ji_corrections[mro]);
    }
    console.log(index, semitone);
    syntheticSound(semitone);
}

whiteboard    = document.getElementById("whiteboard");
greyboard     = document.getElementById("greyboard");
slider        = document.getElementById("slider"); 
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

offset = 0;
modular_relative_offset = (j) => 0;
scale_parity = 0;

function setScale(index) {
    if (circle_button) {
        circle_button.classList.toggle('btn-emphasized');
    }
    circle_button = circle.children[index];
    circle_button.classList.toggle('btn-emphasized');
    if (index % 2 == 0) {
        scale_parity = 1;
        offset = (7*Math.round(index/2)) % 12;
        modular_relative_offset = (j) => mod(j - offset, 12);
        // Major chromatic scale
        for (let i=0; i<whiteboard.children.length; i++) {
            set_jimiboard_whitekey_class(i, modular_relative_offset(i));
        }
        // Major microtonal notes
        for (let i=0; i<greyboard.children.length; i++) {
            set_jimiboard_greykey_class(i, modular_relative_offset(i));
        }
    } else {
        scale_parity = -1;
        index -= 1;
        offset = (11 + (7*Math.round(index/2))) % 12;
        modular_relative_offset = (j) => mod(offset - j, 12);
        // Minor chromatic scale
        for (let i=0; i<whiteboard.children.length; i++) {
            set_jimiboard_whitekey_class(i, modular_relative_offset(i));
        }
        // Minor microtonal notes
        for (let i=0; i<greyboard.children.length; i++) {
            set_jimiboard_greykey_class(i, modular_relative_offset(i) - 1);
        }
    }
}

reset = () => {
    offset = 0;
    modular_relative_offset = (j) => 0;
    scale_parity = 0;
    if (circle_button) {
        circle_button.classList.toggle('btn-emphasized');
        circle_button = undefined;
    }
    for (let i=0; i<whiteboard.children.length; i++) {
        whiteboard.children[i].classList.remove('btn-emphasized')
    }
    for (let i=0; i<greyboard.children.length; i++) {
        greyboard.children[i].classList.remove('btn-emphasized')
    }
    slider.value = slider.max;
}