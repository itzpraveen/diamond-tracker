# ER Diagram (Text)

Entities and relations:

- users (id) 1---* item_jobs (current_holder_user_id)
- branches (id) 1---* item_jobs (branch_id)
- item_jobs (id) 1---* status_events (job_id)
- item_jobs (id) *---* batches (via batch_items)
- batches (id) 1---* batch_items (batch_id)
- item_jobs (id) 0---* incidents (job_id)
- batches (id) 0---* incidents (batch_id)
- users (id) 1---* incidents (reported_by)
- users (id) 1---* refresh_tokens (user_id)
- users (id) 1---* job_edit_audits (edited_by_user_id)
- item_jobs (id) 1---* job_edit_audits (job_id)

Notes:
- status_events are immutable and append-only.
- item_jobs.current_status is denormalized for fast reads.
- batch_items is a join table with unique (batch_id, job_id).
- overrides require a reason and are captured in status_events.override_reason.
- admin edits are stored in job_edit_audits with before/after values.
