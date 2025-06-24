-- Agregar columna cancellation_reason y cancelled_at a la tabla rides
ALTER TABLE rides
ADD COLUMN cancellation_reason TEXT;

ALTER TABLE rides
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;

-- Actualizar los registros existentes con un valor por defecto (opcional)
UPDATE rides 
SET cancellation_reason = 'No reason provided'
WHERE status = 'cancelled' AND cancellation_reason IS NULL;
