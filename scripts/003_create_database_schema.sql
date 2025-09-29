-- Crear tabla de residentes
CREATE TABLE IF NOT EXISTS public.residents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('propietario', 'familiar')),
    age INTEGER NOT NULL CHECK (age > 0),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    apartment_number VARCHAR(10) NOT NULL,
    face_encoding TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de logs de acceso
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
    access_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_granted BOOLEAN NOT NULL DEFAULT false,
    confidence_score DECIMAL(5,4),
    notes TEXT
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_residents_email ON public.residents(email);
CREATE INDEX IF NOT EXISTS idx_residents_apartment ON public.residents(apartment_number);
CREATE INDEX IF NOT EXISTS idx_access_logs_resident_id ON public.access_logs(resident_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_time ON public.access_logs(access_time);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad (permitir todas las operaciones por ahora para el MVP)
CREATE POLICY IF NOT EXISTS "Allow all operations on residents" ON public.residents
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all operations on access_logs" ON public.access_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Insertar algunos datos de prueba
INSERT INTO public.residents (name, type, age, email, phone, apartment_number, face_encoding) 
VALUES 
    ('María García', 'propietario', 35, 'maria.garcia@email.com', '+59176543210', '102', 'sample_encoding_1'),
    ('Carlos López', 'familiar', 28, 'carlos.lopez@email.com', '+59176543211', '102', 'sample_encoding_2')
ON CONFLICT (email) DO NOTHING;
