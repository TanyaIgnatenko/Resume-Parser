import json, re, sys
from pathlib import Path

# Regex dictionaries
SKILL_TERMS = [
    # Programming languages & core libs
    r"Python", r"Java", r"JavaScript", r"TypeScript", r"C\+\+", r"C#", r"\bC\b", r"Rust", r"Go", r"R",
    r"NumPy", r"Pandas", r"scikit-?learn", r"PyTorch", r"TensorFlow", r"Keras", r"LightGBM",
    r"BeautifulSoup", r"Keras", r"CatBoost", r"Seaborn", r"OpenCV",

    # Visualization & analysis
    r"Matplotlib", r"Seaborn", r"Plotly", r"Tableau", r"Power BI", r"D3\.js",
    r"EDA", r"Exploratory Data Analysis", r"Statistical Analysis", r"Statistics", r"Statistical Modeling",
    r"Data Visualization", r"Data Cleaning", r"Data Preprocessing", r"Data Analysis", r"Business analytics",
    r"Regression Analysis", r"Classification", r"Clustering", r"AB-?Testing", r"A/B Testing",

    # ML & AI concepts
    r"Supervised learning", r"Unsupervised learning", r"Machine Learning",
    r"Deep Learning", r"CNNs?", r"RNNs?", r"Transformers?",
    r"Reinforcement Learning", r"Computer Vision", r"Named Entity Recognition",
    r"Feature Engineering", r"Hyperparameter Tuning", r"Algorithms", r"data structures",
    r"NLP", r"Robotics", r"Ray", r"MLflow", r"JAX", r"Hugging Face", r"spaCy",

    # Model evaluation metrics
    r"Model Evaluation", r"Accuracy", r"Precision", r"Recall", r"F1-?score", r"ROC-?AUC",

    # Backend / web frameworks & patterns
    r"Spring Boot", r"Spring", r"Django", r"Django REST Framework", r"DRF", r"Celery",
    r"Flask", r"REST API", r"GraphQL", r"Apollo",
    r"Node\.js", r"Express(\.js)?", r"NestJS", r"gRPC", r"socket\.io",

    # Frontend ecosystem
    r"React(\.js)?", r"Next\.js", r"Redux", r"React hooks", r"React-?router", r"Angular",
    r"redux-?saga", r"redux-?thunk", r"Effector", r"VueJS?",
    r"HTML5?", r"CSS3?", r"SCSS", r"PostCSS", r"JSS",
    r"CSS Modules", r"BEM", r"CSS-?in-?JS", r"Styled components",
    r"Material UI", r"DOM API", r"Canvas API", r"SVG",
    r"PWA", r"Web Workers", r"Push Notifications", r"IndexedDB",
    r"WebSockets?", r"HTTP", r"SSR",
    r"RxJS", r"UI/UX design principles", r"UX",

    # Mobile Development
    r"Kotlin", r"Swift", r"SwiftUI", r"Firebase",

    # Build & dev tools
    r"Webpack", r"Babel", r"npm", r"yarn", r"Bazel",
    r"ESLint", r"Prettier", r"Storybook", r"Chrome Devtools?", r"Figma", r"PyCharm", r"Jupyter Notebook",
    r"Maven", r"Gradle", r"Jenkins", r"TeamCity", r"Splunk", r"Prometheus", r"Grafana",
    r"GitHub Actions", r"Selenium", r"JMeter", r"Postman",

    # DevOps / CI/CD & Infrastructure
    r"CI/CD", r"Git", r"GitHub", r"Bitbucket", r"OpenShift",
    r"Docker", r"Kubernetes", r"Terraform", r"OpenShift",

    # Cloud & big data stack
    r"AWS", r"GCP", r"Azure",
    r"EMR", r"EC2", r"S3", r"DynamoDB", r"SQS", r"SNS", r"Lambda", r"AWS CDK",
    r"AWS Step Functions", r"AWS Batch", r"Athena",
    r"Elasticsearch", r"Elastic ?Search", r"Kafka", r"Spark", r"Hadoop", r"Hive", r"Presto", r"Druid", r"Zookeeper", r"Qubole",
    r"Airflow", r"BigQuery",

    # Monitoring & Logging
    r"ELK",

    # Security
    r"Kali Linux", r"Snort", r"Wireshark",

    # Robotics & Embedded Systems
    r"ROS", r"Embedded Systems", r"Gazebo",

    # Databases
    r"MySQL", r"DB2", r"MongoDB", r"Databases?", r"NoSQL", r"PostgreSQL", r"Oracle", r"ClickHouse", r"Hazelcast", r"\bSQL\b",

    # General tools & collaboration
    r"Git", r"Linux", r"Jupyter Notebook", r"APIs?", r"Excel",
    r"Jira", r"Confluence", r"Cloud platforms?", r"Docker", r"Bash", r"vim", r"LATEX",

    # Methodologies & practices
    r"Agile", r"Scrum", r"SDLC", r"Microservices",
    r"Microservice architecture", r"Micro-?frontend architecture",
    r"Performance Optimization", r"Web Security", r"SEO", r"Web Accessibility", r"a11y",
    r"OOP", r"SOLID", r"Design patterns", r"Clean Code", r"REST API", r"API development",
    r"Unit tests?", r"Integration tests?", r"e2e tests?", r"Screenshot tests?",
    r"Jest", r"React-?testing-?library", r"Cypress", r"Hermione", r"RAII",
    r"Product Roadmaps", r"API Design",

    # Soft/role-adjacent technical skills (keep for recall)
    r"Client Requirement Scoping",
    r"Cross-?functional Collaboration",
    r"Mentoring",
    r"Problem solving",
    r"Debugging",
]




