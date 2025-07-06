import os
from dotenv import load_dotenv
import google.generativeai as genai
import logging
import re
import speech_recognition as sr
import io
import random
from .models import UsedQuestion
from pydub import AudioSegment

# Set up logging
logger = logging.getLogger(__name__)

load_dotenv()
GOOGLE_API_KEY = os.getenv('GEMINI_API_KEY')
if not GOOGLE_API_KEY:
    logger.error("GEMINI_API_KEY is not set in environment variables.")
    raise ValueError("GEMINI_API_KEY is not configured.")

genai.configure(api_key=GOOGLE_API_KEY)

def get_interview_question(job_role, industry, experience_level, interview_type, specific_skills, user=None):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        question_types = [
            "behavioral question about",
            "technical question focusing on",
            "situational question related to",
            "problem-solving question involving",
            "scenario-based question on"
        ]
        random_type = random.choice(question_types)
        max_attempts = 5
        for _ in range(max_attempts):
            prompt = (
                f"Generate a concise interview question (max 2 lines, under 30 words) for a {job_role} role in the {industry} industry with {experience_level} experience. "
                f"The interview type is {interview_type}. It should be a {random_type} {specific_skills}. Ensure the question is clear, relevant, professional, and unique."
            )
            response = model.generate_content(prompt)
            question = response.text.strip()
            if not question or len(question.split()) > 30 or question.count('\n') > 1:
                logger.warning(f"Invalid question generated: {question}")
                continue
            # Check if question has been used by the user
            if user and UsedQuestion.objects.filter(user=user, question=question).exists():
                logger.info(f"Question already used: {question}")
                continue
            logger.info(f"Generated question: {question}")
            # Save the question to the database
            if user:
                UsedQuestion.objects.create(user=user, question=question)
            return {'question': question}
        logger.warning("Could not generate a unique question after max attempts")
        return {'error': 'Unable to generate a unique question'}
    except Exception as e:
        error_msg = f"Failed to generate question: {str(e)}"
        logger.error(error_msg)
        return {'error': error_msg}


def evaluate_response(question, user_response, audio_file=None):
    logger.info("Evaluating response with Gemini API")
    
    audio_transcript = ""
    if audio_file:
        try:
            logger.info(f"Processing audio file: {audio_file.name}, size: {audio_file.size} bytes")
            # Convert WebM to WAV
            audio_io = io.BytesIO(audio_file.read())
            audio_segment = AudioSegment.from_file(audio_io, format="webm")
            wav_io = io.BytesIO()
            audio_segment.export(wav_io, format="wav")
            wav_io.seek(0)
            
            recognizer = sr.Recognizer()
            with sr.AudioFile(wav_io) as source:
                audio_data = recognizer.record(source)
                audio_transcript = recognizer.recognize_google(audio_data)
            logger.info(f"Audio transcript: {audio_transcript[:100]}...")
        except sr.UnknownValueError:
            logger.error("Audio transcription failed: Google Speech Recognition could not understand audio")
            audio_transcript = user_response
        except sr.RequestError as e:
            logger.error(f"Audio transcription failed: Request error from Google Speech API; {str(e)}")
            audio_transcript = user_response
        except Exception as e:
            logger.error(f"Audio transcription failed: {str(e)}")
            audio_transcript = user_response
    
    final_response = audio_transcript or user_response
    
    logger.info(f"Final response for evaluation: {final_response[:100]}...")
    
    verb_pattern = re.compile(r'\b(am|is|are|was|were|be|being|been|have|has|had|do|does|did|go|goes|went|gone|make|makes|made|think|thinks|thought|know|knows|knew|say|says|said|tell|tells|told)\b', re.IGNORECASE)
    word_count = len(final_response.split())
    has_verb = bool(verb_pattern.search(final_response))
    
    if word_count < 3 or not has_verb or re.match(r'^[a-z]{1,4}$', final_response.strip(), re.IGNORECASE):
        logger.warning("Response is incoherent or too short")
        return {
            'feedback': "Feedback: Answer is incoherent or nonsensical. Score: 0.0%."
        }
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = (
            f"Evaluate this interview response for the question: '{question}'. Response: '{final_response}'. "
            f"Provide feedback focusing on clarity, relevance, confidence, conciseness, and problem-solving. "
            f"Assign a score out of 100. Return feedback in the format: "
            f"'Feedback: [feedback text]. Score: X.X%.' where X.X is a number with one decimal place."
        )
        response = model.generate_content(prompt)
        feedback_text = response.text.strip()
        logger.info(f"Generated feedback: {feedback_text}")

        score_match = re.search(r'Score:\s*(\d+\.?\d*)\s*%?', feedback_text, re.IGNORECASE)
        if score_match:
            score = float(score_match.group(1))
            score = round(max(0, min(100, score)), 1)
            feedback_text = re.sub(r'Score:\s*\d+\.?\d*\s*%?', f'Score: {score}%', feedback_text, 1, re.IGNORECASE)
        else:
            feedback_text += " Score: 50.0%."

        return {'feedback': feedback_text}
    except Exception as e:
        logger.error(f"Failed to evaluate response: {str(e)}")
        return {
            'feedback': "Feedback: Unable to evaluate response due to an error. Score: 50.0%."
        }