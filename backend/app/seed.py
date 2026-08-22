"""Demo data seeder. Run with: python -m app.seed [--email E] [--password P] [--demo]"""

import argparse
import sys
from datetime import timedelta

from app.database import SessionLocal
from app.models import Activity, Contact, Interview, Job, JobSource, JobStageHistory, Note, PipelineStage, Task, User
from app.security import hash_password
from app.services.defaults import seed_defaults_for_user
from app.services.notify import refresh_notifications
from app.utils import utcnow


def _dt(days_ago: float, hour: int = 10):
    base = utcnow() - timedelta(days=days_ago)
    return base.replace(hour=hour, minute=0, second=0, microsecond=0)


def build_job(db, user, stages, sources, *, title, company, source_name, location, remote_status,
              employment_type, salary_min, salary_max, description, transitions, reference_id=None):
    """transitions: [(stage_name, changed_at_datetime), ...] oldest first; last is current stage."""
    first_stage_name, first_changed_at = transitions[0]
    stage = stages[first_stage_name]

    job = Job(
        user_id=user.id,
        stage_id=stage.id,
        source_id=sources[source_name].id if source_name else None,
        title=title,
        company=company,
        location=location,
        remote_status=remote_status,
        employment_type=employment_type,
        salary_min=salary_min,
        salary_max=salary_max,
        salary_currency="USD",
        salary_period="annual",
        description=description,
        reference_id=reference_id,
        date_sourced=first_changed_at.date(),
        entered_stage_at=first_changed_at,
        last_activity_at=first_changed_at,
        created_at=first_changed_at,
    )
    db.add(job)
    db.flush()

    db.add(
        Activity(
            user_id=user.id,
            job_id=job.id,
            type="job_created",
            message=f"{title} at {company} added",
            created_at=first_changed_at,
        )
    )

    from_stage = None
    for stage_name, changed_at in transitions:
        to_stage = stages[stage_name]
        db.add(
            JobStageHistory(
                user_id=user.id,
                job_id=job.id,
                from_stage_id=from_stage.id if from_stage else None,
                to_stage_id=to_stage.id,
                from_stage_name=from_stage.name if from_stage else None,
                to_stage_name=to_stage.name,
                changed_at=changed_at,
            )
        )
        if from_stage is not None:
            db.add(
                Activity(
                    user_id=user.id,
                    job_id=job.id,
                    type="stage_changed",
                    message=f"{company} moved to {to_stage.name}",
                    meta={"from": from_stage.name, "to": to_stage.name},
                    created_at=changed_at,
                )
            )
        job.stage_id = to_stage.id
        job.entered_stage_at = changed_at
        job.last_activity_at = changed_at
        from_stage = to_stage

    for stage_name, marker_field in (("Applied", "date_applied"), ("Offer", "offer_date"), ("Rejected", "rejection_date")):
        entry = next((t for t in transitions if t[0] == stage_name), None)
        if entry:
            setattr(job, marker_field, entry[1].date())

    db.flush()
    same_column = [
        j for j in db.query(Job).filter(Job.user_id == user.id, Job.stage_id == job.stage_id).all() if j.id != job.id
    ]
    job.position = len(same_column)

    return job


def add_interview(db, user, job, *, type_label, scheduled_at, status="scheduled", feedback=None, result=None, interviewers=None):
    interview = Interview(
        user_id=user.id,
        job_id=job.id,
        type_label=type_label,
        scheduled_at=scheduled_at,
        interviewers=interviewers,
        status=status,
        feedback=feedback,
        result=result,
        created_at=scheduled_at - timedelta(days=3),
    )
    db.add(interview)
    db.flush()
    activity_type = "interview_completed" if status == "completed" else "interview_created"
    message = (
        f"{type_label} for {job.title} at {job.company} completed"
        if status == "completed"
        else f"{type_label} scheduled for {job.title} at {job.company}"
    )
    db.add(Activity(user_id=user.id, job_id=job.id, type=activity_type, message=message, created_at=scheduled_at))
    if job.last_activity_at < scheduled_at:
        job.last_activity_at = scheduled_at
    return interview


def add_contact(db, job, *, name, job_title, email):
    contact = Contact(job_id=job.id, name=name, job_title=job_title, email=email)
    db.add(contact)
    return contact


def add_task(db, user, job, *, title, due_date, completed=False):
    task = Task(user_id=user.id, job_id=job.id, title=title, due_date=due_date, completed=completed)
    db.add(task)
    return task


def add_note(db, job, *, body, created_at):
    note = Note(job_id=job.id, body=body, created_at=created_at, updated_at=created_at)
    db.add(note)
    return note


