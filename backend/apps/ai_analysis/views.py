from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from openai import OpenAI
from django.conf import settings
import time
import json

# Create your views here.
OPENAI_KEY = settings.OPENAI_KEY
ASSISTANT_ID = settings.ASSISTANT_ID

def query_openai(contentText):        
    client = OpenAI(api_key=OPENAI_KEY)
    thread = client.beta.threads.create(
        messages=[
            {
                "role": "user",
                "content": contentText,
            },
        ],
    )
    run = client.beta.threads.runs.create(thread_id=thread.id, assistant_id=ASSISTANT_ID)
    print("Run Created:", run.id)
    while run.status != "completed":
        run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
        print("Run Status:", run.status)
        time.sleep(1.0)
    else:
        print("Run Completed")
    message_response = client.beta.threads.messages.list(thread_id=thread.id, run_id=run.id)
    messages = message_response.data
    return messages[0].content[0].text.value

@api_view(['POST'])
def analyze_parts(request):
    """
    Analyze parts using OpenAI.
    """
    try:
        data = request.data
        print("Data1:", data)
        if not data or 'partNumbers' not in data:
            return Response({'error': 'Please provide part numbers to analyze.'}, status=400)
        print("Data:", data)
        content = "; ".join(data['partNumbers'])
        print("Content:", content)
        response = query_openai(content)
        json_response = json.loads(response)
        return Response(json_response)

    except Exception as e:
        return Response({'error': str(e)}, status=400)
