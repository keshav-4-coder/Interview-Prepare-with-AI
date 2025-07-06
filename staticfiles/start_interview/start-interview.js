let currentQuestion = 0;
const totalQuestions = 10;
let mediaRecorder;
let audioChunks = [];
let currentUtterance = null;
let isPaused = false;
let recognition;
let timerInterval;
let timeLeft = 180;

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

function startTimer() {
    console.log('Starting timer...');
    if (timerInterval) {
        clearInterval(timerInterval);
        console.log('Cleared existing timer interval');
    }
    timeLeft = 180;
    const timeLeftElement = document.getElementById('time-left');
    const timerElement = document.getElementById('timer');
    if (!timeLeftElement || !timerElement) {
        console.error('Timer elements (#time-left or #timer) not found in DOM');
        showPopup('Timer failed to start due to missing elements');
        return;
    }
    timeLeftElement.textContent = timeLeft;
    timerElement.style.display = 'block';
    timerInterval = setInterval(() => {
        timeLeft--;
        timeLeftElement.textContent = timeLeft;
        console.log(`Timer tick: ${timeLeft} seconds left`);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            console.log('Timer reached zero, triggering auto-submission');
            submitResponse(true);
        }
    }, 1000);
}

function showPopup(message) {
    console.log(`Showing popup with message: ${message}`);
    const popup = document.getElementById('popup-error');
    if (!popup) {
        console.error('Popup error element (#popup-error) not found in DOM');
        const errorElement = document.getElementById('error');
        if (errorElement) errorElement.textContent = message;
        return;
    }
    popup.textContent = message;
    popup.style.display = 'block';
    popup.classList.add('show');
    setTimeout(() => {
        popup.classList.remove('show');
        popup.style.display = 'none';
        console.log('Popup hidden after 3 seconds');
    }, 3000);
}

async function fetchQuestion() {
    console.log('Fetching question...');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorElement = document.getElementById('error');
    if (!loadingSpinner || !errorElement) {
        console.error('Loading spinner or error element not found');
        showPopup('Failed to initialize question fetch');
        return;
    }
    loadingSpinner.classList.add('active');
    errorElement.textContent = '';
    try {
        const response = await fetch('/interview_start/', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('Fetch question response:', data);
        loadingSpinner.classList.remove('active');
        if (data.error) {
            errorElement.textContent = data.error;
            showPopup(data.error);
            console.error(`Server error: ${data.error}`);
            return;
        }
        const questionTextElement = document.getElementById('question-text');
        const currentQuestionElement = document.getElementById('current-question');
        if (!questionTextElement || !currentQuestionElement) {
            console.error('Question text or current question element not found');
            showPopup('Failed to display question');
            return;
        }
        questionTextElement.textContent = data.question || 'No question available';
        currentQuestionElement.textContent = `${data.current}/11`; // Updated to X/11 format
        console.log(`Question loaded: ${data.question}`);
        speakQuestion(data.question);
        startTimer();
    } catch (error) {
        loadingSpinner.classList.remove('active');
        errorElement.textContent = 'Failed to load question: ' + error.message;
        showPopup('Failed to load question: ' + error.message);
        console.error('Fetch question error:', error);
    }
}

function speakQuestion(text) {
    console.log(`Speaking question: ${text}`);
    window.speechSynthesis.cancel();
    currentUtterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Victoria'));
    if (femaleVoice) currentUtterance.voice = femaleVoice;
    currentUtterance.rate = 1.0;
    currentUtterance.pitch = 1.0;
    currentUtterance.onend = () => {
        document.getElementById('play-audio').disabled = false;
        document.getElementById('pause-audio').disabled = true;
        document.getElementById('resume-audio').disabled = true;
        console.log('Question speech ended');
    };
    window.speechSynthesis.speak(currentUtterance);
    document.getElementById('play-audio').disabled = true;
    document.getElementById('pause-audio').disabled = false;
    document.getElementById('resume-audio').disabled = true;
    isPaused = false;
}

function playQuestion() {
    if (currentUtterance) {
        console.log('Replaying question');
        speakQuestion(document.getElementById('question-text').textContent);
    }
}

function pauseQuestion() {
    if (currentUtterance && !isPaused) {
        console.log('Pausing question speech');
        window.speechSynthesis.pause();
        isPaused = true;
        document.getElementById('pause-audio').disabled = true;
        document.getElementById('resume-audio').disabled = false;
    }
}

function resumeQuestion() {
    if (currentUtterance && isPaused) {
        console.log('Resuming question speech');
        window.speechSynthesis.resume();
        isPaused = false;
        document.getElementById('pause-audio').disabled = false;
        document.getElementById('resume-audio').disabled = true;
    }
}

async function startRecording() {
    console.log('Starting recording...');
    try {
        if (!recognition) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.error('SpeechRecognition not supported');
                showPopup('Speech recognition not supported');
                return;
            }
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            let finalTranscript = document.getElementById('text-answer').value || '';
            recognition.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }
                document.getElementById('text-answer').value = finalTranscript + interimTranscript;
                console.log(`Speech recognition result: Final="${finalTranscript}", Interim="${interimTranscript}"`);
            };
            recognition.onerror = (event) => {
                console.error('Recognition error:', event.error);
                showPopup('Speech recognition error: ' + event.error);
            };
            recognition.onend = () => {
                console.log('Speech recognition ended');
                // Restart recognition to continue listening
                if (document.getElementById('start-recording').disabled) {
                    recognition.start();
                }
            };
        }
        recognition.start();

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioInput = document.getElementById('audio-input');
            audioInput.src = URL.createObjectURL(audioBlob);
            audioInput.style.display = 'block';
            console.log('Recording stopped, audio blob created');
        };
        mediaRecorder.start();
        document.getElementById('start-recording').disabled = true;
        document.getElementById('stop-recording').disabled = false;
        document.getElementById('recording-status').textContent = 'Recording...';
    } catch (error) {
        console.error('Recording error:', error);
        showPopup('Microphone access denied: ' + error.message);
        document.getElementById('error').textContent = 'Microphone access denied: ' + error.message;
    }
}

