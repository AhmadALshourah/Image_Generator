"""One-time script: generate seed images and store them in the DB + disk.

Run from the backend/ directory:
    python seed_gallery.py

Uses quality=low to keep API cost minimal (~$0.01 per image).
Already-cached prompts are skipped automatically.
"""
import asyncio
import sys

PROMPTS = [
    "A majestic snow leopard resting on a rocky mountain peak at golden hour, photorealistic",
    "A cozy coffee shop interior with warm lighting, wooden shelves of books, rain outside the window, cinematic",
    "An ancient Japanese temple surrounded by cherry blossom trees at sunset, oil painting style",
    "A futuristic city skyline at night with neon lights reflecting in a canal, cyberpunk aesthetic",
    "A serene beach at dawn with golden sand and gentle turquoise waves, watercolor illustration",
    "A dense enchanted forest with glowing mushrooms and fireflies, fantasy digital art",
    "A lone astronaut standing on the surface of Mars, red dust storm in the background, cinematic",
    "A medieval castle on a cliff above a stormy sea, dramatic lightning, oil painting",
    "A colorful Moroccan market at sunset, spices and lanterns, street photography style",
    "An underwater coral reef teeming with tropical fish, crystal clear blue water, photorealistic",
    "A steam-powered clockwork city floating among clouds, steampunk illustration",
    "A wolf howling at the full moon in a snowy pine forest, dramatic lighting",
]


async def seed() -> None:
    from app.database import AsyncSessionLocal
    from app.models import Image
    from app.schemas import GenerateRequest
    from app.services import (
        cache_service,
        cost_service,
        embedding_service,
        gpt_image_service,
        storage_service,
    )
    from sqlalchemy import select

    print(f"Seeding {len(PROMPTS)} images (quality=low, size=1024x1024)\n")

    async with AsyncSessionLocal() as db:
        for i, prompt in enumerate(PROMPTS, 1):
            prompt_hash = cache_service.compute_prompt_hash(
                effective_prompt=prompt,
                size="1024x1024",
                quality="low",
                background="auto",
                output_format="png",
            )

            # skip if already in DB
            existing = await db.scalar(select(Image).where(Image.prompt_hash == prompt_hash))
            if existing:
                print(f"[{i}/{len(PROMPTS)}] SKIP (cached): {prompt[:55]}…")
                continue

            print(f"[{i}/{len(PROMPTS)}] Generating: {prompt[:55]}…", end=" ", flush=True)
            try:
                req = GenerateRequest(
                    prompt=prompt,
                    size="1024x1024",
                    quality="low",
                    background="auto",
                    output_format="png",
                    force=False,
                )
                result = await gpt_image_service.generate_image(req, effective_prompt=prompt)

                image_uuid, filename, thumb, file_size = await storage_service.save_image_with_thumbnail(
                    image_bytes=result.image_bytes,
                    output_format=result.output_format,
                    metadata={"prompt": prompt, "model": "gpt-image-1"},
                )

                vector = await embedding_service.embed_text(prompt)
                embedding_blob = embedding_service.pack_vector(vector) if vector else None

                image = Image(
                    uuid=image_uuid,
                    prompt=prompt,
                    effective_prompt=prompt,
                    was_translated=False,
                    size="1024x1024",
                    quality="low",
                    background="auto",
                    output_format=result.output_format,
                    prompt_hash=prompt_hash,
                    filename=filename,
                    thumbnail_filename=thumb,
                    file_size=file_size,
                    cost_usd=cost_service.estimate_image_cost_usd(quality="low", size="1024x1024"),
                    embedding=embedding_blob,
                )
                db.add(image)
                await db.commit()
                await db.refresh(image)
                print(f"OK (id={image.id})")

            except Exception as exc:
                print(f"ERROR: {exc}")
                await db.rollback()

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(seed())
