-- Initial Schema Migration: Firebase to Supabase
-- Created: 2026-06-03

-- 1. Custom Types
CREATE TYPE public.user_role AS ENUM ('admin', 'clinician', 'frontdesk');

-- 2. Tables

-- profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  role public.user_role NOT NULL DEFAULT 'clinician',
  role2 public.user_role,
  is_active boolean DEFAULT true,
  email text,
  phone text,
  avatar_url text,
  specialty text,
  assigned_room text,
  days text[],
  hours text,
  gender text,
  doctor_id text,
  updated_at timestamp with time zone DEFAULT now()
);

-- patients table
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  email text,
  dob date,
  gender text,
  ortho_notes text,
  created_at timestamp with time zone DEFAULT now(),
  filling_records jsonb DEFAULT '[]'::jsonb,
  extraction_records jsonb DEFAULT '[]'::jsonb,
  prosthetics_records jsonb DEFAULT '[]'::jsonb,
  risk_level text,
  allergies text,
  weight text,
  height text,
  address text,
  occupation text,
  specialty_records jsonb DEFAULT '{}'::jsonb,
  sessions jsonb DEFAULT '[]'::jsonb,
  avatar_url text
);

-- appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name text,
  patient_phone text,
  doctor_name text,
  date date NOT NULL,
  time time NOT NULL,
  procedure_type text,
  status text,
  notes text,
  quick_notes text,
  attending_clinical_operator text,
  created_at timestamp with time zone DEFAULT now()
);

-- financial_records table
CREATE TABLE public.financial_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id text, -- Supports 'N/A' as per spec
  patient_name text,
  procedure_name text,
  total_cost numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  remaining_amount numeric DEFAULT 0,
  payment_status text,
  date date,
  payment_method text,
  receipt_no text,
  notes text,
  type text CHECK (type IN ('income', 'expense')),
  expense_category text,
  expense_type text,
  period_type text,
  doctor_id text,
  receipt_file_name text,
  receipt_file_content text,
  created_at timestamp with time zone DEFAULT now()
);

-- inventory_items table
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  min_qty numeric DEFAULT 0,
  expiry_date date,
  batch_no text,
  suggested_first boolean DEFAULT false,
  price_per_unit numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamp with time zone DEFAULT now(),
  actor_id uuid REFERENCES auth.users(id),
  user_name text,
  action text,
  resource_type text,
  resource_id text,
  details text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3. Logic (Functions & Triggers)

-- Profile creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role public.user_role;
BEGIN
  -- Attempt to cast role from metadata, default to 'clinician' if invalid or missing
  BEGIN
    v_role := (new.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'clinician';
  END;

  INSERT INTO public.profiles (id, name, username, role, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(v_role, 'clinician'),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Appointment creation with conflict check RPC
CREATE OR REPLACE FUNCTION public.create_appointment(
  p_patient_id uuid,
  p_patient_name text,
  p_patient_phone text,
  p_doctor_name text,
  p_date date,
  p_time time,
  p_procedure_type text,
  p_status text,
  p_notes text DEFAULT NULL,
  p_quick_notes text DEFAULT NULL,
  p_attending_clinical_operator text DEFAULT NULL
)
RETURNS public.appointments AS $$
DECLARE
  v_appointment public.appointments;
BEGIN
  -- Check for double bookings (doctor, date, time) in 'Scheduled', 'Waiting', 'In Chair' status
  -- Normalize 'In chair' vs 'In Chair'
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE doctor_name = p_doctor_name
      AND date = p_date
      AND time = p_time
      AND LOWER(status) IN ('scheduled', 'waiting', 'in chair')
  ) THEN
    RAISE EXCEPTION 'Doctor is already booked at this time.';
  END IF;

  INSERT INTO public.appointments (
    patient_id, patient_name, patient_phone, doctor_name, date, time, 
    procedure_type, status, notes, quick_notes, attending_clinical_operator
  )
  VALUES (
    p_patient_id, p_patient_name, p_patient_phone, p_doctor_name, p_date, p_time,
    p_procedure_type, p_status, p_notes, p_quick_notes, p_attending_clinical_operator
  )
  RETURNING * INTO v_appointment;

  RETURN v_appointment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles." ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Helper function to check if user is authenticated staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'clinician', 'frontdesk')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Patients Policies
CREATE POLICY "Staff can manage patients." ON public.patients
  FOR ALL USING (public.is_staff());

-- Appointments Policies
CREATE POLICY "Staff can manage appointments." ON public.appointments
  FOR ALL USING (public.is_staff());

-- Financial Records Policies
CREATE POLICY "Staff can manage financial records." ON public.financial_records
  FOR ALL USING (public.is_staff());

-- Inventory Policies
CREATE POLICY "Staff can manage inventory." ON public.inventory_items
  FOR ALL USING (public.is_staff());

-- Audit Logs Policies
CREATE POLICY "Admins can read audit logs." ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert audit logs." ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