function stopRecording() {
    console.log('Stopping recording...');
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        if (recognition) recognition.stop();
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream =>
            stream.getTracks().forEach(track => track.stop())
        );
        document.getElementById('start-recording').disabled = false;
        document.getElementById('stop-recording').disabled = true;
        document.getElementById('recording-status').textContent = 'Recording stopped';
    }
}

async function submitResponse(isTimerTriggered = false) {
    console.log(`Submitting response (Timer triggered: ${isTimerTriggered})...`);
    const submitLoading = document.getElementById('submit-loading');
    const submitButton = document.getElementById('submit-button');
    const errorElement = document.getElementById('error');
    if (!submitLoading || !submitButton || !errorElement) {
        console.error('Submit elements not found');
        showPopup('Submission failed due to missing elements');
        return;
    }
    submitLoading.classList.add('active');
    submitButton.disabled = true;
    errorElement.textContent = '';
    const textAnswer = document.getElementById('text-answer').value.trim();
    const audioBlob = audioChunks.length > 0 ? new Blob(audioChunks, { type: 'audio/webm' }) : null;

    if (!isTimerTriggered && !textAnswer && !audioBlob) {
        submitLoading.classList.remove('active');
        submitButton.disabled = false;
        showPopup('Please write or record your answer');
        console.log('Empty answer, showing popup');
        return;
    }

    const formData = new FormData();
    formData.append('textAnswer', textAnswer || '');
    if (audioBlob) formData.append('audioAnswer', audioBlob, 'answer.webm');
    formData.append('isTimerTriggered', isTimerTriggered.toString());

    try {
        const response = await fetch('/interview_start/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrftoken
            }
        });

        const data = await response.json();
        console.log('Submit response data:', data);
        submitLoading.classList.remove('active');
        submitButton.disabled = false;

        if (!response.ok) {
            const errorMsg = data.error || 'Unknown server error';
            errorElement.textContent = errorMsg;
            showPopup(errorMsg);
            console.error(`Server error: ${errorMsg}`);
            return;
        }

        if (data.error) {
            errorElement.textContent = data.error;
            showPopup(data.error);
            console.error(`Server error: ${data.error}`);
            return;
        }

        if (data.redirect) {
            clearInterval(timerInterval);
            console.log('Redirecting to: ' + data.redirect);
            window.location.href = data.redirect;
        } else {
            const questionTextElement = document.getElementById('question-text');
            const currentQuestionElement = document.getElementById('current-question');
            if (!questionTextElement || !currentQuestionElement) {
                console.error('Question text or current question element not found');
                showPopup('Failed to display next question');
                return;
            }
            questionTextElement.textContent = data.question || 'No question available';
            currentQuestionElement.textContent = data.current + '/11';
            console.log(`Next question loaded: ${data.question}`);
            speakQuestion(data.question);
            document.getElementById('text-answer').value = '';
            audioChunks = [];
            document.getElementById('audio-input').style.display = 'none';
            startTimer();
        }
    } catch (error) {
        submitLoading.classList.remove('active');
        submitButton.disabled = false;
        const errorMsg = 'Submission failed: ' + error.message;
        errorElement.textContent = errorMsg;
        showPopup(errorMsg);
        console.error('Submit response error:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded, initializing...');
    const audioInput = document.getElementById('audio-input');
    if (!audioInput) console.error('Audio input element not found');
    else audioInput.style.display = 'none';
    const timerElement = document.getElementById('timer');
    if (!timerElement) console.error('Timer element not found');
    else timerElement.style.display = 'block';
    const popupElement = document.getElementById('popup-error');
    if (!popupElement) console.error('Popup error element not found');
    else popupElement.style.display = 'none';
    window.speechSynthesis.onvoiceschanged = () => {
        console.log('Voices loaded');
        window.speechSynthesis.getVoices();
    };
    fetchQuestion();
});