import logging
from typing import List, Dict, Optional
from app.core.database import supabase_admin

logger = logging.getLogger(__name__)

async def run_matchmaker(project_id: str):
    """
    Automatically assigns unassigned tasks to team members based on their technical roles.
    Distributes tasks to balance workload among members with the same role.
    """
    logger.info(f"Running Matchmaker for project {project_id}")
    
    try:
        # 1. Fetch unassigned tasks that aren't done
        tasks_res = (
            supabase_admin.table("project_tasks")
            .select("*")
            .eq("project_id", project_id)
            .is_("assigned_to", "null")
            .neq("status", "done")
            .execute()
        )
        unassigned_tasks = tasks_res.data
        if not unassigned_tasks:
            logger.info("No unassigned tasks found.")
            return
            
        # 2. Fetch project members with their technical roles
        members_res = (
            supabase_admin.table("project_members")
            .select("user_id, technical_role")
            .eq("project_id", project_id)
            .execute()
        )
        members = members_res.data
        
        # Add owner to the members list if they want to participate? 
        # For now, let's just use explicit project_members.
        
        if not members:
            logger.info("No team members found for assignment.")
            return
            
        # Filter members who have a defined role
        role_members = [m for m in members if m.get("technical_role")]
        if not role_members:
            logger.info("No team members with technical roles found.")
            return

        # 3. Fetch current workloads (active tasks per member)
        active_tasks_res = (
            supabase_admin.table("project_tasks")
            .select("assigned_to")
            .eq("project_id", project_id)
            .neq("status", "done")
            .not_is("assigned_to", "null")
            .execute()
        )
        
        # Calculate workload counts
        workloads: Dict[str, int] = {m["user_id"]: 0 for m in role_members}
        for t in active_tasks_res.data:
            user_id = t["assigned_to"]
            if user_id in workloads:
                workloads[user_id] += 1
                
        # 4. Perform assignment
        updates = []
        for task in unassigned_tasks:
            required_role = task.get("required_role")
            if not required_role:
                continue
                
            req_role_lower = required_role.strip().lower()
            
            # Find eligible members
            eligible_members = [
                m for m in role_members 
                if m["technical_role"].strip().lower() == req_role_lower
            ]
            
            if eligible_members:
                # Pick the member with the lowest workload
                chosen_member = min(eligible_members, key=lambda m: workloads[m["user_id"]])
                chosen_id = chosen_member["user_id"]
                
                updates.append({
                    "id": task["id"],
                    "assigned_to": chosen_id
                })
                
                # Increment their workload
                workloads[chosen_id] += 1
                
        # 5. Apply updates
        if updates:
            logger.info(f"Assigning {len(updates)} tasks.")
            # Supabase Python client doesn't support bulk update natively in one call easily via ORM,
            # so we iterate or use upsert. Upsert works if we include all required fields, but we only have id and assigned_to.
            # So we will update one by one.
            for u in updates:
                supabase_admin.table("project_tasks").update({"assigned_to": u["assigned_to"]}).eq("id", u["id"]).execute()
                
            logger.info("Matchmaker assignments completed.")
        else:
            logger.info("No suitable members found for unassigned tasks.")

    except Exception as e:
        logger.error(f"Error running matchmaker: {e}")