def run(email: str, password: str, is_demo: bool) -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing is not None:
            print(f"A user with email '{email}' already exists. Aborting to avoid duplicate demo data.")
            sys.exit(1)

        user = User(email=email, hashed_password=hash_password(password), full_name="Demo User", is_demo=is_demo)
        db.add(user)
        db.flush()
        seed_defaults_for_user(db, user)
        db.flush()

        stages = {s.name: s for s in db.query(PipelineStage).filter_by(user_id=user.id)}
        sources = {s.name: s for s in db.query(JobSource).filter_by(user_id=user.id)}

        jobs: dict[str, Job] = {}

        jobs["nimbus_backend"] = build_job(
            db, user, stages, sources,
            title="Backend Engineer", company="Nimbus Cloud", source_name="LinkedIn",
            location="Remote", remote_status="remote", employment_type="full_time",
            salary_min=120000, salary_max=150000,
            description="Own core billing services for a multi-tenant cloud platform.",
            transitions=[("Interested", _dt(3))],
        )

        jobs["orbital_platform"] = build_job(
            db, user, stages, sources,
            title="Platform Engineer", company="Orbital Systems", source_name="Otta",
            location="London, UK", remote_status="hybrid", employment_type="full_time",
            salary_min=95000, salary_max=115000,
            description="Build internal developer platform tooling for satellite ops software.",
            transitions=[("Interested", _dt(1))],
        )

        jobs["cascade_analyst"] = build_job(
            db, user, stages, sources,
            title="Data Analyst", company="Cascade Analytics", source_name="Indeed",
            location="Remote", remote_status="remote", employment_type="full_time",
            salary_min=75000, salary_max=90000,
            description="Turn marketing funnel data into decisions for the growth team.",
            transitions=[("Interested", _dt(20)), ("Applied", _dt(18))],
        )

        jobs["northwind_robotics_sde"] = build_job(
            db, user, stages, sources,
            title="Robotics Software Engineer", company="Northwind Robotics", source_name="Company website",
            location="Pittsburgh, PA", remote_status="onsite", employment_type="full_time",
            salary_min=110000, salary_max=135000,
            description="Write perception and motion-planning software for warehouse robots.",
            transitions=[("Interested", _dt(15)), ("Applied", _dt(13))],
        )

        jobs["brightpath_fullstack"] = build_job(
            db, user, stages, sources,
            title="Fullstack Developer", company="BrightPath Health", source_name="Referral",
            location="Remote", remote_status="remote", employment_type="full_time",
            salary_min=100000, salary_max=125000,
            description="Ship patient-facing features for a telehealth scheduling product.",
            transitions=[("Interested", _dt(10)), ("Applied", _dt(9))],
        )

        jobs["fenwick_pm"] = build_job(
            db, user, stages, sources,
            title="Product Manager", company="Fenwick & Co", source_name="LinkedIn",
            location="New York, NY", remote_status="hybrid", employment_type="full_time",
            salary_min=130000, salary_max=150000,
            description="Drive roadmap for a B2B compliance workflow product.",
            transitions=[("Interested", _dt(25)), ("Applied", _dt(22)), ("Interview 1", _dt(12))],
        )

        jobs["solstice_gameplay"] = build_job(
            db, user, stages, sources,
            title="Gameplay Engineer", company="Solstice Games", source_name="Networking",
            location="Remote", remote_status="remote", employment_type="full_time",
            salary_min=105000, salary_max=130000,
            description="Build combat systems for an upcoming co-op action title.",
            transitions=[("Interested", _dt(30)), ("Applied", _dt(27)), ("Interview 1", _dt(18)), ("Interview 2", _dt(9))],
        )

        jobs["vertex_devops"] = build_job(
            db, user, stages, sources,
            title="DevOps Engineer", company="Vertex Dynamics", source_name="Recruiter",
            location="Austin, TX", remote_status="hybrid", employment_type="full_time",
            salary_min=115000, salary_max=140000,
            description="Own CI/CD and infrastructure-as-code for a fintech platform.",
            transitions=[
                ("Interested", _dt(28)), ("Applied", _dt(25)), ("Interview 1", _dt(16)), ("Video Interview", _dt(6)),
            ],
        )

        jobs["nimbus_sre"] = build_job(
            db, user, stages, sources,
            title="Site Reliability Engineer", company="Nimbus Cloud", source_name="LinkedIn",
            location="Remote", remote_status="remote", employment_type="full_time",
            salary_min=125000, salary_max=155000,
            description="Keep the core cloud platform's uptime SLOs green.",
            transitions=[
                ("Interested", _dt(35)), ("Applied", _dt(32)), ("Interview 1", _dt(24)),
                ("Video Interview", _dt(14)), ("CEO Interview", _dt(4)),
            ],
        )

        jobs["orbital_ml"] = build_job(
            db, user, stages, sources,
            title="Machine Learning Engineer", company="Orbital Systems", source_name="Otta",
            location="London, UK", remote_status="hybrid", employment_type="full_time",
            salary_min=130000, salary_max=160000,
            description="Build anomaly-detection models for satellite telemetry.",
            transitions=[
                ("Interested", _dt(40)), ("Applied", _dt(37)), ("Interview 1", _dt(28)),
                ("Interview 2", _dt(18)), ("Offer", _dt(5)),
            ],
        )

        jobs["cascade_bi"] = build_job(
            db, user, stages, sources,
            title="BI Engineer", company="Cascade Analytics", source_name="Indeed",
            location="Remote", remote_status="remote", employment_type="full_time",
            salary_min=100000, salary_max=120000,
            description="Build the executive reporting warehouse from scratch.",
            transitions=[("Interested", _dt(45)), ("Applied", _dt(42)), ("Interview 1", _dt(30)), ("Offer", _dt(8))],
        )

        jobs["northwind_firmware"] = build_job(
            db, user, stages, sources,
            title="Firmware Engineer", company="Northwind Robotics", source_name="Company website",
            location="Pittsburgh, PA", remote_status="onsite", employment_type="full_time",
            salary_min=105000, salary_max=125000,
            description="Write embedded control loops for robotic arms.",
            transitions=[
                ("Interested", _dt(50)), ("Applied", _dt(47)), ("Interview 1", _dt(35)), ("Rejected", _dt(20)),
            ],
        )

        jobs["brightpath_qa"] = build_job(
            db, user, stages, sources,
            title="QA Engineer", company="BrightPath Health", source_name="Referral",
            location="Remote", remote_status="remote", employment_type="full_time",
            salary_min=85000, salary_max=100000,
            description="Own test automation for the telehealth scheduling product.",
            transitions=[("Interested", _dt(38)), ("Applied", _dt(35)), ("Rejected", _dt(22))],
        )

        jobs["fenwick_legal_ops"] = build_job(
            db, user, stages, sources,
            title="Legal Ops Analyst", company="Fenwick & Co", source_name="LinkedIn",
            location="New York, NY", remote_status="hybrid", employment_type="full_time",
            salary_min=80000, salary_max=95000,
            description="Streamline contract review workflows for the legal team.",
            transitions=[("Interested", _dt(33)), ("Applied", _dt(30)), ("Withdrawn", _dt(25))],
        )

        jobs["solstice_tech_artist"] = build_job(
            db, user, stages, sources,
            title="Technical Artist", company="Solstice Games", source_name="Networking",
            location="Remote", remote_status="remote", employment_type="contract",
            salary_min=90000, salary_max=110000,
            description="Bridge the gap between art and engine tooling.",
            transitions=[("Interested", _dt(19)), ("Applied", _dt(17)), ("Withdrawn", _dt(11))],
        )

        # --- Interviews: past ones completed with feedback, 2-3 upcoming within 14 days ---
        add_interview(
            db, user, jobs["fenwick_pm"], type_label="Recruiter Screen", scheduled_at=_dt(12),
            status="completed", feedback="Strong communicator, good product sense.", result="advance",
            interviewers="Dana (Recruiter)",
        )
        add_interview(
            db, user, jobs["solstice_gameplay"], type_label="Interview 1", scheduled_at=_dt(18),
            status="completed", feedback="Solid C++ fundamentals, some gaps in networking code.", result="advance",
        )
        add_interview(
            db, user, jobs["solstice_gameplay"], type_label="Interview 2", scheduled_at=_dt(9),
            status="completed", feedback="Great pairing session, team liked the collaboration style.", result="advance",
        )
        add_interview(
            db, user, jobs["vertex_devops"], type_label="Video Interview", scheduled_at=_dt(6),
            status="completed", feedback="Confident with Terraform and Kubernetes, offer likely.", result="advance",
        )
        add_interview(
            db, user, jobs["nimbus_sre"], type_label="CEO Interview", scheduled_at=_dt(4),
            status="completed", feedback="CEO was impressed with incident-response war stories.", result="advance",
        )
        add_interview(
            db, user, jobs["orbital_ml"], type_label="Interview 2", scheduled_at=_dt(18),
            status="completed", feedback="Nailed the take-home review; moved straight to offer.", result="advance",
        )
        # Upcoming, within the next 14 days.
        add_interview(
            db, user, jobs["nimbus_backend"], type_label="Recruiter Screen", scheduled_at=utcnow() + timedelta(days=2, hours=1),
            status="scheduled", interviewers="Priya (Recruiter)",
        )
        add_interview(
            db, user, jobs["orbital_platform"], type_label="Technical Interview", scheduled_at=utcnow() + timedelta(days=5, hours=3),
            status="scheduled", interviewers="Tom, Alicia",
        )
        add_interview(
            db, user, jobs["brightpath_fullstack"], type_label="Hiring Manager", scheduled_at=utcnow() + timedelta(days=10, hours=2),
            status="scheduled", interviewers="Marcus (EM)",
        )

        # --- Contacts ---
        add_contact(db, jobs["nimbus_backend"], name="Priya Sharma", job_title="Technical Recruiter", email="priya@nimbuscloud.example")
        add_contact(db, jobs["orbital_platform"], name="Tom Reyes", job_title="Engineering Manager", email="tom@orbitalsystems.example")
        add_contact(db, jobs["fenwick_pm"], name="Dana Whitfield", job_title="Recruiter", email="dana@fenwickco.example")
        add_contact(db, jobs["nimbus_sre"], name="Chen Wu", job_title="VP Engineering", email="chen@nimbuscloud.example")
        add_contact(db, jobs["orbital_ml"], name="Alicia Ford", job_title="Hiring Manager", email="alicia@orbitalsystems.example")
        add_contact(db, jobs["vertex_devops"], name="Sam Okafor", job_title="Recruiter", email="sam@vertexdynamics.example")

        # --- Tasks: 2 overdue, 1 today, rest future ---
        add_task(db, user, jobs["cascade_analyst"], title="Send follow-up email", due_date=(_dt(2).date()))
        add_task(db, user, jobs["northwind_robotics_sde"], title="Chase recruiter for update", due_date=(_dt(1).date()))
        add_task(db, user, jobs["brightpath_fullstack"], title="Prep portfolio walkthrough", due_date=utcnow().date())
        add_task(db, user, jobs["nimbus_backend"], title="Research Nimbus Cloud's tech stack", due_date=(utcnow() + timedelta(days=1)).date())
        add_task(db, user, jobs["orbital_platform"], title="Prepare system design talking points", due_date=(utcnow() + timedelta(days=4)).date())
        add_task(db, user, jobs["brightpath_fullstack"], title="Send thank-you note after HM interview", due_date=(utcnow() + timedelta(days=10)).date())
        add_task(db, user, jobs["nimbus_sre"], title="Ask about equity refresh timeline", due_date=(utcnow() + timedelta(days=3)).date())
        add_task(db, user, jobs["orbital_ml"], title="Review offer letter with mentor", due_date=(utcnow() + timedelta(days=2)).date())
        add_task(db, user, jobs["cascade_bi"], title="Negotiate start date", due_date=(utcnow() + timedelta(days=5)).date())

        # --- Notes ---
        add_note(db, jobs["nimbus_backend"], body="Recruiter mentioned team is 6 engineers, mostly Python/Go.", created_at=_dt(3))
        add_note(db, jobs["orbital_platform"], body="Role reports to Tom; hybrid is 2 days/week in office.", created_at=_dt(1))
        add_note(db, jobs["cascade_analyst"], body="They use dbt + Snowflake; good fit for my analytics background.", created_at=_dt(19))
        add_note(db, jobs["northwind_robotics_sde"], body="On-site interview would require travel to Pittsburgh.", created_at=_dt(14))
        add_note(db, jobs["brightpath_fullstack"], body="Stack is React + Django; codebase is ~4 years old.", created_at=_dt(9))
        add_note(db, jobs["fenwick_pm"], body="Recruiter screen went well, moving to panel next.", created_at=_dt(11))
        add_note(db, jobs["solstice_gameplay"], body="Studio is fully remote, unusual for games industry.", created_at=_dt(8))
        add_note(db, jobs["vertex_devops"], body="Team uses Terraform + EKS; strong infra-as-code culture.", created_at=_dt(5))
        add_note(db, jobs["nimbus_sre"], body="CEO interview covered incident response philosophy in depth.", created_at=_dt(4))
        add_note(db, jobs["orbital_ml"], body="Offer expected within the week per hiring manager.", created_at=_dt(4))
        add_note(db, jobs["cascade_bi"], body="Negotiating a later start date to finish current notice period.", created_at=_dt(7))
        add_note(db, jobs["northwind_firmware"], body="Rejected after final round — asked for feedback, team went with internal candidate.", created_at=_dt(20))

        db.commit()
        refresh_notifications(db, user.id)

        print(f"Seeded demo user '{email}' (password: {password})")
        print(f"Created {len(jobs)} jobs across {len({j.company for j in jobs.values()})} companies.")
        print("This is demo data for local development only — do not use in production.")
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed JobFlow demo data")
    parser.add_argument("--email", default="demo@jobflow.app")
    parser.add_argument("--password", default="demo1234!")
    parser.add_argument("--demo", action="store_true")
    args = parser.parse_args()
    run(args.email, args.password, args.demo)


if __name__ == "__main__":
    main()
