-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'clinician',
    first_name TEXT,
    last_name TEXT,
    organization TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Form templates table
CREATE TABLE IF NOT EXISTS form_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    sections TEXT, -- JSON array of sections
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Form submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER,
    client_name TEXT,
    client_id TEXT,
    form_data TEXT, -- JSON object with form responses
    submitted_by INTEGER,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'draft',
    FOREIGN KEY (template_id) REFERENCES form_templates(id),
    FOREIGN KEY (submitted_by) REFERENCES users(id)
);

-- Sessions table for user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Analytics table for tracking form usage
CREATE TABLE IF NOT EXISTS form_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER,
    event_type TEXT, -- 'view', 'start', 'complete', 'abandon'
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT, -- JSON object with additional data
    FOREIGN KEY (template_id) REFERENCES form_templates(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AI Summaries table for storing AI-generated evaluation summaries
CREATE TABLE IF NOT EXISTS ai_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    summary_content TEXT NOT NULL, -- JSON object with structured summary
    summary_type TEXT DEFAULT 'comprehensive', -- 'comprehensive', 'brief', 'diagnostic'
    model_used TEXT DEFAULT '@cf/meta/llama-3.3-70b-instruct',
    tokens_used INTEGER,
    generation_time_ms INTEGER,
    confidence_score REAL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES form_submissions(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- AI Feedback table for storing clinician feedback and refinement requests
CREATE TABLE IF NOT EXISTS ai_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    summary_id INTEGER NOT NULL,
    feedback_content TEXT NOT NULL,
    refinement_request TEXT,
    feedback_type TEXT DEFAULT 'correction', -- 'correction', 'enhancement', 'validation'
    is_resolved BOOLEAN DEFAULT FALSE,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (summary_id) REFERENCES ai_summaries(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Default form template data
INSERT OR IGNORE INTO form_templates (id, name, description, sections) VALUES
(1, 'Basic Articulation Assessment', 'Standard articulation evaluation form',
'[
    {
        "id": "client_info",
        "title": "Client Information",
        "fields": [
            {"name": "client_name", "type": "text", "label": "Client Name", "required": true},
            {"name": "age", "type": "number", "label": "Age", "required": true},
            {"name": "date_of_birth", "type": "date", "label": "Date of Birth"},
            {"name": "evaluation_date", "type": "date", "label": "Evaluation Date", "required": true}
        ]
    },
    {
        "id": "articulation_tests",
        "title": "Articulation Testing",
        "fields": [
            {"name": "initial_sounds", "type": "checkbox_group", "label": "Initial Sound Production", "options": ["p", "b", "t", "d", "k", "g", "f", "v", "th", "s", "z", "sh", "ch", "j", "l", "r", "w", "y", "h", "m", "n", "ng"]},
            {"name": "medial_sounds", "type": "checkbox_group", "label": "Medial Sound Production", "options": ["p", "b", "t", "d", "k", "g", "f", "v", "th", "s", "z", "sh", "ch", "j", "l", "r", "w", "y", "h", "m", "n", "ng"]},
            {"name": "final_sounds", "type": "checkbox_group", "label": "Final Sound Production", "options": ["p", "b", "t", "d", "k", "g", "f", "v", "th", "s", "z", "sh", "ch", "j", "l", "r", "w", "y", "h", "m", "n", "ng"]}
        ]
    },
    {
        "id": "recommendations",
        "title": "Clinical Recommendations",
        "fields": [
            {"name": "therapy_recommended", "type": "radio", "label": "Therapy Recommended", "options": ["Yes", "No", "Monitor"]},
            {"name": "frequency", "type": "select", "label": "Recommended Frequency", "options": ["1x/week", "2x/week", "3x/week", "Daily"]},
            {"name": "goals", "type": "textarea", "label": "Treatment Goals"},
            {"name": "notes", "type": "textarea", "label": "Additional Notes"}
        ]
    }
]');

-- IPLC Staff User Accounts
INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name, organization) VALUES
('aquin217@fiu.edu', 'ETaVDgxVOoNTTZujLf3ypfXZ3pM1xnDvc5Ayz/HB3SfASWEE5MU6/xyHT+Q8cdgQfB', 'clinician', 'Student', 'Part Time', 'IPLC');

INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name, organization) VALUES
('Bammservices@yahoo.com', '5g5f2KKBIKvUuDsqYuomgQgpic43wKZv9VTp4wHuttFyot4AcVBOBY5qvGyqcu+BMI', 'clinician', 'Maggy', 'Del Valle', 'IPLC');

INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name, organization) VALUES
('giannaiesposito@gmail.com', '/RrrXkQnneMRSoim04eUgknjzJ+noSIgowDQ5995Ekf4+2SjOlG22C0hNT5tZfceLk', 'clinician', 'Gianna', 'Esposito', 'IPLC');

INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name, organization) VALUES
('iguerra.ots@gmail.com', 'KcvbzxCwRD3ET/HzpOd1n4cIOPVCEzvjnPxP9oa2kkesgT2XLR0/FWB+MQMbnWvk2', 'clinician', 'Isabel', 'Guerra', 'IPLC');

INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name, organization) VALUES
('IsaAreces1@gmail.com', 'jpNYxBBmAqy1w/Z+vclfEXpANJzZp3D8HQZUl2bQHXXm9WLh7PYbFMX6eVpDynW/x', 'clinician', 'Isabelle', 'Areces', 'IPLC');

INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name, organization) VALUES
('Karinadelarosa914@gmail.com', 'o5Xr7K9HNIzIYsWjyRfTRbczxfch3SPTcZ2OhGnuWRHCf76y5VVJ3Rq813empGmj', 'clinician', 'Karina', 'De La Rosa', 'IPLC');

INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name, organization) VALUES
('adarley23@gmail.com', 'FeZNcKRnLPjZGlRG7sDMjurzBI9nkErGmYqxb3FTUlS/R9tAbVEt2zbYcWZEzUeB', 'admin', 'Alissa M', 'Darley', 'IPLC');

INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name, organization) VALUES
('Nancyc731@icloud.com', 'otYxmzqKiiKv4hVnz+N8+/Wy3kKht3jCIyUNC/YimNVHpSbAZNacfcgDkWu0O6LH', 'clinician', 'Nancy', 'Beato', 'IPLC');

INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name, organization) VALUES
('iplcmiami@gmail.com', 'WTOmxSF8uS8k1wcc+NV4nEUH7viwnIXget1WPAJ5BUrAi8+7sRwpUAK1ecY/zORm', 'admin', 'IPLC', 'Admin', 'IPLC');