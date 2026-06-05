# ---------------------------------------------------------------------------
# ORIGINAL PROTOTYPE — preserved for reference only.
#
# This 31-line Gradio script is where the project started. It contains the
# original typos (`clint` instead of `client`, `respone` instead of
# `response`) and uses the older `dall-e-3` model.
#
# The production rewrite lives in:
#   backend/app/services/gpt_image_service.py   ← gpt-image-1 wrapper
#   backend/app/                                 ← full FastAPI application
#
# Do NOT import or run this file as part of the application.
# ---------------------------------------------------------------------------
from openai import OpenAI
from dotenv import find_dotenv, load_dotenv
import gradio as gr
import requests
from PIL import Image

_ = load_dotenv(find_dotenv())

clint = OpenAI()

def generate(my_prompt):
    respone = clint.images.generate(
        model="dall-e-3",
        prompt=my_prompt,
        quality="standard",
        size="1024x1024",
        n=1
    )
    image_url = respone.data[0].url
    r = requests.get(image_url, stream=True)
    return Image.open(r.raw)

with gr.Blocks() as demo:
    gr.Markdown("Image Generation")
    my_prompt = gr.Textbox(label="Enter your prompt")
    btn = gr.Button("submit")
    img = gr.Image(label="Result")

    btn.click(fn=generate, inputs=[my_prompt], outputs=[img])

demo.launch()