const utterance = new SpeechSynthesisUtterance();
let wordIndex = 0;
utterance.lang = 'en-UK';
utterance.volume = 1;
utterance.rate = 0.9;
utterance.pitch = 1.2;
const speakQueue = [];
let isSpeaking = false;
let lastSpokenWord = '';
function scrollToBottom() {
    window.scrollTo({left: 0, top: document.body.scrollHeight, behavior: 'smooth'});
}
function speak(text, callback) {
    if (document.getElementById("speak-icon").innerHTML !== "error" && document.getElementById("speak-icon").innerHTML !== "mic_off") {
        document.getElementById("speak-icon").innerHTML = "pending";
    }
    speakQueue.push({text, callback});
    if (!isSpeaking) {
        speakNext();
    }
}
function speakNext() {
    if (speakQueue.length === 0) {
        isSpeaking = false;
        return;
    }
    isSpeaking = true;
    const { text, callback } = speakQueue.shift();
    utterance.text = text;
    speechSynthesis.speak(utterance);
    if (typeof callback === "function") {
        utterance.onend = function () {
            wordIndex = 0;
            callback();
            document.getElementById("spoken").removeAttribute("id");
            scrollToBottom();
            speakNext();
        };
    } else {
        utterance.onend = function () {
            wordIndex = 0;
            document.getElementById("spoken").removeAttribute("id");
            scrollToBottom();
            speakNext();
        };
    }
}
utterance.onboundary = function (event) {
    let word = getWordAt(utterance.text, event.charIndex);
    if (word !== lastSpokenWord) {
        document.getElementById("spoken").innerHTML += word + " ";
        lastSpokenWord = word;
        scrollToBottom();
    }
};
function getWordAt (str, pos) {
    str = String(str);
    pos = Number(pos) >>> 0;
    const left = str.slice(0, pos + 1).search(/\S+$/), right = str.slice(pos).search(/\s/);
    if (right < 0) {
        return str.slice(left);
    }
    return str.slice(left, right + pos);
}
function autoplay() {
    if ('SpeechSynthesisUtterance' in window && 'webkitSpeechRecognition' in window && 'speechSynthesis' in window) {
        let isAutoplayAllowed;
        let isTTSReady;
        try {
            new AudioContext();
            isAutoplayAllowed = true;
        } catch (error) {
            document.getElementById("spoken").innerHTML = "Please press the microphone button to start speaking";
        }
        if (isAutoplayAllowed) {
            const voices = speechSynthesis.getVoices();
            isTTSReady = voices.length > 0;
            if (isTTSReady) {
                speak("Please press the microphone button to start speaking", () => {});
            } else {
                document.getElementById("spoken").innerHTML = "Please press the microphone button to start speaking";
                document.getElementById("spoken").removeAttribute("id");
            }
        }
    } else {
        document.getElementById("spoken").innerHTML = "Sorry, your browser doesn't support speech synthesis. Please use a more modern browser or check your settings.";
        document.getElementById("speak").remove();
    }
}
window.parent.document.querySelector("#voice").addEventListener("change", () => {
    utterance.voice = speechSynthesis.getVoices().filter(function (voice) {
        return voice.name == window.parent.document.querySelector("#voice").value;
    })[0];
    if (window.parent.document.querySelector('#voice [value="default"]')) window.parent.document.querySelector('#voice [value="default"]').remove();
});
window.parent.document.querySelector("#speed").addEventListener("change", () => {
    utterance.rate = window.parent.document.querySelector("#speed").value;
    window.parent.document.querySelector("#numSpeed").innerHTML = window.parent.document.querySelector("#speed").value;
});
window.parent.document.querySelector("#pitch").addEventListener("change", () => {
    utterance.pitch = window.parent.document.querySelector("#pitch").value;
    window.parent.document.querySelector("#numPitch").innerHTML = window.parent.document.querySelector("#pitch").value;
});
