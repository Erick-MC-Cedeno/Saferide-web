-- Crear las tablas en Supabase
-- Ejecuta estos comandos en el SQL Editor de Supabase

-- Tabla de pasajeros
CREATE TABLE passengers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL, -- Firebase UID
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_trips INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de conductores
CREATE TABLE drivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL, -- Firebase UID
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    license_number TEXT NOT NULL,
    vehicle_plate TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    vehicle_year TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_trips INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT FALSE,
    current_location JSONB, -- Para almacenar coordenadas GeoJSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de viajes
CREATE TABLE rides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    passenger_id TEXT NOT NULL, -- Firebase UID del pasajero
    passenger_name TEXT NOT NULL,
    driver_id TEXT, -- Firebase UID del conductor
    driver_name TEXT,
    pickup_address TEXT NOT NULL,
    pickup_coordinates JSONB NOT NULL, -- [longitude, latitude]
    destination_address TEXT NOT NULL,
    destination_coordinates JSONB NOT NULL, -- [longitude, latitude]
    status TEXT CHECK (status IN ('pending', 'accepted', 'in-progress', 'completed', 'cancelled')) DEFAULT 'pending',
    estimated_fare DECIMAL(10,2) NOT NULL,
    actual_fare DECIMAL(10,2),
    estimated_duration INTEGER NOT NULL, -- en minutos
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    passenger_rating INTEGER CHECK (passenger_rating >= 1 AND passenger_rating <= 5),
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_passengers_uid ON passengers(uid);
CREATE INDEX idx_drivers_uid ON drivers(uid);
CREATE INDEX idx_drivers_online ON drivers(is_online) WHERE is_online = TRUE;
CREATE INDEX idx_rides_passenger ON rides(passenger_id);
CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_requested_at ON rides(requested_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_passengers_updated_at BEFORE UPDATE ON passengers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad básicas (puedes ajustarlas según tus necesidades)
-- Los usuarios solo pueden ver y editar sus propios datos
CREATE POLICY "Users can view own passenger data" ON passengers
    FOR SELECT USING (uid = auth.uid()::text);

CREATE POLICY "Users can update own passenger data" ON passengers
    FOR UPDATE USING (uid = auth.uid()::text);

CREATE POLICY "Users can insert own passenger data" ON passengers
    FOR INSERT WITH CHECK (uid = auth.uid()::text);

CREATE POLICY "Users can view own driver data" ON drivers
    FOR SELECT USING (uid = auth.uid()::text);

CREATE POLICY "Users can update own driver data" ON drivers
    FOR UPDATE USING (uid = auth.uid()::text);

CREATE POLICY "Users can insert own driver data" ON drivers
    FOR INSERT WITH CHECK (uid = auth.uid()::text);

-- Para rides, permitir que pasajeros y conductores vean sus viajes
CREATE POLICY "Users can view own rides as passenger" ON rides
    FOR SELECT USING (passenger_id = auth.uid()::text);

CREATE POLICY "Users can view own rides as driver" ON rides
    FOR SELECT USING (driver_id = auth.uid()::text);

CREATE POLICY "Passengers can create rides" ON rides
    FOR INSERT WITH CHECK (passenger_id = auth.uid()::text);

CREATE POLICY "Drivers can update rides" ON rides
    FOR UPDATE USING (driver_id = auth.uid()::text OR passenger_id = auth.uid()::text);
