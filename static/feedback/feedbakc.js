const { jsPDF } = window.jspdf;

function toggleMenu() {
    const mobileNav = document.querySelector('.mobile-nav');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const isExpanded = mobileNav.classList.toggle('active');
    menuBtn.setAttribute('aria-expanded', isExpanded);
}

function showTab(tabId) {
    document.querySelectorAll('.content').forEach(content => {
        content.style.display = 'none';
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).style.display = 'block';
    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add('active');
}

function setScoreCircleColor(score) {
    let color;
    if (score >= 90) color = '#22c55e'; // Green
    else if (score >= 70) color = '#f97316'; // Orange
    else if (score >= 50) color = '#ffde21'; // Yellow
    else color = '#ef4444'; // Red
    document.querySelectorAll('.score-circle-fill').forEach(element => {
        element.style.stroke = color;
    });
}

function parseFeedbackData(feedback) {
    if (!feedback || typeof feedback !== 'string') {
        console.error('Invalid feedback data:', feedback);
        return { overallScore: 0, questions: [] };
    }

    const lines = feedback.split('\n').filter(line => line.trim() !== '');
    let overallScore = 0;
    const questions = [];
    let currentQuestion = null;

    const scoreLine = lines.find(line => line.toLowerCase().includes('overall performance score'));
    if (scoreLine) {
        const match = scoreLine.match(/Overall Performance Score:\s*(\d+\.?\d*)\s*%?/i);
        overallScore = match ? parseFloat(match[1]) : 0;
    } else {
        console.warn('Overall score line not found in feedback:', feedback);
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('Question: ')) {
            if (currentQuestion) questions.push(currentQuestion);
            currentQuestion = { question: line.replace('Question: ', ''), response: '', feedback: '', score: 0 };
        } else if (line.startsWith('Your Response: ') && currentQuestion) {
            currentQuestion.response = line.replace('Your Response: ', '');
        } else if (line.startsWith('Feedback: ') && currentQuestion) {
            currentQuestion.feedback = line.replace('Feedback: ', '');
            while (i + 1 < lines.length && !lines[i + 1].startsWith('Question: ') && !lines[i + 1].startsWith('Your Response: ') && !lines[i + 1].startsWith('Overall Performance Score:')) {
                currentQuestion.feedback += ' ' + lines[++i].trim();
            }
            const scoreMatch = currentQuestion.feedback.match(/Score:\s*(\d+\.?\d*)\s*%?/i);
            currentQuestion.score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
        }
    }
    if (currentQuestion) questions.push(currentQuestion);

    return { overallScore, questions };
}

function extractFeedbackDetails(feedbackText) {
    console.log('Processing feedback:', feedbackText);
    if (!feedbackText || typeof feedbackText !== 'string') {
        console.error('Invalid feedbackText:', feedbackText);
        return { score: 0, strengths: [], improvements: [], breakdown: { clarity: 0, relevance: 0, confidence: 0, conciseness: 0, problemSolving: 0 } };
    }

    const strengths = [];
    const improvements = [];
    const breakdown = { clarity: 0, relevance: 0, confidence: 0, conciseness: 0, problemSolving: 0 };

    let scoreMatch = feedbackText.match(/score:\s*(\d+\.?\d*)\s*%?/i);
    if (!scoreMatch) scoreMatch = feedbackText.match(/Score:\s*(\d+\.?\d*)\s*%?/i);
    if (!scoreMatch) scoreMatch = feedbackText.match(/(\d+\.?\d*)\s*%?\s*(?:score|Score)/i);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
    console.log('Extracted score:', score, 'from:', feedbackText);

    // Parse feedback into strengths and improvements based on API's phrasing
    const feedbackParts = feedbackText.split('. ').filter(part => part.trim() !== '' && !part.match(/Score:/i));
    feedbackParts.forEach(part => {
        const partLower = part.toLowerCase();
        // Strengths: Positive indicators
        if ((partLower.includes('good') || partLower.includes('effective') || partLower.includes('nice')) && !partLower.includes('lacks') && !partLower.includes('limited')) {
            strengths.push(part.trim() + '.');
        }
        // Improvements: Suggestions or negatives
        else if (partLower.includes('include') || partLower.includes('try') || partLower.includes('consider') || partLower.includes('address') || partLower.includes('lacks') || partLower.includes('limited') || partLower.includes('incoherent')) {
            improvements.push(part.trim() + '.');
        }
    });

    // Approximate breakdown based on score
    breakdown.clarity = score / 20;
    breakdown.relevance = score / 20;
    breakdown.confidence = score / 20;
    breakdown.conciseness = score / 20;
    breakdown.problemSolving = score / 20;

    return { score, strengths, improvements, breakdown };
}

