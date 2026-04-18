

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import ptBrLocale from '@fullcalendar/core/locales/pt-br';   // ← Importante!

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { OrdemServico } from "../types/OrdemServico";
import api from "../api/api";

export function CalendarioOSSI() {
  const [events, setEvents] = useState<any[]>([]);
  const navigate = useNavigate();

  // ... seu useEffect de fetch continua igual ...
 useEffect(() => {
    async function fetchData() {
      try {
        const [osRes, siRes] = await Promise.all([
          api.get("/os"),
          api.get("/si"),
        ]);

        const osEvents = osRes.data.map((o: OrdemServico) => ({
          title: `OS ${o.numero_os}`,
          start: o.data_inicio_programado,        // Use "start" (melhor que "date")
          color: "#7c3aed",
          extendedProps: {                        // ← MUITO IMPORTANTE
            tipo: "os",
            id: o.id_os
          }
        }));

        const siEvents = siRes.data.map((s: any) => ({
          title: `SI ${s.numero_si}`,
          start: s.data_inicio_preriodo_total,
          color: "#f59e0b",
          id: s.id_si,
          tipo: "si",
          extendedProps: { tipo: "si", id: s.id_si }
        }));

        setEvents([...osEvents, ...siEvents]);
      } catch (err) {
        console.error("Erro ao carregar calendário:", err);
      }
    }

    fetchData();
  }, []);

    const handleEventClick = (info: any) => {
    const props = info.event.extendedProps;
    if (props?.tipo === "os" && props.id) {
      navigate(`/os/${props.id}`);
    } else if (props?.tipo === "si" && props.id) {
      navigate(`/si/${props.id}`);
    }
  };





  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        locale={ptBrLocale}
        
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek"
        }}
        buttonText={{
          today: "Hoje",
          month: "Mês",
          week: "Semana"
        }}

        eventClick={handleEventClick}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }}
      />
    </div>
  );
}