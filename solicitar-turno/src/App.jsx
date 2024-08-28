import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import './App.css';

const generateTimeSlots = (startHour, endHour, intervalMinutes) => {
    const slots = [];
    let startTime = new Date();
    startTime.setHours(startHour, 0, 0, 0);

    const endTime = new Date();
    endTime.setHours(endHour, 0, 0, 0);

    while (startTime <= endTime) {
        const hours = startTime.getHours().toString().padStart(2, '0');
        const minutes = startTime.getMinutes().toString().padStart(2, '0');
        slots.push(`${hours}:${minutes}`);
        startTime.setMinutes(startTime.getMinutes() + intervalMinutes);
    }

    return slots;
};

function App() {
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [tipoVehiculo, setTipoVehiculo] = useState('');
    const [dni, setDni] = useState('');
    const [nombre, setNombre] = useState('');
    const [patente, setPatente] = useState('');
    const [modelo, setModelo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [horariosDisponibles, setHorariosDisponibles] = useState([]);
    const [paginaConfirmacion, setPaginaConfirmacion] = useState(false); 
    const [precio,setPrecio] =useState(0)
    const [requisitos,setRequisitos] =useState('')

    // Genera intervalos de tiempo cada 30 minutos entre las 07:00 y las 20:00
    useEffect(() => {
        if (fecha) {
            setHorariosDisponibles(generateTimeSlots(7, 20, 30));
        }
    }, [fecha]);

    // Establece la fecha mínima como la fecha actual
    const minFecha = new Date().toISOString().split('T')[0];

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('https://dsibackend-production.up.railway.app/api/check-turno', {
                fecha,
                hora
            }); 
            const revision=await axios.get('https://dsibackend-production.up.railway.app/api/get-revision', {
                params:{tipoVehiculo:tipoVehiculo}
            }); 
            setPrecio(revision.data.precio)
            setRequisitos(revision.data.requisitos)
            const mensaje = response.data.mensaje;         
            setPaginaConfirmacion(true);
        } catch (error) {
            console.log(error.response)
            if (error.response) {
                setMensaje(error.response.data.error);
            } else {
                setMensaje('Error en la solicitud.');
            }
        }
    };



    const handleConfirmar = async (event) => {
        event.preventDefault()
        const response = await axios.post('https://dsibackend-production.up.railway.app/api/solicitar-turno', {
            fecha,
            hora,
            tipoVehiculo,
            dni,
            nombre,
            patente,
            modelo,
            telefono
        });

        const confirmarOtroTurno = window.confirm(`¿Quieres solicitar otro turno?`);
        if (!confirmarOtroTurno) {
            window.alert(`¡Muchas gracias! Tu turno es para el ${fecha} a las ${hora}.`);
            // Aquí puedes resetear el formulario o redirigir a otra página
            window.location.reload();
        } else {
            // Resetear el estado para volver al formulario inicial
            setPaginaConfirmacion(false);
            setFecha('');
            setHora('');
            setTipoVehiculo('');
            setDni('');
            setNombre('')
            setPatente('');
            setModelo('');
            setTelefono('');
            setMensaje('');
            useState(0);
            useState('');
        }
    };

    if (paginaConfirmacion) {
        return (
            <div className="App">
                <h1>Confirmación</h1>
                <p>Tu turno está programado para el {fecha} a las {hora}.</p>
                <p>El costo del servicio será de ${precio}.</p>
                <p>Recuerde de traer para la revision {requisitos}.</p>
                <button onClick={handleConfirmar}>Aceptar</button>
                <button onClick={() => setPaginaConfirmacion(false)}>Cancelar</button>
            </div>
        );
    }

    return (
        <div className="App">
            <h1>Solicitar Turno</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Fecha:
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        min={minFecha}
                        required
                    />
                </label>
                <label>
                    Hora:
                    <select value={hora} onChange={(e) => setHora(e.target.value)} required>
                        <option value="">Seleccione</option>
                        {horariosDisponibles.map((slot, index) => (
                            <option key={index} value={slot}>{slot}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Tipo de Vehículo:
                    <select value={tipoVehiculo} onChange={(e) => setTipoVehiculo(e.target.value)} required>
                        <option value="">Seleccione</option>
                        <option value="Auto">Auto</option>
                        <option value="Moto">Moto</option>
                        <option value="Camion">Camión</option>
                    </select>
                </label>
                <label>
                
                    DNI:
                    <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} required />
                </label>
                
                <label>
                    Nombre completo:
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </label>
                <label>
                    Patente:
                    <input type="text" value={patente} onChange={(e) => setPatente(e.target.value)} required />
                </label>
                <label>
                    Modelo:
                    <input type="text" value={modelo} onChange={(e) => setModelo(e.target.value)} required />
                </label>
                <label>
                    Teléfono:
                    <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} minLength={10} maxLength={10} required />
                </label>
                <button type="submit">Solicitar Turno</button>
            </form>
            {mensaje && <p>{mensaje}</p>}
        </div>
    );
}

export default App;
