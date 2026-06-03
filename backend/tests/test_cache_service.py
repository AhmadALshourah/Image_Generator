from app.services.cache_service import compute_prompt_hash


def _h(**kwargs):
    return compute_prompt_hash(
        effective_prompt=kwargs.get("effective_prompt", "a cat in space"),
        size=kwargs.get("size", "1024x1024"),
        quality=kwargs.get("quality", "auto"),
        background=kwargs.get("background", "auto"),
        output_format=kwargs.get("output_format", "png"),
    )


def test_hash_is_deterministic():
    assert _h() == _h()


def test_whitespace_does_not_change_hash():
    assert _h(effective_prompt="a cat in space") == _h(effective_prompt="  a cat in space  ")


def test_case_does_not_change_hash():
    assert _h(effective_prompt="A CAT IN SPACE") == _h(effective_prompt="a cat in space")


def test_different_options_yield_different_hashes():
    base = _h()
    assert _h(size="1024x1536") != base
    assert _h(quality="high") != base
    assert _h(background="transparent") != base
    assert _h(output_format="webp") != base
    assert _h(effective_prompt="a dog in space") != base


def test_hash_is_sha256_hex():
    h = _h()
    assert len(h) == 64
    int(h, 16)  # raises if not hex
