const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const client = require('./db');  // Asegúrate de tener la configuración de tu base de datos aquí

const app = express();
const port = 3000;  // O el puerto que estés usando

// Configurar CORS
app.use(cors());

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());

// Tu código para manejar rutas


app.post('/api/check-turno',async(req,res)=>{
    const { fecha, hora} = req.body;
    try {
        // Verificar que la fecha no sea pasada
        const today = new Date().toISOString().split('T')[0];
        if (new Date(fecha) < new Date(today)) {
            return res.status(400).json({ error: 'La fecha debe ser hoy o en una fecha futura' });
        }

        // Verificar disponibilidad de fecha y hora
        const checkAvailabilityQuery = 'SELECT * FROM turnos WHERE fecha = $1 AND hora = $2';
        const { rows: availabilityRows } = await client.query(checkAvailabilityQuery, [fecha, hora]);

        if (availabilityRows.length > 0) {
            return res.status(400).json({ error: 'Fecha y hora no disponibles' });
        }

        res.status(200).json({ mensaje: 'es posible realizar el turno' });

    } catch (error) {
        console.error('Error en el servidor:', error);  // Agregar detalles del error
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/get-revision',async(req,res)=>{
    try{ 
        const getRevision='SELECT precio,requisitos from revision where tipodevehiculo = $1 '
        const result=await client.query(getRevision,[req.query.tipoVehiculo]);
        res.status(200).json(result.rows[0])
    }
    catch(error){
        console.error('Error en el servidor:', error);  // Agregar detalles del error
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.post('/api/solicitar-turno', async (req, res) => {
    const { fecha, hora, tipoVehiculo, dni,nombre , patente, modelo, telefono } = req.body;

    try {   
        // Insertar o actualizar información del cliente
        const checkClientQuery = 'SELECT * FROM clientes WHERE dni = $1';
        const { rows: clientRows } = await client.query(checkClientQuery, [dni]);

        if (clientRows.length === 1){
            const updateClientQuery = 'update clientes  set telefono= $2, nombre= $3 where dni = $1';
            await client.query(updateClientQuery, [dni, telefono,nombre]);
        }
        if (clientRows.length === 0) {
            const insertClientQuery = 'INSERT INTO clientes (dni, telefono,nombre) VALUES ($1, $2, $3)';
            await client.query(insertClientQuery, [dni, telefono,nombre]);
        }

        // Insertar o actualizar información del vehículo
        const checkVehicleQuery = 'SELECT * FROM vehiculos WHERE patente = $1';
        const { rows: vehicleRows } = await client.query(checkVehicleQuery, [patente]);

        let vehicleId;
        if (vehicleRows.length === 0) {
            const insertVehicleQuery = 'INSERT INTO vehiculos (patente, modelo, tipo_vehiculo, dni) VALUES ($1, $2, $3, $4) RETURNING id';
            const { rows: vehicleInsertRows } = await client.query(insertVehicleQuery, [patente, modelo, tipoVehiculo, dni]);
            vehicleId = vehicleInsertRows[0].id;
        } else {
            vehicleId = vehicleRows[0].id;
        }

        // Insertar el turno
        const insertTurnoQuery = 'INSERT INTO turnos (fecha, hora, vehiculo_id) VALUES ($1, $2, $3)';
        await client.query(insertTurnoQuery, [fecha, hora, vehicleId]);

        res.status(200).json({ mensaje: 'Turno solicitado exitosamente' });
    } catch (error) {
        console.error('Error en el servidor:', error);  // Agregar detalles del error
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.get('/api/testing',async(req,res)=>{

    res.status(200).json({message:"Hello World"})
})

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
