import re


def clean_for_speech(text: str, max_chars: int = 800) -> str:
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text)          # [link](url) -> link
    text = re.sub(r"^\s*[-•*]\s+", "", text, flags=re.M)      # bullet points
    text = re.sub(r"[*_`#>]+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > max_chars:                                 # cut at a sentence end
        cut = text[:max_chars]
        text = cut[: cut.rfind(".") + 1] or cut
    return text