from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
import asyncio
import openai
import httpx

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["https://talkgpt.web.app", "https://talkgpt-talking-genie-personal-talker--dheiryat.repl.co", "https://5512407b-fe22-49d9-b60d-8e3ffb1c3fb0.id.repl.co"], allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["*"])
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["talkgpt-1-r6338284.deta.app"])
openai.api_key = # YOUR API KEY
openai.api_base = # YOUR API BASE
http_client = httpx.AsyncClient(timeout=httpx.Timeout(connect=20, read=20, write=20, pool=20))


class APIClient:
    @staticmethod
    async def ask_real_GPT(questions, context):
        if not context:
            context = []
        for question in questions:
            context.append({"role": "user", "content": question})
        search_results = await fetch_search_results(questions)
        context.extend(search_results)
        response = await http_client.post(f"{openai.api_base}/chat/completions", headers={"Authorization": f"Bearer {openai.api_key}"}, json={"model": "gpt-3.5-turbo-0301", "messages": context})
        response_data = response.json()
        return [choice["message"]["content"] for choice in response_data["choices"]]


@app.post("/ask/")
async def read_root(request: Request):
    data = await request.json()
    question = (data.get("question", "")[:512] + '...') if len(data.get("question", "")) > 512 else data.get("question", "")
    question = f"You will respond to the following with a {data.get('personality', '')} personality/mannerism: {question}"    
    json_data = data.get("context", [{"role": "system", "content": "You are a talking voice assistant called TalkGPT built as a cool voice assistant. Please try to talk in less than 50 words, while still responding to the users entire prompt and fully adhering and listening to it."}])
    try:
        api_client = APIClient()
        response = await api_client.ask_real_GPT([question], json_data)
        json_data.append({"role": "assistant", "content": response[0]})
        return {"response": response[0], "context": json_data}
    except Exception:
        return {"response": "Error, I seem to be down. I'm just taking a quick nap though, don't worry!", "context": json_data}


async def fetch_search_results(questions):
    try:
        search_tasks = [http_client.get('https://ddg-api.herokuapp.com/search', params={'query': q, 'limit': 3}) for q in questions]
        search_responses = await asyncio.gather(*search_tasks)
        snippets_list = []
        for search_response in search_responses:
            search_results = search_response.json()
            snippets = [f'"{result["snippet"]}" URL:{result["link"]}.' for result in search_results]
            snippets_list.append(snippets)
        response_list = [{'role': 'system', 'content': f'Here are some updated web searches. Use this to improve user response: {", ".join(snippets)}'} for snippets in snippets_list]
        return response_list
    except Exception:
        return []