function parseOverallFeedback(questions) {
    const feedbackPoints = [];
    questions.forEach((q, index) => {
        const { strengths, improvements } = extractFeedbackDetails(q.feedback);
        if (strengths.length > 0) feedbackPoints.push(`**Question ${index + 1} Strengths:** ${strengths.join(', ')}`);
        if (improvements.length > 0) feedbackPoints.push(`**Question ${index + 1} Areas to Improve:** ${improvements.join(', ')}`);
    });
    return feedbackPoints;
}

function initCharts(overallScore, questions) {
    try {
        overallScore = overallScore || 0;
        const breakdown = questions.length > 0 ? extractFeedbackDetails(questions.reduce((acc, q) => acc + (q.feedback || ''), '')).breakdown : {
            clarity: 0, relevance: 0, confidence: 0, conciseness: 0, problemSolving: 0
        };
        const radarCtx = document.getElementById('radarChart').getContext('2d');
        new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Clarity', 'Relevance', 'Confidence', 'Conciseness', 'Problem-Solving'],
                datasets: [{
                    label: 'Performance',
                    data: [breakdown.clarity, breakdown.relevance, breakdown.confidence, breakdown.conciseness, breakdown.problemSolving],
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
                    borderWidth: 2
                }]
            },
            options: { scales: { r: { beginAtZero: true, max: 10, ticks: { stepSize: 2 } } } }
        });

        const questionScores = questions.map(q => q.score || 0);
        const barCtx = document.getElementById('barChart').getContext('2d');
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: questions.map((_, index) => `Q${index + 1}`),
                datasets: [{
                    label: 'Question Scores',
                    data: questionScores,
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
                    borderWidth: 1
                }]
            },
            options: { scales: { y: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } } }
        });
    } catch (error) {
        console.error('Chart initialization failed:', error);
        document.getElementById('radarChartError').style.display = 'block';
        document.getElementById('barChartError').style.display = 'block';
    }
}

function toggleBreakdown() {
    const breakdown = document.getElementById('performance-breakdown');
    const button = document.querySelector('.toggle-breakdown');
    const isExpanded = breakdown.classList.toggle('visible');
    button.setAttribute('aria-expanded', isExpanded);
}

