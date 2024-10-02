import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import "./App.css";
import { api } from "./services/api";

// Definir nomes dos meses
const monthNames: string[] = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
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
    final_Date: "",
  });

  const daysInMonth: number = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    // Carregar agendamentos ao carregar a página
    const fetchBookings = async () => {
      try {
        const response = await api.get(`/Appointment`);
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
      final_Date: "",
    });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedDay === null) return;

    const { name, room, inital_date, final_Date } = formData;
    const formattedInitialDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")} ${inital_date}`;
    const formattedFinalDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")} ${final_Date}`;

    // Verificar se já existe um agendamento para a mesma sala e horário
    const dayBookings = bookings[selectedDay] || [];

    const hasConflict = dayBookings.some((booking) => {
      return (
        booking.room === room &&
        ((formattedInitialDate >= booking.inital_date && formattedInitialDate < booking.final_Date) || // Novo início dentro do intervalo
          (formattedFinalDate > booking.inital_date && formattedFinalDate <= booking.final_Date) || // Novo término dentro do intervalo
          (formattedInitialDate <= booking.inital_date && formattedFinalDate >= booking.final_Date)) // Novo agendamento cobre completamente o existente
      );
    });

    if (hasConflict) {
      alert("Já existe um agendamento para essa sala no horário selecionado.");
      return;
    }

    try {
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
        updatedBookings[selectedDay].push({
          name,
          room,
          inital_date: formattedInitialDate,
          final_Date: formattedFinalDate,
        });
        return updatedBookings;
      });

      // Fechar o modal e resetar o formulário
      handleCloseModal();
    } catch (error: any) {
      if (error.response) {
        console.error("Erro ao salvar o agendamento:", error.response.data);
        alert(`Erro: ${error.response.data.error || "Falha ao salvar o agendamento."}`);
      } else {
        console.error("Erro ao configurar a requisição:", error.message);
        alert("Ocorreu um erro inesperado. Por favor, tente novamente.");
      }
    }
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
              <label htmlFor="inital_date">Horário de Início:</label>
              <input
                type="time"
                id="inital_date"
                name="inital_date"
                value={formData.inital_date}
                onChange={handleChange}
                required
              />
              <label htmlFor="final_Date">Horário de Término:</label>
              <input
                type="time"
                id="final_Date"
                name="final_Date"
                value={formData.final_Date}
                onChange={handleChange}
                required
              />
              <button type="submit">Agendar</button>
            </form>
            {/* Renderizando os agendamentos para o dia selecionado */}
            {selectedDay !== null && bookings[selectedDay] && bookings[selectedDay].map((booking, index) => (
              <div key={index} className="booking">
                <p><strong>Nome:</strong> {booking.name}</p>
                <p><strong>Sala:</strong> {booking.room}</p>
                <p><strong>Início:</strong> {booking.inital_date}</p>
                <p><strong>Término:</strong> {booking.final_Date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
