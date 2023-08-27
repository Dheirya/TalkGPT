const speechRecognition = new webkitSpeechRecognition();
const updateInterval = 1000;
let currentContext;
let globalStream;
let blink = true;
let isListening = false;
let final_transcript = '';
let lastTranscriptUpdateTime = Date.now();
let personalize = "default";
speechRecognition.lang = 'en-US';
speechRecognition.continuous = true;
speechRecognition.interimResults = true;
speechRecognition.onerror = () => {isListening = false};
speechRecognition.onend = () => {
    if (final_transcript) {
        window.parent.postMessage('Thinking', '*');
        isListening = false;
        blink = false;
        document.getElementById("yourTalk").style.color = "#fff";
        document.getElementById("yourTalk").innerHTML = final_transcript.charAt(0).toUpperCase() + final_transcript.slice(1);
        document.getElementById("yourTalk").removeAttribute("id");
        document.getElementById("speak-icon").style.color = "white";
        if (final_transcript.toLowerCase() === "see you later") {
            window.postMessage('Wave', '*');
            document.getElementById("speak-icon").innerHTML = "mic_off";
            document.getElementById("output").innerHTML = document.getElementById("output").innerHTML + "<b>TalkGPT:</b> <span id='spoken'></span><br/><br/>";
            speak("Goodbye, hope we talk again soon!", function() {});
        } else {
            document.getElementById("speak-icon").innerHTML = "pending";
            document.getElementById("output").innerHTML = document.getElementById("output").innerHTML + "<b>TalkGPT:</b> <span id='spoken'>Thinking...</span><br/><br/>";
            scrollToBottom();
            fetch("https://talkgpt-1-r6338284.deta.app/ask/", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({question: final_transcript, context: currentContext, personality: personalize})
            }).then((response) => {
                return response.json()
            }).then((data) => {
                window.parent.postMessage('Start Read', '*');
                currentContext = data.context;
                document.getElementById("spoken").innerHTML = "";
                speak(data.response, function () {
                    window.parent.postMessage('End Read', '*');
                    document.getElementById("speak-icon").innerHTML = "mic";
                    blink = true;
                    blinkRed();
                    document.getElementById("output").innerHTML += "<b>You:</b> <span style='color: #ccc' id='yourTalk'>Speak...</span><br/><br/>";
                    speechRecognition.start();
                });
            });
            final_transcript = "";
        }
    } else {
        speechRecognition.start();
    }
};
speechRecognition.onresult = (event) => {
    scrollToBottom();
    lastTranscriptUpdateTime = Date.now();
    if (!isListening) {isListening = true}
    let interim_transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript;
        } else {
            interim_transcript += event.results[i][0].transcript;
        }
    }
    document.getElementById("yourTalk").style.color = "#ccc";
    document.getElementById("yourTalk").innerHTML = interim_transcript;
    if (!interim_transcript.trim()) {speechRecognition.stop()}
};
function enableMic() {
    navigator.mediaDevices.getUserMedia({video: false, audio: true}).then((stream) => {
        const voices = speechSynthesis.getVoices();
        voices.forEach(voice => {
            const option = document.createElement("option");
            option.value = voice.name;
            option.textContent = voice.name;
            window.parent.document.querySelector("#voice").appendChild(option);
        });
        window.parent.postMessage('Start Read', '*');
        globalStream = stream;
        speechRecognition.stop();
        document.getElementById("speak").style.bottom = "2px";
        document.getElementById("speak").style.left = "5px";
        document.getElementById("speak").style.transform = "scale(0.5)";
        document.getElementById("speak").removeAttribute("onclick");
        document.getElementById("speak-icon").innerHTML = "mic";
        document.getElementById("output").innerHTML = document.getElementById("output").innerHTML + "<b>TalkGPT:</b> <span id='spoken'></span><br/><br/>";
        speak("Welcome!", function () {document.getElementById('m1').style.display = 'inline'});
        document.getElementById("output").innerHTML = document.getElementById("output").innerHTML + "<b id='m1' style='display:none'>TalkGPT:</b> <span id='spoken'></span><br/><br/>";
        speak("You will always talk after I finish speaking, or until the microphone icon starts flashing red. To stop the conversation, just say 'see you later'! Got it? Great!", function () {document.getElementById('m2').style.display = 'inline'});
        document.getElementById("output").innerHTML = document.getElementById("output").innerHTML + "<b id='m2' style='display:none'>TalkGPT:</b> <span id='spoken'></span><br/><br/>";
        speak("So, what's on your mind?", function () {
            window.parent.postMessage('End Read', '*');
            document.getElementById("speak-icon").innerHTML = "mic";
            blink = true;
            blinkRed();
            document.getElementById("output").innerHTML = document.getElementById("output").innerHTML + "<b>You:</b> <span style='color: #ccc' id='yourTalk'>Speak...</span><br/><br/>";
            speechRecognition.start();
        });
    }).catch((err) => {
        window.parent.postMessage('Declined', '*');
        document.getElementById("output").innerHTML = document.getElementById("output").innerHTML + "<b>System:</b> " + err + "<br/><br/>";
        document.getElementById("output").innerHTML = document.getElementById("output").innerHTML + "<b>TalkGPT:</b> <span id='spoken'></span><br/><br/>";
        document.getElementById("speak-icon").innerHTML = "error";
        speak("Please click the icon to try again and enable your microphone, and try checking your browser settings");
    });
}
function blinkRed() {
    if (blink) {
        if (document.getElementById("speak-icon").style.color === "red") {
            document.getElementById("speak-icon").style.color = "white";
        } else {
            document.getElementById("speak-icon").style.color = "red";
        }
        setTimeout(blinkRed, 1000);
    }
}
window.parent.document.querySelector("#personality").addEventListener("change", () => {
    personalize = window.parent.document.querySelector("#personality").value;
});
setInterval(function() {
    if (isListening) {
        const timeSinceLastUpdate = Date.now() - lastTranscriptUpdateTime;
        if (timeSinceLastUpdate > updateInterval) {
            speechRecognition.stop();
        }
    }
}, 250);
