# Data Deduplication Pipeline
-Delete duplicate and fuzzy (typo-ridden) CRM records to ensure data integrity for business analytics.
-Tech Stack: Python, Pandas, RecordLinkage Toolkit, SQL, Neon (Serverless PostgreSQL).
The Workflow:

    Data Generation: Used the Faker library to generate 1,000 rows of synthetic, messy customer leads, deliberately injecting 200 fuzzy duplicates (e.g., slight name misspellings).

    Database Ingestion: Securely pushed the raw, messy dataset to a live Neon PostgreSQL database (raw_leads table).

    Extraction & Indexing: Extracted the live data into a Pandas DataFrame and applied "blocking" by state to optimize processing power.

    Fuzzy Matching: Utilized the Jarowinkler similarity algorithm (85% threshold) to identify non-exact string matches on names, combined with exact-match rules for emails.

    Cleansing & Re-upload: Successfully identified and dropped the 200 duplicate pairs, pushing the sanitized 800-row dataset back to a clean production table (clean_leads).
