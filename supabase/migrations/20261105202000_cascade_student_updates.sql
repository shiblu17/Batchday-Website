-- Migration: Add secure student management RPC and cascade sync trigger to registrations
-- This guarantees that when a student's hall/department/name is edited by Admin:
-- 1. batch52_students is updated
-- 2. registrations is immediately updated
-- 3. Leaderboard shifts the score from old hall to new hall
-- 4. Realtime broadcast updates all connected clients live!

-- 1. Secure Admin Manage Student RPC
CREATE OR REPLACE FUNCTION public.secure_admin_manage_student(
  p_action TEXT, -- 'UPDATE', 'INSERT', 'DELETE'
  p_student_id TEXT,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_auth_token TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_roll TEXT;
  v_new_roll TEXT;
  v_new_name TEXT;
  v_new_dept TEXT;
  v_new_hall TEXT;
  v_new_reg TEXT;
BEGIN
  -- Verify super admin session token
  IF p_auth_token <> 'c145831c695ff21cffa243accd032d3f93db4708ea9582b7501efbfb513a1bd5' THEN
    RAISE EXCEPTION 'Unauthorized admin token';
  END IF;

  IF p_action = 'UPDATE' THEN
    SELECT roll_no INTO v_old_roll FROM public.batch52_students WHERE id = p_student_id;
    
    v_new_roll := COALESCE(p_data->>'roll_no', v_old_roll);
    v_new_name := p_data->>'name';
    v_new_dept := p_data->>'department';
    v_new_hall := p_data->>'hall';
    v_new_reg := p_data->>'reg_no';

    -- 1. Update batch52_students master table
    UPDATE public.batch52_students
    SET
      name = COALESCE(v_new_name, name),
      department = COALESCE(v_new_dept, department),
      hall = COALESCE(v_new_hall, hall),
      reg_no = COALESCE(v_new_reg, reg_no),
      roll_no = COALESCE(v_new_roll, roll_no),
      updated_at = now()
    WHERE id = p_student_id;

    -- 2. Cascade immediately to registrations table so hall / department changes
    -- update the Leaderboard, Status pass, ID badge, and attendance instantly!
    UPDATE public.registrations
    SET
      name = COALESCE(v_new_name, name),
      department = COALESCE(v_new_dept, department),
      hall = COALESCE(v_new_hall, hall),
      roll = COALESCE(v_new_roll, roll),
      updated_at = now()
    WHERE roll = v_old_roll OR roll = v_new_roll;

    RETURN jsonb_build_object(
      'success', true, 
      'action', 'UPDATE',
      'id', p_student_id,
      'old_roll', v_old_roll,
      'new_roll', v_new_roll
    );

  ELSIF p_action = 'INSERT' THEN
    INSERT INTO public.batch52_students (
      id,
      sl_no,
      name,
      department,
      hall,
      reg_no,
      roll_no,
      session,
      is_batch52,
      created_at,
      updated_at
    ) VALUES (
      p_student_id,
      COALESCE((p_data->>'sl_no')::INT, 9999),
      p_data->>'name',
      p_data->>'department',
      p_data->>'hall',
      p_data->>'reg_no',
      p_data->>'roll_no',
      COALESCE(p_data->>'session', '2022-2023'),
      true,
      now(),
      now()
    );

    UPDATE public.registrations
    SET
      name = p_data->>'name',
      department = p_data->>'department',
      hall = p_data->>'hall',
      updated_at = now()
    WHERE roll = (p_data->>'roll_no');

    RETURN jsonb_build_object('success', true, 'action', 'INSERT', 'id', p_student_id);

  ELSIF p_action = 'DELETE' THEN
    DELETE FROM public.batch52_students WHERE id = p_student_id;
    RETURN jsonb_build_object('success', true, 'action', 'DELETE', 'id', p_student_id);

  ELSE
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.secure_admin_manage_student TO anon, authenticated;

-- 2. Automated Cascade Trigger (for updates from any source)
CREATE OR REPLACE FUNCTION public.sync_student_changes_to_registrations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.name IS DISTINCT FROM NEW.name) OR
     (OLD.department IS DISTINCT FROM NEW.department) OR
     (OLD.hall IS DISTINCT FROM NEW.hall) OR
     (OLD.roll_no IS DISTINCT FROM NEW.roll_no) THEN
     
     UPDATE public.registrations
     SET
       name = NEW.name,
       department = NEW.department,
       hall = NEW.hall,
       roll = NEW.roll_no,
       updated_at = now()
     WHERE roll = OLD.roll_no OR roll = NEW.roll_no;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_student_to_registrations ON public.batch52_students;
CREATE TRIGGER trg_sync_student_to_registrations
AFTER UPDATE ON public.batch52_students
FOR EACH ROW
EXECUTE FUNCTION public.sync_student_changes_to_registrations();

-- 3. Ensure tables are in realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.batch52_students;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