function downloadPDF(overallScore, questions) {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text('Interview Feedback - InterviewAI', 20, y);
    y += 10;
    doc.setFontSize(12);
    overallScore = overallScore || 0;
    doc.text(`Overall Score: ${overallScore}%`, 20, y);
    y += 10;

    questions.forEach((q, index) => {
        const { score, strengths, improvements } = extractFeedbackDetails(q.feedback || '');
        doc.text(`Question ${index + 1}: ${q.question} (Score: ${score || 0}%)`, 20, y);
        y += 10;
        if (strengths.length > 0) {
            doc.text('Strengths: ' + strengths.join(', '), 25, y);
            y += 10;
        }
        if (improvements.length > 0) {
            doc.text('Areas to Improve: ' + improvements.join(', '), 25, y);
            y += 10;
        }
    });

    doc.save('interview_feedback.pdf');
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof feedbackData === 'undefined' || !feedbackData) {
        console.error('feedbackData is undefined or empty');
        document.getElementById('score-text').textContent = 'Error: No feedback data available';
        return;
    }

    const lines = feedbackData.split('\n').filter(line => line.trim() !== '');
    let overallScore = 0;
    let avgScore = 0;

    // Extract overall and average scores from feedback text
    const overallMatch = lines.find(line => line.toLowerCase().includes('overall performance score'));
    if (overallMatch) {
        const match = overallMatch.match(/Overall Performance Score:\s*(\d+\.?\d*)\s*%?/i);
        overallScore = match ? parseFloat(match[1]) : 0;
    }
    const avgMatch = lines.find(line => line.toLowerCase().includes('average question score'));
    if (avgMatch) {
        const match = avgMatch.match(/Average Question Score:\s*(\d+\.?\d*)\s*%?/i);
        avgScore = match ? parseFloat(match[1]) : 0;
    }

    // Update overall score display
    document.getElementById('score-text').textContent = `${overallScore}%`;
    document.getElementById('score-circle-fill').setAttribute('stroke-dasharray', `${overallScore}, 100`);
    setScoreCircleColor(overallScore);

    // Update average score display
    document.getElementById('avg-score-text').textContent = `${avgScore}%`;
    document.getElementById('avg-score-circle-fill').setAttribute('stroke-dasharray', `${avgScore}, 100`);
    setScoreCircleColor(avgScore);

    // Parse questions for breakdown and other details
    const questions = [];
    let currentQuestion = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('Question: ')) {
            if (currentQuestion) questions.push(currentQuestion);
            currentQuestion = { question: line.replace('Question: ', ''), response: '', feedback: '', score: 0 };
        } else if (line.startsWith('Your Response: ') && currentQuestion) {
            currentQuestion.response = line.replace('Your Response: ', '');
        } else if (line.startsWith('Feedback: ') && currentQuestion) {
            currentQuestion.feedback = line.replace('Feedback: ', '');
            while (i + 1 < lines.length && !lines[i + 1].startsWith('Question: ') && !lines[i + 1].startsWith('Your Response: ')) {
                currentQuestion.feedback += ' ' + lines[++i].trim();
            }
            const scoreMatch = currentQuestion.feedback.match(/Score:\s*(\d+\.?\d*)\s*%?/i);
            currentQuestion.score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
        }
    }
    if (currentQuestion) questions.push(currentQuestion);

    const breakdown = questions.length > 0 ? extractFeedbackDetails(questions.reduce((acc, q) => acc + (q.feedback || ''), '')).breakdown : {
        clarity: 0, relevance: 0, confidence: 0, conciseness: 0, problemSolving: 0
    };
    document.getElementById('clarity-score').textContent = `${breakdown.clarity.toFixed(1)}/10`;
    document.getElementById('relevance-score').textContent = `${breakdown.relevance.toFixed(1)}/10`;
    document.getElementById('confidence-score').textContent = `${breakdown.confidence.toFixed(1)}/10`;
    document.getElementById('conciseness-score').textContent = `${breakdown.conciseness.toFixed(1)}/10`;
    document.getElementById('problem-solving-score').textContent = `${breakdown.problemSolving.toFixed(1)}/10`;

    const strengthsList = document.getElementById('strengths-list');
    const improvementsList = document.getElementById('improvements-list');
    strengthsList.innerHTML = '';
    improvementsList.innerHTML = '';
    const allStrengths = new Set();
    const allImprovements = new Set();
    questions.forEach(q => {
        const { strengths, improvements } = extractFeedbackDetails(q.feedback || '');
        strengths.forEach(s => allStrengths.add(s));
        improvements.forEach(i => allImprovements.add(i));
    });
    allStrengths.forEach(strength => {
        const li = document.createElement('li');
        li.textContent = strength;
        strengthsList.appendChild(li);
    });
    allImprovements.forEach(improvement => {
        const li = document.createElement('li');
        li.textContent = improvement;
        improvementsList.appendChild(li);
    });

    const overallFeedbackPoints = parseOverallFeedback(questions);
    const overallFeedbackList = document.createElement('ul');
    overallFeedbackPoints.forEach(point => {
        const li = document.createElement('li');
        li.innerHTML = point.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        overallFeedbackList.appendChild(li);
    });
    const overallFeedbackContainer = document.getElementById('overall-feedback');
    overallFeedbackContainer.innerHTML = '';
    overallFeedbackContainer.appendChild(overallFeedbackList);

    const questionBreakdown = document.getElementById('question-breakdown');
    questionBreakdown.innerHTML = '';
    questions.forEach((q, index) => {
        const { score, strengths, improvements } = extractFeedbackDetails(q.feedback || '');
        const div = document.createElement('div');
        div.className = 'question';
        div.innerHTML = `
            <h3>Question ${index + 1}</h3>
            <div class="score">Score: ${score || 0}%</div>
            <p>${q.question}</p>
            <p><span class="strengths">Strengths:</span> ${strengths.join(', ') || 'None'}</p>
            <p><span class="areas-to-improve">Areas to Improve:</span> ${improvements.join(', ') || 'None'}</p>
            <div class="progress-bar"><div class="progress" style="width: ${score || 0}%;"></div></div>
        `;
        questionBreakdown.appendChild(div);
    });

    initCharts(overallScore, questions);

    document.getElementById('download-feedback').addEventListener('click', () => downloadPDF(overallScore, questions));
    document.getElementById('save-profile').addEventListener('click', () => alert('Feedback saved to profile!'));
    document.querySelector('.toggle-breakdown').addEventListener('click', toggleBreakdown);

    const backToTop = document.querySelector('.back-to-top');
    window.addEventListener('scroll', () => backToTop.classList.toggle('visible', window.scrollY > 300));
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.querySelector('.mobile-menu-btn').addEventListener('click', toggleMenu);

    document.getElementById('current-year').textContent = new Date().getFullYear();
});

