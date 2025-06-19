-- Agrega un comentario opcional del pasajero al finalizar el viaje
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS passenger_comment TEXT;