LANGUAGE_TERMS = [
    r"(?:German|French|Spanish|Russian|English)(?:(?:\s+-\s*|\s+)(?:native|fluent|advanced|intermediate|beginner|basic|proficient|working\s+knowledge))?",
    r"(?:native|fluent|advanced|intermediate|beginner|basic|proficient|working\s+knowledge)(?:\s+of)?(?:\s+(?:German|French|Spanish|Russian|English))",
    r"German(?:\s*\([A-C][12]\)|\s*-\s*(Beginner|Intermediate|Advanced|Fluent)|\s*B[12]|C[12])?",
    r"English(?:\s*\([A-C][12]\)|\s*-\s*(Beginner|Intermediate|Advanced|Advanced|Fluent))?",
    r"French(?:\s*\([A-C][12]\)|\s*-\s*(Beginner|Intermediate|Advanced|Fluent))?",
    r"Russian(?:\s*\([A-C][12]\)|\s*-\s*(Beginner|Intermediate|Advanced|Fluent))?",
    r"Spanish(?:\s*\([A-C][12]\)|\s*-\s*(Beginner|Intermediate|Advanced|Fluent))?"
]

# Cleanup helpers
CID = re.compile(r"\(cid:\d+\)")
DEHYPH = re.compile(r"-\s*\n\s*")

def clean_text(s: str) -> str:
    if not s:
        return ""
    s = CID.sub(" ", s)
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = DEHYPH.sub("", s)                  # join hyphenated line breaks
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()

def find_spans(text: str, patterns, label):
    results = []
    for pat in patterns:
        for m in re.finditer(rf"\b(?:{pat})\b", text, flags=re.IGNORECASE):
            start, end = m.start(), m.end()
            results.append({
                "from_name": "label",
                "to_name": "text",
                "type": "labels",
                "value": {
                    "start": start,
                    "end": end,
                    "text": text[start:end],
                    "labels": [label]
                }
            })
    # dedupe overlaps, keep first
    results.sort(key=lambda r: (r["value"]["start"], r["value"]["end"]))
    dedup, last_end = [], -1
    for r in results:
        s, e = r["value"]["start"], r["value"]["end"]
        if s >= last_end:
            dedup.append(r)
            last_end = e
    return dedup

def make_prediction_for(text: str):
    spans = []
    spans += find_spans(text, SKILL_TERMS, "Skill")
    spans += find_spans(text, LANGUAGE_TERMS, "Language")
    return {"result": spans, "score": 0.3, "model_version": "regex_v1"}

def main(in_json: str, out_json: str, with_predictions: bool = True):
    # Read input as JSON array
    data = json.loads(Path(in_json).read_text(encoding="utf-8-sig"))
    if not isinstance(data, list):
        raise ValueError("Input must be a JSON array of objects")

    tasks = []
    for obj in data:
        raw = obj.get("text") or obj.get("data", {}).get("text") or ""
        text = clean_text(raw)
        data_field = {"text": text}
        if "meta" in obj:
            data_field["meta"] = obj["meta"]

        task = {"data": data_field}
        if with_predictions:
            task["predictions"] = [make_prediction_for(text)]
        tasks.append(task)

    # Write a single valid JSON array
    Path(out_json).write_text(json.dumps(tasks, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(tasks)} tasks to {out_json}")

if __name__ == "__main__":
    if len(sys.argv) not in (3, 4):
        print("Usage: python make_prelabels_array.py input.json output.json [--no-pred]")
        sys.exit(2)
    in_path, out_path = sys.argv[1], sys.argv[2]
    with_preds = not (len(sys.argv) == 4 and sys.argv[3] == "--no-pred")
    main(in_path, out_path, with_predictions=with_preds)
