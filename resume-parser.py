import spacy
import PyPDF2
import re

# Automatically download spaCy model if missing
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

def extract_text_from_pdf(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text()
    return text

def extract_skills(text):
    skill_keywords = [
        'python', 'java', 'c++', 'node.js', 'react', 'sql', 'mongodb',
        'machine learning', 'deep learning', 'nlp', 'javascript',
        'html', 'css', 'flask', 'django', 'express'
    ]
    found = []
    for skill in skill_keywords:
        if re.search(r'\\b' + re.escape(skill) + r'\\b', text, re.IGNORECASE):
            found.append(skill)
    return list(set(found))

def extract_info(pdf_path):
    text = extract_text_from_pdf(pdf_path)
    doc = nlp(text)

    name = ""
    email = ""
    phone = ""

    for ent in doc.ents:
        if ent.label_ == "PERSON" and not name:
            name = ent.text
        elif ent.label_ == "EMAIL":
            email = ent.text

    phones = re.findall(r'\\+?\\d[\\d\\s\\-]{8,}\\d', text)
    if phones:
        phone = phones[0]

    skills = extract_skills(text)

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills
    }

# Example usage
if __name__ == "__main__":
    import sys
    info = extract_info(sys.argv[1])
    print(info)
