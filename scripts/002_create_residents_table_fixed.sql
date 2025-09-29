-- Crear tabla para residentes del condominio
CREATE TABLE IF NOT EXISTS public.residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('propietario', 'familiar')),
  age INTEGER NOT NULL CHECK (age > 0),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  apartment_number VARCHAR(10) NOT NULL,
  face_encoding TEXT, -- Almacenar la codificación facial como JSON string
  face_image_url TEXT, -- URL de la imagen del rostro
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad (permitir acceso completo para administradores)
CREATE POLICY "Allow full access to residents" ON public.residents
  FOR ALL USING (true);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_residents_apartment ON public.residents(apartment_number);
CREATE INDEX IF NOT EXISTS idx_residents_email ON public.residents(email);
CREATE INDEX IF NOT EXISTS idx_residents_active ON public.residents(is_active);

-- Crear tabla para logs de acceso
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
  access_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_type VARCHAR(50) DEFAULT 'facial_recognition',
  confidence_score DECIMAL(5,4), -- Puntuación de confianza del reconocimiento
  status VARCHAR(20) DEFAULT 'granted' CHECK (status IN ('granted', 'denied')),
  notes TEXT
);

-- Habilitar RLS para logs
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Política para logs de acceso
CREATE POLICY "Allow full access to access_logs" ON public.access_logs
  FOR ALL USING (true);

-- Crear índice para logs
CREATE INDEX IF NOT EXISTS idx_access_logs_resident ON public.access_logs(resident_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_time ON public.access_logs(access_time);

-- Insertar algunos datos de prueba
INSERT INTO public.residents (name, type, age, email, apartment_number, face_encoding, face_image_url) VALUES
('Juan Pérez', 'propietario', 35, 'juan.perez@email.com', '101', '0.1,0.2,0.3,0.4', 'data:image/jpeg;base64,test'),
('María García', 'familiar', 28, 'maria.garcia@email.com', '101', '0.5,0.6,0.7,0.8', 'data:image/jpeg;base64,test2'),
('Carlos López', 'propietario', 42, 'carlos.lopez@email.com', '205', '0.9,1.0,1.1,1.2', 'data:image/jpeg;base64,test3')
ON CONFLICT (email) DO NOTHING;
