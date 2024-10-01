import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import "./App.css";
import { api } from "./services/api";

// Definir nomes dos meses
const monthNames: string[] = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Interface para um agendamento
interface Booking {
  name: string;
  room: string;
  inital_date: string; 
  final_Date: string; 
}

// Interface para os dados do formulário
interface FormData {
  name: string;
  room: string;
  inital_date: string;
  final_Date: string; 
}

const App: React.FC = () => {
  const today = new Date();
  const year: number = today.getFullYear();
  const month: number = today.getMonth();
  const currentDay: number = today.getDate();

  const [bookings, setBookings] = useState<{ [key: number]: Booking[] }>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [modalActive, setModalActive] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    room: "Sala de Treinamento",
    inital_date: "",
    final_Date: "", // Campo para horário de término
  });

  const daysInMonth: number = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    // Carregar agendamentos ao carregar a página
    const fetchBookings = async () => {
      try {
        const response = await api.get(`/Appointments`);
        const data = response.data;

        const loadedBookings: { [key: number]: Booking[] } = {};
        data.forEach((booking: any) => {
          const day: number = new Date(booking.inital_date).getDate();
          if (!loadedBookings[day]) {
            loadedBookings[day] = [];
          }
          loadedBookings[day].push({
            name: booking.name,
            room: booking.room,
            inital_date: booking.inital_date,
            final_Date: booking.final_Date,
          });
        });
        setBookings(loadedBookings);
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
      }
    };

    fetchBookings();
  }, [year, month]);

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setModalActive(true);
  };

  const handleCloseModal = () => {
    setModalActive(false);
    setFormData({
      name: "",
      room: "Sala de Treinamento",
      inital_date: "",
      final_Date: "", // Resetar o campo de horário de término
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedDay === null) return;

    const { name, room, inital_date, final_Date } = formData; // Desestruturação correta
    const formattedInitialDate = `${year}-${String(month + 1).padStart(
      2,
      "0"
    )}-${String(selectedDay).padStart(2, "0")} ${inital_date}`;
    const formattedFinalDate = `${year}-${String(month + 1).padStart(
      2,
      "0"
    )}-${String(selectedDay).padStart(2, "0")} ${final_Date}`; // Use final_Date

    try {
      // Enviar a requisição POST usando Axios
      const response = await api.post(`/create-appointments`, {
        name,
        room,
        inital_date: formattedInitialDate,
        final_Date: formattedFinalDate,
      });

      console.log(response);

      // Atualizar agendamentos no estado
      setBookings((prevBookings) => {
        const updatedBookings = { ...prevBookings };
        if (!updatedBookings[selectedDay]) {
          updatedBookings[selectedDay] = [];
        }
        updatedBookings[selectedDay].push({ name, room, inital_date: formattedInitialDate, final_Date: formattedFinalDate });
        return updatedBookings;
      });

      // Fechar o modal e resetar o formulário
      handleCloseModal();
    } catch (error: any) {
      if (error.response) {
        console.error("Erro ao salvar o agendamento:", error.response.data);
        alert(
          `Erro: ${
            error.response.data.error || "Falha ao salvar o agendamento."
          }`
        );
      } else if (error.request) {
        console.error("Erro: Nenhuma resposta recebida do servidor.");
        alert(
          "Erro: Não foi possível conectar ao servidor. Por favor, tente novamente."
        );
      } else {
        console.error("Erro ao configurar a requisição:", error.message);
        alert("Ocorreu um erro inesperado. Por favor, tente novamente.");
      }
    }
  };

  const renderBookings = () => {
    if (
      selectedDay === null ||
      !bookings[selectedDay] ||
      bookings[selectedDay].length === 0
    ) {
      return <p>Não há agendamentos para este dia.</p>;
    }

    return (
      <div>
        <h3>Agendamentos:</h3>
        {bookings[selectedDay].map((booking, index) => (
          <div key={index} className="booking">
            <p>
              <strong>Nome:</strong> {booking.name}
            </p>
            <p>
              <strong>Sala:</strong> {booking.room}
            </p>
            <p>
              <strong>Horário de Início:</strong> {booking.inital_date}
            </p>
            <p>
              <strong>Horário de Término:</strong> {booking.final_Date}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="App">
      {/* Header com a data e o mês */}
      <div className="calendar-header">
        <h1>
          Hoje: {currentDay} de {monthNames[month]} de {year}
        </h1>
      </div>

      {/* Tabela de dias do calendário */}
      <div className="calendar">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day: number = i + 1;
          const isPast: boolean = day < currentDay;
          return (
            <div
              key={day}
              className={`day ${isPast ? "past" : ""}`}
              onClick={() => !isPast && handleDayClick(day)}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Modal de Agendamento */}
      {modalActive && selectedDay !== null && (
        <div className="modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseModal}>
              Fechar
            </button>
            <h2>Agendar Sala para o dia {selectedDay}</h2>
            <form onSubmit={handleSubmit} className="booking-form">
              <label htmlFor="name">Nome:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <br />
              <br />

              <label htmlFor="room">Sala:</label>
              <select
                id="room"
                name="room"
                value={formData.room}
                onChange={handleChange}
                required
              >
                <option value="Sala de Treinamento">Sala de Treinamento</option>
                <option value="Sala de Reunião">Sala de Reunião</option>
              </select>
              <br />
              <br />

              <label htmlFor="inital_date">Horário de Início:</label>
              <input
                type="time"
                id="inital_date"
                name="inital_date"
                value={formData.inital_date}
                onChange={handleChange}
                required
              />
              <br />
              <br />

              <label htmlFor="final_Date">Horário de Término:</label>
              <input
                type="time"
                id="final_Date"
                name="final_Date"
                value={formData.final_Date}
                onChange={handleChange}
                required
              />
              <br />
              <br />

              <button type="submit">Agendar</button>
            </form>
            <div id="existingBookings" className="existing-bookings">
              {renderBookings()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
